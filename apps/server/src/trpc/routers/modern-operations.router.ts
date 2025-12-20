import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { MarketingCampaignTier, MarketingCampaignStatus, PhaseName, ResourceType, OperationMechanicsVersion, CompanyStatus } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { GamesService } from '@server/games/games.service';
import { MarketingService } from '@server/marketing/marketing.service';
import { CompanyService } from '@server/company/company.service';
import { PrismaService } from '@server/prisma/prisma.service';
import { SectorService } from '@server/sector/sector.service';
import { RESEARCH_COSTS_BY_PHASE } from '@server/data/constants';
import { GameTurnService } from '@server/game-turn/game-turn.service';

type Context = {
  marketingService: MarketingService;
  companyService: CompanyService;
  playerService: PlayersService;
  phaseService: PhaseService;
  gamesService: GamesService;
  prismaService: PrismaService;
  sectorService: SectorService;
  gameTurnService: GameTurnService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    // Marketing campaign creation for modern mechanics
    submitMarketingCampaign: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
        playerId: z.string(),
        tier: z.nativeEnum(MarketingCampaignTier),
        slot: z.number().int().min(1).max(3),
        resourceTypes: z.array(z.nativeEnum(ResourceType)), // Resources selected by player
      }))
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) =>
        checkSubmissionTime(
          [PhaseName.MARKETING_AND_RESEARCH_ACTION, PhaseName.MODERN_OPERATIONS], // Allow both old and new phase names
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
          throw new Error('Only the CEO can submit marketing campaigns');
        }

        // Check if company is active or insolvent (inactive companies cannot operate)
        if (company.status !== CompanyStatus.ACTIVE && company.status !== CompanyStatus.INSOLVENT) {
          throw new Error(`Only active or insolvent companies can create marketing campaigns. Company status: ${company.status}`);
        }

        // Get game to determine operation mechanics version
        const game = await ctx.gamesService.game({ id: input.gameId });
        if (!game) {
          throw new Error('Game not found');
        }

        // Create the marketing campaign
        return ctx.marketingService.createCampaign({
          companyId: input.companyId,
          gameId: input.gameId,
          tier: input.tier,
          operationMechanicsVersion: game.operationMechanicsVersion || OperationMechanicsVersion.MODERN,
          resourceTypes: input.resourceTypes,
        });
      }),

    // Research action submission
    submitResearchAction: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
        playerId: z.string(),
        sectorId: z.string(),
      }))
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) =>
        checkSubmissionTime(
          [PhaseName.MARKETING_AND_RESEARCH_ACTION, PhaseName.MODERN_OPERATIONS], // Allow both old and new phase names
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
          throw new Error('Only the CEO can submit research actions');
        }

        // Check if company is active or insolvent (inactive companies cannot operate)
        if (company.status !== CompanyStatus.ACTIVE && company.status !== CompanyStatus.INSOLVENT) {
          throw new Error(`Only active or insolvent companies can perform research. Company status: ${company.status}`);
        }

        // Get current game and phase
        const game = await ctx.gamesService.game({ id: input.gameId });
        if (!game || !game.currentPhaseId) {
          throw new Error('Game or phase not found');
        }

        if (!game.currentTurn) {
          throw new Error('Game has no current turn');
        }

        // Get current phase
        const currentPhase = await ctx.phaseService.currentPhase(input.gameId);
        if (!currentPhase) {
          throw new Error('Current phase not found');
        }

        // Get sector to determine research stage based on researchMarker
        const sector = await ctx.sectorService.sector({ id: input.sectorId });
        if (!sector) {
          throw new Error('Sector not found');
        }

        // Calculate research cost based on sector research stage (researchMarker)
        // Research track has 20 spaces divided into 4 stages of 5 spaces each
        // Stage 1: 0-5 ($100), Stage 2: 6-10 ($200), Stage 3: 11-15 ($300), Stage 4: 16-20 ($400)
        const researchStage = Math.min(Math.floor(sector.researchMarker / 5) + 1, 4);
        const researchCost = RESEARCH_COSTS_BY_PHASE[researchStage - 1] || RESEARCH_COSTS_BY_PHASE[0];

        // Check if company can afford research
        if (company.cashOnHand < researchCost) {
          throw new Error(`Insufficient funds. Research costs $${researchCost} but company has $${company.cashOnHand}.`);
        }

        // Create research order (will be resolved during RESOLVE_MODERN_OPERATIONS phase)
        return ctx.prismaService.researchOrder.create({
          data: {
            companyId: input.companyId,
            gameId: input.gameId,
            gameTurnId: game.currentTurn,
            phaseId: currentPhase.id,
            playerId: ctxMiddleware.submittingPlayerId,
            sectorId: input.sectorId,
            cost: researchCost,
          },
        });
      }),

    // Get pending research orders (created this turn, not yet resolved)
    getPendingResearchOrders: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
        gameTurnId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        // Get current turn if not provided
        let gameTurnId = input.gameTurnId;
        if (!gameTurnId) {
          const game = await ctx.gamesService.game({ id: input.gameId });
          if (!game?.currentTurn) {
            return [];
          }
          gameTurnId = game.currentTurn;
        }

        // Get research orders for this company in the current turn that are not yet resolved
        return ctx.prismaService.researchOrder.findMany({
          where: {
            companyId: input.companyId,
            gameId: input.gameId,
            gameTurnId: gameTurnId,
            researchProgressGain: null, // Only unresolved orders
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }),

    // Get resolved research orders (created this turn, already resolved)
    getResolvedResearchOrders: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
        gameTurnId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        // Get current turn if not provided
        let gameTurnId = input.gameTurnId;
        if (!gameTurnId) {
          const game = await ctx.gamesService.game({ id: input.gameId });
          if (!game?.currentTurn) {
            return [];
          }
          gameTurnId = game.currentTurn;
        }

        // Get research orders for this company in the current turn that have been resolved
        return ctx.prismaService.researchOrder.findMany({
          where: {
            companyId: input.companyId,
            gameId: input.gameId,
            gameTurnId: gameTurnId,
            researchProgressGain: { not: null }, // Only resolved orders
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }),

    // Get total research workers allocated for a company (count of all research orders)
    getResearchWorkers: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        // Count all research orders for this company (each order = 1 worker)
        const count = await ctx.prismaService.researchOrder.count({
          where: {
            companyId: input.companyId,
            gameId: input.gameId,
          },
        });
        return count;
      }),

    // Get company's available workers for allocation
    getCompanyWorkforceStatus: trpc.procedure
      .input(z.object({
        companyId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        const game = await ctx.gamesService.game({ id: input.gameId });
        if (!game) {
          throw new Error('Game not found');
        }

        // Get all factories for this company
        const factories = await ctx.prismaService.factory.findMany({
          where: {
            companyId: input.companyId,
            gameId: input.gameId,
            isOperational: true,
          },
        });

        // Get marketing campaigns
        const marketingCampaigns = await ctx.marketingService.getCompanyCampaigns(
          input.companyId,
          input.gameId
        );

        const factoryWorkers = factories.reduce((sum, f) => sum + f.workers, 0);
        const marketingWorkers = marketingCampaigns.reduce((sum, c) => sum + c.workers, 0);

        return {
          totalWorkers: game.workers,
          factoryWorkers,
          marketingWorkers,
          availableWorkers: game.workers - factoryWorkers - marketingWorkers,
        };
      }),

    // Get sector research progress
    getSectorResearchProgress: trpc.procedure
      .input(z.object({
        sectorId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        const sector = await ctx.sectorService.sector({ id: input.sectorId });
        if (!sector) {
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

        return {
          sectorId: sector.id,
          sectorName: sector.sectorName,
          researchStage,
          researchMarker: sector.researchMarker,
        };
      }),

    // Get all sectors research progress
    getAllSectorsResearchProgress: trpc.procedure
      .input(z.object({
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        const sectors = await ctx.sectorService.sectors({
          where: { gameId: input.gameId },
        });

        return sectors.map(sector => {
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

          return {
            sectorId: sector.id,
            sectorName: sector.sectorName,
            researchStage,
            researchMarker: sector.researchMarker,
          };
        });
      }),

    // Get worker allocation by sector for workforce track display
    getWorkerAllocationBySector: trpc.procedure
      .input(z.object({
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        const game = await ctx.gamesService.game({ id: input.gameId });
        if (!game) {
          throw new Error('Game not found');
        }

        // Get all factories grouped by sector
        const factories = await ctx.prismaService.factory.findMany({
          where: { gameId: input.gameId },
          select: { sectorId: true, workers: true },
        });

        // Get all marketing campaigns with their company's sector
        const marketingCampaigns = await ctx.prismaService.marketingCampaign.findMany({
          where: { 
            gameId: input.gameId,
            status: MarketingCampaignStatus.ACTIVE,
          },
          include: {
            Company: {
              select: { sectorId: true },
            },
          },
        });

        // Get all companies with research progress
        const companies = await ctx.prismaService.company.findMany({
          where: {
            gameId: input.gameId,
            researchProgress: { gt: 0 },
          },
          select: { id: true, sectorId: true, researchProgress: true },
        });

        // Get sectors for names
        const sectors = await ctx.prismaService.sector.findMany({
          where: { gameId: input.gameId },
          select: { id: true, sectorName: true, name: true },
        });

        // Calculate worker allocation by sector
        const workerAllocationBySector = new Map<string, {
          sectorId: string;
          sectorName: string;
          name: string;
          factoryWorkers: number;
          marketingWorkers: number;
          researchWorkers: number;
          totalWorkers: number;
        }>();

        // Initialize sectors
        for (const sector of sectors) {
          workerAllocationBySector.set(sector.id, {
            sectorId: sector.id,
            sectorName: sector.sectorName,
            name: sector.name,
            factoryWorkers: 0,
            marketingWorkers: 0,
            researchWorkers: 0,
            totalWorkers: 0,
          });
        }

        // Add factory workers
        for (const factory of factories) {
          const allocation = workerAllocationBySector.get(factory.sectorId);
          if (allocation) {
            allocation.factoryWorkers += factory.workers;
            allocation.totalWorkers += factory.workers;
          }
        }

        // Add marketing workers
        for (const campaign of marketingCampaigns) {
          const sectorId = campaign.Company.sectorId;
          const allocation = workerAllocationBySector.get(sectorId);
          if (allocation) {
            allocation.marketingWorkers += campaign.workers;
            allocation.totalWorkers += campaign.workers;
          }
        }

        // Add research workers
        for (const company of companies) {
          const allocation = workerAllocationBySector.get(company.sectorId);
          if (allocation && company.researchProgress) {
            allocation.researchWorkers += company.researchProgress;
            allocation.totalWorkers += company.researchProgress;
          }
        }

        return Array.from(workerAllocationBySector.values())
          .filter(sector => sector.totalWorkers > 0)
          .sort((a, b) => b.totalWorkers - a.totalWorkers);
      }),
  });

