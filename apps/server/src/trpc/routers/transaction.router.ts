import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { TransactionService } from '@server/transaction/transaction.service';

type Context = {
  transactionService: TransactionService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getTransaction: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const transaction = await ctx.transactionService.getTransaction({ id });
        if (!transaction) {
          throw new Error('Transaction not found');
        }
        return transaction;
      }),

    listTransactions: trpc.procedure
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
        return ctx.transactionService.listTransactions({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
