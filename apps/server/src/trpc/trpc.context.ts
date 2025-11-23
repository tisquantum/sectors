import { createClient, User } from '@supabase/supabase-js';
import type * as express from 'express';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { TRPCError } from '@trpc/server';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/dist/adapters/node-http';

// Ensure Supabase client is created once
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CreateExpressContextOptions = NodeHTTPCreateContextFnOptions<
  express.Request,
  express.Response
>;

export interface Context {
  req: express.Request;
  res: express.Response;
  user: User | null; // Use the User type from Supabase
  submissionStamp?: Date;
  gameId?: string;
  submittingPlayerId?: string;
}

export const createContext = async (
  opts: CreateExpressContextOptions,
): Promise<Context> => {
  const { req, res } = opts;
  if (!req) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Request object not found',
    });
  }
  if (!res) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Response object not found',
    });
  }
  // Extract the user's token from the request headers
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No authorization token provided',
    });
  }

  // Retrieve user session from Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Failed to authenticate user',
    });
  }

  const user = data.user;
  return {
    req,
    res,
    user,
  };
};