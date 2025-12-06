import { z } from 'zod';
import { CompanyService } from '@server/company/company.service';
import { TrpcService } from '../trpc.service';
import { Prisma, RoundType, CompanyStatus } from '@prisma/client';
import { SectorService } from '@server/sector/sector.service';
import { determineFloatPrice } from '@server/data/helpers';
import { GamesService } from '@server/games/games.service';
import { PhaseService } from '@server/phase/phase.service';

type Context = {
  companyService: CompanyService;
  sectorService: SectorService;
  phaseService: PhaseService;
  gamesService: GamesService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getCompany: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const company = await ctx.companyService.company({ id });
        if (!company) {
          throw new Error('Company not found');
        }
        return company;
      }),

    getCompanyWithShares: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const company = await ctx.companyService.companyWithShares({ id });
        if (!company) {
          throw new Error('Company not found');
        }
        return company;
      }),
    getCompanyWithCards: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const company = await ctx.companyService.companyWithCards({ id });
        if (!company) {
          throw new Error('Company not found');
        }
        return company;
      }),
    getCompanyWithRelations: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const company = await ctx.companyService.companyWithRelations({ id });
        if (!company) {
          throw new Error('Company not found');
        }
        return company;
      }),
    companyWithSectorFindFirst: trpc.procedure
      .input(
        z.object({
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        return ctx.companyService.companyWithSectorFindFirst(input);
      }),
    listCompanies: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.companyService.companies({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    listCompaniesWithRelations: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.companyService.companiesWithRelations({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    getCompanyWithSector: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const company = await ctx.companyService.companyWithSector({ id });
        if (!company) {
          throw new Error('Company not found');
        }
        return company;
      }),

    listCompaniesWithSector: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.companyService.companiesWithSector({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    listCompaniesWithSectorAndStockHistory: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.companyService.companiesWithSectorAndStockHistory({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createCompany: trpc.procedure
      .input(
        z.object({
          name: z.string(),
          stockSymbol: z.string(),
          unitPrice: z.number(),
          throughput: z.number(),
          sectorId: z.string(),
          gameId: z.string(),
          currentStockPrice: z.number(),
          cashOnHand: z.number(),
          mergedWithParent: z.string().nullable().optional(),
          mergedWithChildren: z.any().optional(),
          Sector: z.object({
            connect: z.object({ id: z.string() }).optional(),
            create: z
              .object({
                name: z.string(),
                supply: z.number(),
                demand: z.number(),
                marketingPrice: z.number(),
                basePrice: z.number(),
                ipoMin: z.number(),
                ipoMax: z.number(),
                Company: z.any().optional(),
                Game: z.any().optional(),
              })
              .optional(),
          }),
          Game: z.object({
            connect: z.object({ id: z.string() }).optional(),
            create: z
              .object({
                name: z.string(),
                currentTurn: z.string(),
                currentOrSubRound: z.number(),
                currentRound: z.nativeEnum(RoundType),
                currentActivePlayer: z.string().nullable().optional(),
                bankPoolNumber: z.number(),
                consumerPoolNumber: z.number(),
                gameStatus: z.string(),
                gameStep: z.number(),
                currentPhase: z.string(),
                players: z.any().optional(),
                companies: z.any().optional(),
                Player: z.any().optional(),
                Company: z.any().optional(),
                StockRound: z.any().optional(),
                OperatingRound: z.any().optional(),
                ResearchDeck: z.any().optional(),
              })
              .optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const sector = await ctx.sectorService.sector({ id: input.sectorId });
        if (!sector) throw new Error('Sector not found');
        const data: Prisma.CompanyCreateInput = {
          ...input,
          ipoAndFloatPrice: determineFloatPrice(sector),
          Game: { connect: { id: input.gameId } },
          Sector: { connect: { id: input.sectorId } },
        };
        delete data.id;
        return ctx.companyService.createCompany(data);
      }),

    createManyCompanies: trpc.procedure
      .input(z.array(z.any()))
      .mutation(async ({ input }) => {
        const data: Prisma.CompanyCreateManyInput[] = input;
        data.forEach((d) => delete d.id);
        return ctx.companyService.createManyCompanies(data);
      }),

    updateCompany: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().optional(),
            unitPrice: z.number().optional(),
            throughput: z.number().optional(),
            sectorId: z.string().optional(),
            gameId: z.string().optional(),
            currentStockPrice: z.number(),
            cashOnHand: z.number(),
            mergedWithParent: z.string().nullable().optional(),
            mergedWithChildren: z.any().optional(),
            Sector: z
              .object({
                connect: z.object({ id: z.string() }).optional(),
                create: z
                  .object({
                    name: z.string(),
                    supply: z.number(),
                    demand: z.number(),
                    marketingPrice: z.number(),
                    basePrice: z.number(),
                    ipoMin: z.number(),
                    ipoMax: z.number(),
                    Company: z.any().optional(),
                    Game: z.any().optional(),
                  })
                  .optional(),
              })
              .optional(),
            Game: z
              .object({
                connect: z.object({ id: z.string() }).optional(),
                create: z
                  .object({
                    name: z.string(),
                    currentTurn: z.string(),
                    currentOrSubRound: z.number(),
                    currentRound: z.string(),
                    currentActivePlayer: z.string().nullable().optional(),
                    bankPoolNumber: z.number(),
                    consumerPoolNumber: z.number(),
                    gameStatus: z.string(),
                    gameStep: z.number(),
                    currentPhase: z.string(),
                    players: z.any().optional(),
                    companies: z.any().optional(),
                    Player: z.any().optional(),
                    Company: z.any().optional(),
                    StockRound: z.any().optional(),
                    OperatingRound: z.any().optional(),
                    ResearchDeck: z.any().optional(),
                    Room: z.any().optional(),
                  })
                  .optional(),
              })
              .optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        const newData: Prisma.CompanyUpdateInput = {
          ...data,
          Game: { connect: { id: data.gameId } },
          Sector: { connect: { id: data.sectorId } },
        };
        return ctx.companyService.updateCompany({
          where: { id },
          data: newData,
        });
      }),

    deleteCompany: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.companyService.deleteCompany({ id });
      }),

    getCompanyPriority: trpc.procedure
      .input(z.object({ companyId: z.string(), gameId: z.string() }))
      .query(async ({ input }) => {
        const { companyId, gameId } = input;
        
        // Get the company to find its sector
        const company = await ctx.companyService.company({ id: companyId });
        if (!company) {
          return { global: null, sector: null };
        }

        // Get all active and insolvent companies in the game
        const allCompanies = await ctx.companyService.companies({
          where: {
            gameId,
            status: { in: [CompanyStatus.ACTIVE, CompanyStatus.INSOLVENT] },
          },
        });

        // Map to only the fields we need and sort by stock price (highest to lowest), then by createdAt (stacking order)
        const sortedAllCompanies = allCompanies
          .map(c => ({
            id: c.id,
            currentStockPrice: c.currentStockPrice,
            createdAt: c.createdAt,
          }))
          .sort((a, b) => {
            const priceA = a.currentStockPrice || 0;
            const priceB = b.currentStockPrice || 0;
            
            if (priceA !== priceB) {
              return priceB - priceA; // Higher price first
            }
            
            // If prices are equal, sort by createdAt (earlier = higher priority)
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });

        // Find global priority (1-indexed)
        const globalPriority = sortedAllCompanies.findIndex(c => c.id === companyId) + 1;

        // Get companies in the same sector
        const sectorCompanies = allCompanies.filter(c => c.sectorId === company.sectorId);
        
        // Sort sector companies by the same criteria
        const sortedSectorCompanies = sectorCompanies
          .map(c => ({
            id: c.id,
            currentStockPrice: c.currentStockPrice,
            createdAt: c.createdAt,
          }))
          .sort((a, b) => {
            const priceA = a.currentStockPrice || 0;
            const priceB = b.currentStockPrice || 0;
            
            if (priceA !== priceB) {
              return priceB - priceA; // Higher price first
            }
            
            // If prices are equal, sort by createdAt (earlier = higher priority)
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });

        // Find sector priority (1-indexed)
        const sectorPriority = sortedSectorCompanies.findIndex(c => c.id === companyId) + 1;
        
        return {
          global: globalPriority > 0 ? globalPriority : null,
          sector: sectorPriority > 0 ? sectorPriority : null,
        };
      }),
  });
