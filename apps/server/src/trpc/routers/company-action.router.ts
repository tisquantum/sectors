import { number, z } from 'zod';
import { CompanyActionService } from '@server/company-action/company-action.service';
import { TrpcService } from '../trpc.service';
import { OperatingRoundAction, Prisma } from '@prisma/client';

type Context = {
  companyActionService: CompanyActionService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getCompanyAction: trpc.procedure
      .input(z.object({ operatingRoundId: z.number(), companyId: z.string() }))
      .query(async ({ input }) => {
        const { operatingRoundId, companyId } = input;
        const companyAction = await ctx.companyActionService.companyActionFirst(
          {
            where: {
              operatingRoundId,
              companyId,
            },
          },
        );
        if (!companyAction) {
          throw new Error('Company action not found');
        }
        return companyAction;
      }),

    listCompanyActions: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.number().optional(),
          where: z.any().optional(), // Define more specific validation if needed
          orderBy: z.any().optional(), // Define more specific validation if needed
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.companyActionService.companyActions({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createCompanyAction: trpc.procedure
      .input(
        z.object({
          companyId: z.string(),
          action: z.nativeEnum(OperatingRoundAction),
          operatingRoundId: z.number(),
          resolved: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { companyId, operatingRoundId, ...rest } = input;
        const data: Prisma.CompanyActionCreateInput = {
          ...rest,
          Company: { connect: { id: companyId } },
          OperatingRound: { connect: { id: operatingRoundId } },
        };
        return ctx.companyActionService.createCompanyAction(data);
      }),

    updateCompanyAction: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            companyId: z.string().optional(),
            action: z.nativeEnum(OperatingRoundAction).optional(),
            operatingRoundId: z.number().optional(),
            resolved: z.boolean().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.companyActionService.updateCompanyAction({
          where: { id },
          data,
        });
      }),

    deleteCompanyAction: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.companyActionService.deleteCompanyAction({ id });
      }),
  });
