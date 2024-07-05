import { z } from 'zod';
import { CompanyService } from '@server/company/company.service';
import { TrpcService } from '../trpc.service';
import { Prisma, RoundType } from '@prisma/client';
import { SectorService } from '@server/sector/sector.service';
import { determineFloatPrice } from '@server/data/helpers';

type Context = {
  companyService: CompanyService;
  sectorService: SectorService;
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
          unitPrice: z.number(),
          throughput: z.number(),
          sectorId: z.string(),
          gameId: z.string(),
          insolvent: z.boolean(),
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
                floatNumberMin: z.number(),
                floatNumberMax: z.number(),
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
                currentTurn: z.number(),
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
            insolvent: z.boolean().optional(),
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
                    floatNumberMin: z.number(),
                    floatNumberMax: z.number(),
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
                    currentTurn: z.number(),
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
  });
