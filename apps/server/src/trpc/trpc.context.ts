import { TRPCError } from '@trpc/server';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/dist/adapters/node-http';
import { inferAsyncReturnType } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { FactoryService } from '../factory/factory.service';
import { MarketingService } from '../marketing/marketing.service';
import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

// Ensure Supabase client is created once
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
);

export interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  gameId?: string;
  submittingPlayerId?: string;
  prisma: PrismaService;
  factoryService: FactoryService;
  marketingService: MarketingService;
  submissionStamp?: Date;
}

export async function createContext({
  req,
  res,
}: NodeHTTPCreateContextFnOptions<IncomingMessage, ServerResponse>): Promise<Context> {
  try {
    // Get session from cookie
    const cookie = req.headers.cookie;
    if (!cookie) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No session cookie found',
      });
    }

    // Extract session from cookie
    const sessionCookie = cookie
      .split(';')
      .find((c: string) => c.trim().startsWith('sb-'));
    if (!sessionCookie) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No session cookie found',
      });
    }

    const session = sessionCookie.split('=')[1];
    const { data, error } = await supabase.auth.getUser(session);

    if (error || !data.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid session',
      });
    }

    const user = data.user;
    const prisma = new PrismaService();
    const factoryService = new FactoryService(prisma);
    const marketingService = new MarketingService(prisma);

    return {
      req,
      res,
      user,
      prisma,
      factoryService,
      marketingService,
    };
  } catch (error) {
    // If there's an error, return context without user
    const prisma = new PrismaService();
    const factoryService = new FactoryService(prisma);
    const marketingService = new MarketingService(prisma);

    return {
      req,
      res,
      prisma,
      factoryService,
      marketingService,
    };
  }
}

export type TrpcContext = inferAsyncReturnType<typeof createContext>;
