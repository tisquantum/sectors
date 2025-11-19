import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { MarketingCampaignTier, PhaseName, ResourceType, OperationMechanicsVersion } from '@prisma/client';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { PlayersService } from '@server/players/players.service';
import { PhaseService } from '@server/phase/phase.service';
import { GamesService } from '@server/games/games.service';
import { MarketingService } from '@server/marketing/marketing.service';
import { CompanyService } from '@server/company/company.service';
import { PrismaService } from '@server/prisma/prisma.service';
import { SectorService } from '@server/sector/sector.service';

type Context = {
  marketingService: MarketingService;
  companyService: CompanyService;
  playerService: PlayersService;
  phaseService: PhaseService;
  gamesService: GamesService;
  prismaService: PrismaService;
  sectorService: SectorService;
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
      }))
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) =>
        checkSubmissionTime(
          PhaseName.MARKETING_AND_RESEARCH_ACTION,
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
          PhaseName.MARKETING_AND_RESEARCH_ACTION,
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

        // Get current game and phase
        const game = await ctx.gamesService.game({ id: input.gameId });
        if (!game || !game.currentPhaseId) {
          throw new Error('Game or phase not found');
        }

        // Create research action record
        // We'll store this as a company action for now
        if (!game.currentTurn) {
          throw new Error('Game has no current turn');
        }
        return ctx.prismaService.companyAction.create({
          data: {
            companyId: input.companyId,
            action: 'RESEARCH' as any,
            resolved: false,
            gameTurnId: game.currentTurn,
          },
        });
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

        return {
          sectorId: sector.id,
          sectorName: sector.sectorName,
          technologyLevel: sector.technologyLevel,
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

        return sectors.map(sector => ({
          sectorId: sector.id,
          sectorName: sector.sectorName,
          technologyLevel: sector.technologyLevel,
          researchMarker: sector.researchMarker,
        }));
      }),
  });

