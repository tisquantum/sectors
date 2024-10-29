import { z } from 'zod';
import { TrpcService } from '../trpc.service';
import { PhaseName, Prisma } from '@prisma/client';
import { OptionContractService } from '@server/option-contract/option-contract.service';
import { GameManagementService } from '@server/game-management/game-management.service';
import { checkIsPlayerAction, checkSubmissionTime } from '../trpc.middleware';
import { PhaseService } from '@server/phase/phase.service';
import { PlayersService } from '@server/players/players.service';
import { GamesService } from '@server/games/games.service';

type Context = {
  optionContractService: OptionContractService;
  gameManagementService: GameManagementService;
  phaseService: PhaseService;
  playerService: PlayersService;
  gamesService: GamesService;
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
        }),
      )
      .mutation(async ({ input }) => {
        return ctx.optionContractService.createOptionContract(
          input as Prisma.OptionContractCreateInput,
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
    exerciseOptionContract: trpc.procedure
      .input(z.object({ contractId: z.number(), gameId: z.string() }))
      .use(async (opts) => checkIsPlayerAction(opts, ctx.playerService))
      .use(async (opts) =>
        checkSubmissionTime(PhaseName.STOCK_ACTION_OPTION_ORDER, opts, ctx.phaseService, ctx.gamesService),
      )
      .mutation(async ({ input }) => {
        const { contractId } = input;
        return ctx.gameManagementService.exerciseOptionContract(contractId);
      }),
  });
