import { Phase } from '@prisma/client';
import { PhaseService } from '@server/phase/phase.service';
import { TRPCError } from '@trpc/server';
import { Context } from './trpc.context';

// Middleware to check phase restrictions
// export const checkPhase = async ({
//   ctx,
//   next,
// }: {
//   ctx: Context;
//   next: () => Promise<any>;
// }) => {
//   // Example: Check if the current phase allows the mutation
//   const currentPhase = await ctx.phaseService.currentPhase(ctx.gameId);
//   if(ctx.mutationName) {
//     if (!currentPhase || !isPhaseAllowed(currentPhase, ctx.mutationName)) {
//         throw new TRPCError({ code: 'FORBIDDEN', message: 'Operation not allowed in the current phase' });
//     }
//   }

//   return next();
// };

export const checkIsUserAction = async (opts: any) => {
  const { ctx, input, next } = opts;
  console.log('input', input);
  console.log('ctx user', ctx.user);
  console.log('ctx req', ctx.req.method);
  console.log('ctx mutationName', ctx.mutationName);
  console.log('next', next);
  // Example: Check if the user is allowed to perform the mutation
  if (!ctx.user) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be logged in to perform this operation',
    });
  }
  if (ctx.req.method === 'POST') {
    if (input.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not allowed to perform this operation',
      });
    }
  }
  return next();
};

//check if player action
export const checkIsPlayerAction = async (opts: any) => {
  const { ctx, input, next } = opts;
  //get user from player
  const player = await ctx.prismaService.player.findUnique({
    where: { id: input.playerId },
  });
  // Example: Check if the player is allowed to perform the mutation
  if(player.userId !== ctx.user.id) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not allowed to perform this operation',
    });
  }
  return next();
}

// Example functions to check phase and player restrictions
const isPhaseAllowed = (phase: Phase, mutationName: string) => {
  // Add your logic to check if the phase allows the mutation
  return true;
};

const isPlayerAllowed = (playerId: string, userId: string) => {
  // Add your logic to check if the player is allowed to modify the data
  return true;
};
