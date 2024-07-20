import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';
import { OptionContractService } from '@server/option-contract/option-contract.service';

type Context = {
  optionContractService: OptionContractService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getOptionContract: trpc.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { id } = input;
        const optionContract =
          await ctx.optionContractService.getOptionContract({ id });
        if (!optionContract) {
          throw new Error('OptionContract not found');
        }
        return optionContract;
      }),

    listOptionContracts: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.number().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.optionContractService.listOptionContracts({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createOptionContract: trpc.procedure
      .input(
        z.object({
          premium: z.number(),
          strikePrice: z.number(),
          term: z.number(),
          shareCount: z.number(),
          stepBonus: z.number().optional(),
          playerOrderId: z.number().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { playerOrderId, ...rest } = input;
        const data = {
          ...rest,
          PlayerOrder: playerOrderId
            ? { connect: { id: playerOrderId } }
            : undefined,
        };
        return ctx.optionContractService.createOptionContract(
          data as Prisma.OptionContractCreateInput,
        );
      }),

    updateOptionContract: trpc.procedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            premium: z.number().optional(),
            currentPremium: z.number().optional(),
            strikePrice: z.number().optional(),
            term: z.number().optional(),
            shareCount: z.number().optional(),
            stepBonus: z.number().optional(),
            playerOrderId: z.number().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.optionContractService.updateOptionContract({
          where: { id },
          data,
        });
      }),

    deleteOptionContract: trpc.procedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.optionContractService.deleteOptionContract({ id });
      }),
  });
