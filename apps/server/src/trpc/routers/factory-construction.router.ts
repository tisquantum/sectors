import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { FactoryConstructionService } from '../../factory-construction/factory-construction.service';
import { Company, FactorySize, PhaseName, ResourceType, Sector } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { TrpcService } from '../trpc.service';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { GamesService } from '@server/games/games.service';

type Context = {
  factoryConstructionService: FactoryConstructionService;
  playerService: PlayersService;
  phaseService: PhaseService;
  gamesService: GamesService;
};

export const factoryConstructionRouter = (trpc: TrpcService, ctx: Context) => router({
  createOrder: publicProcedure
    .input(z.object({
      companyId: z.string(),
      gameId: z.string(),
      size: z.nativeEnum(FactorySize),
      resourceTypes: z.array(z.nativeEnum(ResourceType)),
    }))
    .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
    .use(async (opts) =>
      checkSubmissionTime(
        PhaseName.FACTORY_CONSTRUCTION, //TODO: don't assume this is the phase
        opts,
        ctx.phaseService,
        ctx.gamesService,
      ),
    )
    .mutation(async ({ input, ctx: ctxMiddleware }) => {
      if (!ctxMiddleware.submittingPlayerId) {
        throw new Error('Player ID is required');
      }

      // Validate that the company belongs to the submitting player
      const company = await ctx.factoryConstructionService.validateCompanyOwnership(
        input.companyId,
        ctxMiddleware.submittingPlayerId,
      ) as Company | null;

      if (!company) {
        throw new Error('Company not found or not owned by player');
      }

      // Create the factory construction order
      return ctx.factoryConstructionService.createOrder({
        ...input,
        playerId: ctxMiddleware.submittingPlayerId,
      });
    }),
}); 