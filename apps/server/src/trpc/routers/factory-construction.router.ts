import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { FactoryConstructionService } from '../../factory-construction/factory-construction.service';
import { Company, FactorySize, PhaseName, ResourceType, Sector, CompanyStatus } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { TrpcService } from '../trpc.service';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { GamesService } from '@server/games/games.service';
import { getNumberForFactorySize, validFactorySizeForResearchStage } from '@server/data/helpers';
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
        [PhaseName.FACTORY_CONSTRUCTION, PhaseName.MODERN_OPERATIONS], // Allow both old and new phase names
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

      // Check if company is active or insolvent (inactive companies cannot operate)
      if (company.status !== CompanyStatus.ACTIVE && company.status !== CompanyStatus.INSOLVENT) {
        throw new Error(`Only active or insolvent companies can construct factories. Company status: ${company.status}`);
      }
      
      if (!company.sectorId) {
        throw new Error('Company has no sector assigned');
      }
      
      // Ensure factory size is valid for the sector research stage
      const sector = await ctx.sectorService.sector({ id: company.sectorId });
      if(!sector) {
        throw new Error('Sector not found');
      }
      
      // Calculate research stage from researchMarker (0-5 = Stage 1, 6-10 = Stage 2, 11-15 = Stage 3, 16-20+ = Stage 4)
      const researchMarker = sector.researchMarker || 0;
      let researchStage = 1;
      if (researchMarker >= 16) {
        researchStage = 4;
      } else if (researchMarker >= 11) {
        researchStage = 3;
      } else if (researchMarker >= 6) {
        researchStage = 2;
      }
      
      if(!validFactorySizeForResearchStage(input.size, researchStage)) {
        throw new Error(`Factory size ${input.size} is not valid for research stage ${researchStage} (researchMarker: ${researchMarker})`);
      }

      //ensure resource types don't exceed the factory size
      const resourceTypes = input.resourceTypes;
      const factorySize = input.size;
      const resourceTypeCounts = resourceTypes.length;
      if(resourceTypeCounts > getNumberForFactorySize(factorySize) + 1) {
        throw new Error('Resource types exceed the factory size');
      }

      // Calculate factory construction cost to validate cash
      // Get current resource prices
      const resources = await ctx.prismaService.resource.findMany({
        where: { gameId: input.gameId },
      });
      const resourcePriceMap = new Map(resources.map(r => [r.type, r.price]));
      
      // Calculate total resource cost (sum of current prices, one of each resource type)
      let totalResourceCost = 0;
      for (const resourceType of resourceTypes) {
        const price = resourcePriceMap.get(resourceType) || 0;
        totalResourceCost += price;
      }
      
      // Factory construction cost = (sum of resource prices) × factory size + $100
      const factorySizeNumber = getNumberForFactorySize(factorySize);
      const constructionCost = (totalResourceCost * factorySizeNumber) + 100;
      
      // Get pending factory construction orders for this company in this turn
      const game = await ctx.gamesService.game({ id: input.gameId });
      if (!game?.currentTurn) {
        throw new Error('Game has no current turn');
      }
      
      const pendingOrders = await ctx.factoryConstructionOrderService.factoryConstructionOrdersWithRelations({
        where: {
          companyId: input.companyId,
          gameId: input.gameId,
          gameTurnId: game.currentTurn,
        },
      });
      
      // Calculate total cost of pending orders (using same calculation)
      let totalPendingCost = 0;
      for (const order of pendingOrders) {
        let orderResourceCost = 0;
        for (const resourceType of order.resourceTypes) {
          const price = resourcePriceMap.get(resourceType) || 0;
          orderResourceCost += price;
        }
        const orderFactorySizeNumber = getNumberForFactorySize(order.size);
        totalPendingCost += (orderResourceCost * orderFactorySizeNumber) + 100;
      }
      
      // Check if company can afford this order plus all pending orders
      const totalCost = totalPendingCost + constructionCost;
      if (company.cashOnHand < totalCost) {
        throw new Error(`Insufficient funds. This factory costs $${constructionCost}, and you have $${totalPendingCost} in pending orders. Total needed: $${totalCost}, but company only has $${company.cashOnHand}.`);
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