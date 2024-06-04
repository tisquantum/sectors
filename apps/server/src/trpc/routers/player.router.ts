import { z } from 'zod';
import { PlayersService } from '@server/players/players.service';
import { TrpcService } from '../trpc.service';
import { Prisma } from '@prisma/client';

type Context = {
  playersService: PlayersService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getPlayer: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        const player = await ctx.playersService.player({ id });
        if (!player) {
          throw new Error('Player not found');
        }
        return player;
      }),

    listPlayers: trpc.procedure
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
        return ctx.playersService.players({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),

    createPlayer: trpc.procedure
      .input(
        z.object({
          nickname: z.string(),
          cashOnHand: z.number(),
          Game: z.object({
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
          }),
          PlayerStock: z.any().optional(),
          GamePlayer: z.any().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const data: Prisma.PlayerCreateInput = input;
        return ctx.playersService.createPlayer(data);
      }),

    updatePlayer: trpc.procedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            nickname: z.string().optional(),
            cashOnHand: z.number().optional(),
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
            PlayerStock: z.any().optional(),
            GamePlayer: z.any().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, data } = input;
        return ctx.playersService.updatePlayer({ where: { id }, data });
      }),

    deletePlayer: trpc.procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id } = input;
        return ctx.playersService.deletePlayer({ id });
      }),
  });
