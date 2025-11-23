import { Phase, PhaseName } from '@prisma/client';
import { PhaseService } from '@server/phase/phase.service';
import { TRPCError } from '@trpc/server';
import { Context } from './trpc.context';
import { phaseTimes } from '@server/data/constants';
import { PlayersService } from '@server/players/players.service';
import { GamesService } from '@server/games/games.service';

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
export const checkIsPlayerAction = async (
  opts: any,
  playerService: PlayersService,
) => {
  const { ctx, input, next } = opts;
  console.log('input', input);
  //get user from player
  const player = await playerService.player({ id: input.playerId });
  if (!player) {
    console.error('Player not found checkIsPlayerAction');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Player not found',
    });
  }
  console.log('player', player.id);
  // Example: Check if the player is allowed to perform the mutation
  if (player.userId !== ctx.user.id) {
    console.error(
      `Player ${player.id} is not allowed to perform this operation ${ctx.mutationName}`,
    );
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not allowed to perform this operation',
    });
  }
  //include game id in ctx
  ctx.gameId = player.gameId;
  ctx.submittingPlayerId = player.id;
  return next();
};

export const checkIsPlayerActionBasedOnAuth = async (
  opts: any,
  playerService: PlayersService,
) => {
  const { ctx, input, next } = opts;
  //TODO: This isn't going to work as it's just grabbing a player based on the user id,
  //we need something more specific, probably data including in the JWT
  const player = await playerService.player({ userId: ctx.user.id });
  if (!player) {
    console.error('Player not found checkIsPlayerActionBasedOnAuth');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Player not found',
    });
  }
  if (player.userId !== ctx.user.id) {
    console.error(
      `Player ${player.id} is not allowed to perform this operation ${ctx.mutationName}`,
    );
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not allowed to perform this operation',
    });
  }
  ctx.gameId = player.gameId;
  ctx.submittingPlayerId = player.id;
  return next();
};

export const checkSubmissionTime = async (
  phaseName: PhaseName | PhaseName[],
  opts: any,
  phaseService: PhaseService,
  gameService: GamesService,
) => {
  const { ctx, input, next } = opts;
  const submissionStamp = Date.now();
  if (!ctx.gameId && !input.gameId) {
    console.error('Game ID is required');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Game ID is required',
    });
  }
  //because this looks at "current phase", do we need something to look at _the_ phase
  // the action is being performed in?  is current phase reliable for this check?
  const isTimerless = await gameService.isTimerless(ctx.gameId);
  //isn't there a chance for this to be true if the phase we're actually trying to
  //look at is over? what if the next phase starts and the player is acting on action not relative to that phase?  it's valid in the middleware
  //get current phase
  //the input needs to have phaseId, phaseName and gameTurn that we cross-reference with currentPhase, if it is not equivalent, the middleware should fail
  const phase = await phaseService.currentPhase(ctx.gameId || input.gameId);
  if (!phase) {
    console.error('Phase not found');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Phase not found',
    });
  }
  // Check if phase matches (supports single phase or array of phases)
  const allowedPhases = Array.isArray(phaseName) ? phaseName : [phaseName];
  if (!allowedPhases.includes(phase.name)) {
    console.error('Phase does not match');
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Phase does not match',
    });
  }
  if (isTimerless) {
    return next();
  }
  if (!phase.phaseStartTime) {
    console.error('Phase start time not found');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Phase start time not found',
    });
  }
  //check if submission time is within the end time for the current phase
  const phaseEndTime = phase.phaseStartTime.getTime() + phase.phaseTime;
  console.log('phaseEndTime', phaseEndTime);
  console.log('submissionStamp', submissionStamp);
  if (submissionStamp > phaseEndTime) {
    console.error('Submission time has passed');
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Submission time has passed',
    });
  }
  //pass submissionStamp to the next middleware
  ctx.submissionStamp = new Date(submissionStamp);
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
