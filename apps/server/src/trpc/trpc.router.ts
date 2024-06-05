import { PlayersService } from '@server/players/players.service';
import { INestApplication, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { UsersService } from '@server/users/users.service';
import userRouter from './routers/user.router';
import { RoomService } from '@server/rooms/rooms.service';
import roomRouter from './routers/room.router';
import { RoomMessageService } from '@server/room-messages/room-messages.service';
import { RoomUserService } from '@server/room-user/room-user.service';
import roomMessageRouter from './routers/room-message.router';
import roomUserRouter from './routers/room-user.router';
import { PusherService } from 'nestjs-pusher';
import { GamesService } from '@server/games/games.service';
import gameRouter from './routers/game.router';
import gamePlayerRouter from './routers/game-player.router';
import { GamePlayerService } from '@server/game-player/game-player.service';
import { GameManagementService } from '@server/game-management/game-management.service';
import playerRouter from './routers/player.router';
@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly userService: UsersService,
    private readonly roomService: RoomService,
    private readonly roomMessageService: RoomMessageService,
    private readonly roomUserService: RoomUserService,
    private readonly gamesService: GamesService,
    private readonly gamePlayerService: GamePlayerService,
    private readonly pusherService: PusherService,
    private readonly playersService: PlayersService,
    private readonly gameManagementService: GameManagementService,
  ) {}

  appRouter = this.trpc.router({
    hello: this.trpc.procedure
      .input(
        z.object({
          name: z.string().optional(),
        }),
      )
      .query(({ input }) => {
        const { name } = input;
        return {
          greeting: `Hello ${name ? name : `Bilbo`}`,
        };
      }),
    user: userRouter(this.trpc, { userService: this.userService }),
    room: roomRouter(this.trpc, { roomService: this.roomService }),
    roomMessage: roomMessageRouter(this.trpc, {
      roomMessageService: this.roomMessageService,
      pusherService: this.pusherService,
    }),
    roomUser: roomUserRouter(this.trpc, {
      roomUserService: this.roomUserService,
      pusherService: this.pusherService,
    }),
    game: gameRouter(this.trpc, {
      gamesService: this.gamesService,
      gameManagementService: this.gameManagementService,
      pusherService: this.pusherService,
    }),
    gamePlayer: gamePlayerRouter(this.trpc, {
      gamePlayersService: this.gamePlayerService,
      pusherService: this.pusherService,
    }),
    player: playerRouter(this.trpc, {
      playersService: this.playersService,
    }),
  });

  async applyMiddleware(app: INestApplication) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
      }),
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
