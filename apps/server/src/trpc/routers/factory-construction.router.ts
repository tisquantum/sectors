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
import { CompanyService } from '@server/company/company.service';
import { FactoryConstructionOrderService } from '../../factory-construction/factory-construction-order.service';
import { FactoryService } from '../../factory/factory.service';
import { PrismaService } from '@server/prisma/prisma.service';
import { GameTurnService } from '@server/game-turn/game-turn.service';

type Context = {
  factoryConstructionService: FactoryConstructionService;
  factoryConstructionOrderService: FactoryConstructionOrderService;
  factoryService: FactoryService;
  prismaService: PrismaService;
  playerService: PlayersService;
  phaseService: PhaseService;
  gamesService: GamesService;
  gameTurnService: GameTurnService;
  sectorService: SectorService;
  companyService: CompanyService;
};

export const factoryConstructionRouter = (trpc: TrpcService, ctx: Context) => router({
  createOrder: publicProcedure
    .input(z.object({
      companyId: z.string(),
      gameId: z.string(),
      playerId: z.string(),
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
      
      // Validate company ownership (CEO)
      const company = await ctx.companyService.company({
        id: input.companyId,
      });

      if (!company) {
        throw new Error('Company not found');
      }

      if (company.ceoId !== ctxMiddleware.submittingPlayerId) {
        throw new Error('Only the CEO can submit factory construction orders');
      }
      
      if (!company.sectorId) {
        throw new Error('Company has no sector assigned');
      }
      
      //ensure factory size is valid for the sector technologyLevel
      const sector = await ctx.sectorService.sector({ id: company.sectorId });
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

  // Get outstanding factory construction orders for a company
  getOutstandingOrders: publicProcedure
    .input(z.object({
      companyId: z.string(),
      gameId: z.string(),
      gameTurnId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Get current turn if not provided
      let gameTurnId = input.gameTurnId;
      if (!gameTurnId) {
        const currentTurn = await ctx.gameTurnService.getCurrentTurn(input.gameId);
        if (!currentTurn) {
          return [];
        }
        gameTurnId = currentTurn.id;
      }

      // Get all orders for this company in the current turn
      const orders = await ctx.factoryConstructionOrderService.factoryConstructionOrdersWithRelations({
        where: {
          companyId: input.companyId,
          gameId: input.gameId,
          gameTurnId: gameTurnId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return orders;
    }),

  // Get construction history for a company (factories built)
  getConstructionHistory: publicProcedure
    .input(z.object({
      companyId: z.string(),
      gameId: z.string(),
    }))
    .query(async ({ input }) => {
      // Get all factories for this company, ordered by creation date
      const factories = await ctx.prismaService.factory.findMany({
        where: {
          companyId: input.companyId,
          gameId: input.gameId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          Sector: true,
        },
      });

      return factories;
    }),
}); 