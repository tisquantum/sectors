import { Phase } from '@prisma/client';
import { PhaseService } from '@server/phase/phase.service';
import { TRPCError } from '@trpc/server';

interface Context {
    phaseService: PhaseService;
    gameId: string;
    mutationName?: string;
    playerId?: string;
    userId?: string;
}

// Middleware to check phase restrictions
export const checkPhase = async ({
  ctx,
  next,
}: {
  ctx: Context;
  next: () => Promise<any>;
}) => {
  // Example: Check if the current phase allows the mutation
  const currentPhase = await ctx.phaseService.currentPhase(ctx.gameId);
  if(ctx.mutationName) {
    if (!currentPhase || !isPhaseAllowed(currentPhase, ctx.mutationName)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Operation not allowed in the current phase' });
    }
  }

  return next();
};

// Middleware to check player restrictions
export const checkPlayer = async ({
  ctx,
  next,
}: {
  ctx: Context;
  next: () => Promise<any>;
}) => {
  // Example: Check if the player is trying to modify their own data
  if (!isPlayerAllowed(ctx.playerId || '', ctx.userId || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only modify your own data' });
  }

  return next();
};

const checkUser = async ({
    ctx,
    next,
    }: {
    ctx: Context;
    next: () => Promise<any>;
    }) => {
    // Example: Check if the user is allowed to perform the mutation
    if (!ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You must be logged in to perform this operation' });
    }  
    return next();
};

// Example functions to check phase and player restrictions
const isPhaseAllowed = (phase: Phase, mutationName: string) => {
  // Add your logic to check if the phase allows the mutation
  return true;
};

const isPlayerAllowed = (playerId: string, userId: string) => {
  // Add your logic to check if the player is allowed to modify the data
  return true;
};
