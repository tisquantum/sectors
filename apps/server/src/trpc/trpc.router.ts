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
import { ShareService } from '@server/share/share.service';
import shareRouter from './routers/share.router';
import operatingRoundRouter from './routers/operating-round.router';
import operatingRoundVoteRouter from './routers/operating-round-vote.router';
import { OperatingRoundVoteService } from '@server/operating-round-vote/operating-round-vote.service';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';
import stockRoundRouter from './routers/stock-round.router';
import { StockRoundService } from '@server/stock-round/stock-round.service';
import { RevenueDistributionVoteService } from '@server/revenue-distribution-vote/revenue-distribution-vote.service';
import revenueDistributionVoteRouter from './routers/revenue-distribution-vote.router';
import { CompanyActionService } from '@server/company-action/company-action.service';
import companyActionRouter from './routers/company-action.router';
import { GameLogService } from '@server/game-log/game-log.service';
import gameLogRouter from './routers/game-log.router';
import { CapitalGainsService } from '@server/capital-gains/capital-gains.service';
import capitalGainsRouter from './routers/capital-gains.router';
import { GameTurnService } from '@server/game-turn/game-turn.service';
import gameTurnRouter from './routers/game-turn.router';
import prestigeRewardsRouter from './routers/prestige-rewards.router';
import { PrestigeRewardsService } from '@server/prestige-rewards/prestige-rewards.service';
import researchDeckRouter from './routers/research-deck.router';
import { ResearchDeckService } from '@server/research-deck/research-deck.service';
import { InfluenceRoundVotesService } from '@server/influence-round-votes/influence-round-votes.service';
import influenceRoundVotesRouter from './routers/influence-round-votes.router';
import { InfluenceRoundService } from '@server/influence-round/influence-round.service';
import influenceRoundRouter from './routers/influence-round.router';
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
    private readonly shareService: ShareService,
    private readonly operatingRoundService: OperatingRoundService,
    private readonly operatingRoundVoteService: OperatingRoundVoteService,
    private readonly stockRoundService: StockRoundService,
    private readonly revenueDistributionVoteService: RevenueDistributionVoteService,
    private readonly companyActionService: CompanyActionService,
    private readonly gameLogService: GameLogService,
    private readonly capitalGainsService: CapitalGainsService,
    private readonly gameTurnService: GameTurnService,
    private readonly prestigeRewardsService: PrestigeRewardsService,
    private readonly researchDeckService: ResearchDeckService,
    private readonly influenceRound: InfluenceRoundService,
    private readonly influenceRoundVotesService: InfluenceRoundVotesService,
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
    gameLog: gameLogRouter(this.trpc, {
      gameLogService: this.gameLogService,
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
      gameLogService: this.gameLogService,
    }),
    share: shareRouter(this.trpc, {
      shareService: this.shareService,
      companyService: this.companyService,
    }),
    operatingRound: operatingRoundRouter(this.trpc, {
      operatingRoundService: this.operatingRoundService,
    }),
    operatingRoundVote: operatingRoundVoteRouter(this.trpc, {
      operatingRoundVoteService: this.operatingRoundVoteService,
    }),
    stockRound: stockRoundRouter(this.trpc, {
      stockRoundService: this.stockRoundService,
    }),
    revenueDistributionVote: revenueDistributionVoteRouter(this.trpc, {
      revenueDistributionVoteService: this.revenueDistributionVoteService,
    }),
    companyAction: companyActionRouter(this.trpc, {
      companyActionService: this.companyActionService,
    }),
    capitalGains: capitalGainsRouter(this.trpc, {
      capitalGainsService: this.capitalGainsService,
    }),
    gameTurn: gameTurnRouter(this.trpc, {
      gameTurnService: this.gameTurnService,
    }),
    prestigeReward: prestigeRewardsRouter(this.trpc, {
      prestigeRewardsService: this.prestigeRewardsService,
    }),
    researchDeck: researchDeckRouter(this.trpc, {
      researchDeckService: this.researchDeckService,
    }),
    influenceRound: influenceRoundRouter(this.trpc, {
      influenceRoundService: this.influenceRound,
    }),
    influenceRoundVotes: influenceRoundVotesRouter(this.trpc, {
      influenceRoundVotesService: this.influenceRoundVotesService,
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
