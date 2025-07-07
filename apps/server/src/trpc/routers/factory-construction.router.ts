import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { FactoryConstructionService } from '../../factory-construction/factory-construction.service';
import { Company, FactorySize, PhaseName, ResourceType, Sector } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { TrpcService } from '../trpc.service';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { GamesService } from '@server/games/games.service';
import { getNumberForFactorySize, validFactorySizeForSectorTechnologyLevel } from '@server/data/helpers';
import { SectorService } from '@server/sector/sector.service';

type Context = {
  factoryConstructionService: FactoryConstructionService;
  playerService: PlayersService;
  phaseService: PhaseService;
  gamesService: GamesService;
  sectorService: SectorService;
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
      
      //ensure factory size is valid for the sector technologyLevel
      const sector = await ctx.sectorService.sector({ id: company.sectorId ?? '' });
      if(!sector) {
        throw new Error('Sector not found');
      }
      if(validFactorySizeForSectorTechnologyLevel(input.size, sector.technologyLevel)) {
        throw new Error('Factory size is not valid for the sector technology level');
      }

      //ensure resource types don't exceed the factory size
      const resourceTypes = input.resourceTypes;
      const factorySize = input.size;
      const resourceTypeCounts = resourceTypes.length;
      if(resourceTypeCounts > getNumberForFactorySize(factorySize) + 1) {
        throw new Error('Resource types exceed the factory size');
      }

      // Create the factory construction order
      return ctx.factoryConstructionService.createOrder({
        ...input,
        playerId: ctxMiddleware.submittingPlayerId,
      });
    }),
}); 