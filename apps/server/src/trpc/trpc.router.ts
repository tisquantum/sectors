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
import { GameManagementService } from '@server/game-management/game-management.service';
import playerRouter from './routers/player.router';
import { CompanyService } from '@server/company/company.service';
import { SectorService } from '@server/sector/sector.service';
import companyRouter from './routers/company.router';
import sectorRouter from './routers/sector.router';
import meetingMessageRouter from './routers/meeting-message.router';
import { MeetingMessageService } from '@server/meeting-message/meeting-message.service';
import phaseRouter from './routers/phase.router';
import { PhaseService } from '@server/phase/phase.service';
import { PlayerOrderService } from '@server/player-order/player-order.service';
import playerOrderRouter from './routers/player-order.router';
@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly userService: UsersService,
    private readonly roomService: RoomService,
    private readonly roomMessageService: RoomMessageService,
    private readonly roomUserService: RoomUserService,
    private readonly gamesService: GamesService,
    private readonly pusherService: PusherService,
    private readonly playersService: PlayersService,
    private readonly companyService: CompanyService,
    private readonly sectorService: SectorService,
    private readonly gameManagementService: GameManagementService,
    private readonly meetingMessageService: MeetingMessageService,
    private readonly phaseService: PhaseService,
    private readonly playerOrderService: PlayerOrderService,
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
    player: playerRouter(this.trpc, {
      playersService: this.playersService,
    }),
    company: companyRouter(this.trpc, {
      companyService: this.companyService,
      sectorService: this.sectorService,
    }),
    sector: sectorRouter(this.trpc, {
      sectorService: this.sectorService,
    }),
    meetingMessage: meetingMessageRouter(this.trpc, {
      meetingMessageService: this.meetingMessageService,
      pusherService: this.pusherService,
    }),
    phase: phaseRouter(this.trpc, {
      phaseService: this.phaseService,
    }),
    playerOrder: playerOrderRouter(this.trpc, {
      playerOrdersService: this.playerOrderService,
      playerService: this.playersService,
      pusherService: this.pusherService,
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