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
import playerPriorityRouter from './routers/player-priority.router';
import { PlayerPriorityService } from '@server/player-priority/player-priority.service';
import optionContractRouter from './routers/option-contract.router';
import { OptionContractService } from '@server/option-contract/option-contract.service';
import { createContext } from './trpc.context';
import transactionRouter from './routers/transaction.router';
import { TransactionService } from '@server/transaction/transaction.service';
import cardsRouter from './routers/cards.router';
import { CardsService } from '@server/cards/cards.service';
import playerResultRouter from './routers/player-result.router';
import { PlayerResultService } from '@server/player-result/player-result.service';
import productionResultRouter from './routers/production-result.router';
import { ProductionResultService } from '@server/production-result/production-result.service';
import insolvencyContributionRouter from './routers/insolvency-contribution.router';
import { InsolvencyContributionService } from '@server/insolvency-contribution/insolvency-contribution.service';
import prizesRouter from './routers/prizes.router';
import prizeVotesRouter from './routers/prize-votes.router';
import { PrizeService } from '@server/prize/prize.service';
import { PrizeVotesService } from '@server/prize-votes/prize-votes.service';
import { CompanyActionOrderService } from '@server/company-action-order/company-action-order.service';
import { HeadlineService } from '@server/headline/headline.service';
import headlineRouter from './routers/headline.router';
import playerHeadlineRouter from './routers/player-headline.router';
import { PlayerHeadlineService } from '@server/player-headline/player-headline.service';
import { CompanyAwardTrackService } from '@server/company-award-track/company-award-track.service';
import { CompanyAwardTrackSpaceService } from '@server/company-award-track-space/company-award-track-space.service';
import companyAwardTrackRouter from './routers/company-award-track.router';
import companyAwardTrackSpaceRouter from './routers/company-award-track-space.router';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutiveInfluenceService } from '@server/executive-influence/executive-influence.service';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';
import { ExecutiveInfluenceBidService } from '@server/executive-influence-bid/executive-influence-bid.service';
import { ExecutivePlayerService } from '@server/executive-player/executive-player.service';
import executiveGameRouter from './routers/executive-game.router';
import executivePlayerRouter from './routers/executive-player.router';
import executiveCardRouter from './routers/executive-card.router';
import executiveInfluenceRouter from './routers/executive-influence.router';
import { ExecutiveGameManagementService } from '@server/executive-game-management/executive-game-management.service';
import executivePhaseRouter from './routers/executive-phase.router';
import { ExecutivePhaseService } from '@server/executive-phase/executive-phase.service';
import { ExecutiveGameTurnService } from '@server/executive-game-turn/executive-game-turn.service';
import executiveGameTurnRouter from './routers/executive-game-turn.router';
import { ExecutiveInfluenceVoteRoundService } from '@server/executive-influence-vote-round/executive-influence-vote-round.service';
import executiveInfluenceVoteRoundRouter from './routers/executive-influence-vote-round.router';
import executiveVoteMarkerRouter from './routers/executive-vote-marker.router';
import { PrismaService } from '@server/prisma/prisma.service';
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
    private readonly playerPriorityService: PlayerPriorityService,
    private readonly optionContractService: OptionContractService,
    private readonly transactionService: TransactionService,
    private readonly cardsService: CardsService,
    private readonly playerResultService: PlayerResultService,
    private readonly productionResultService: ProductionResultService,
    private readonly insolvencyContributionService: InsolvencyContributionService,
    private readonly prizeService: PrizeService,
    private readonly prizeVotesService: PrizeVotesService,
    private readonly companyActionOrderService: CompanyActionOrderService,
    private readonly headlineService: HeadlineService,
    private readonly playerHeadlineService: PlayerHeadlineService,
    private readonly companyAwardTrackService: CompanyAwardTrackService,
    private readonly companyAwardTrackSpaceService: CompanyAwardTrackSpaceService,
    private readonly executiveGameManagementService: ExecutiveGameManagementService,
    private readonly executiveGameService: ExecutiveGameService,
    private readonly executiveGameTurnService: ExecutiveGameTurnService,
    private readonly executivePlayerService: ExecutivePlayerService,
    private readonly executiveCardService: ExecutiveCardService,
    private readonly executiveInfluenceService: ExecutiveInfluenceService,
    private readonly executiveInfluenceBidService: ExecutiveInfluenceBidService,
    private readonly executivePhaseService: ExecutivePhaseService,
    private readonly executiveInfluenceVoteRoundService: ExecutiveInfluenceVoteRoundService,
    private readonly prismaService: PrismaService,
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
      playerService: this.playersService,
      phaseService: this.phaseService,
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
      phaseService: this.phaseService,
      gameManagementService: this.gameManagementService,
      gameService: this.gamesService,
    }),
    share: shareRouter(this.trpc, {
      shareService: this.shareService,
      companyService: this.companyService,
    }),
    operatingRound: operatingRoundRouter(this.trpc, {
      operatingRoundService: this.operatingRoundService,
      phaseService: this.phaseService,
    }),
    operatingRoundVote: operatingRoundVoteRouter(this.trpc, {
      operatingRoundVoteService: this.operatingRoundVoteService,
      playerService: this.playersService,
      phaseService: this.phaseService,
      gamesService: this.gamesService,
    }),
    stockRound: stockRoundRouter(this.trpc, {
      stockRoundService: this.stockRoundService,
    }),
    revenueDistributionVote: revenueDistributionVoteRouter(this.trpc, {
      revenueDistributionVoteService: this.revenueDistributionVoteService,
      phaseService: this.phaseService,
      playerService: this.playersService,
      gamesService: this.gamesService,
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
      phaseService: this.phaseService,
      playerService: this.playersService,
      gamesService: this.gamesService,
    }),
    playerPriority: playerPriorityRouter(this.trpc, {
      playerPriorityService: this.playerPriorityService,
    }),
    optionContract: optionContractRouter(this.trpc, {
      optionContractService: this.optionContractService,
      gameManagementService: this.gameManagementService,
      phaseService: this.phaseService,
      playerService: this.playersService,
      gamesService: this.gamesService,
    }),
    transactions: transactionRouter(this.trpc, {
      transactionService: this.transactionService,
    }),
    cards: cardsRouter(this.trpc, {
      cardsService: this.cardsService,
    }),
    playerResult: playerResultRouter(this.trpc, {
      playerResultService: this.playerResultService,
    }),
    productionResult: productionResultRouter(this.trpc, {
      productionResultService: this.productionResultService,
    }),
    insolvencyContributions: insolvencyContributionRouter(this.trpc, {
      insolvencyContributionService: this.insolvencyContributionService,
      phaseService: this.phaseService,
      playerService: this.playersService,
      pusherService: this.pusherService,
      gameManagementService: this.gameManagementService,
      gamesService: this.gamesService,
    }),
    prizes: prizesRouter(this.trpc, {
      prizeService: this.prizeService,
    }),
    prizeVotes: prizeVotesRouter(this.trpc, {
      prizeVotesService: this.prizeVotesService,
      phaseService: this.phaseService,
      playersService: this.playersService,
      pusherService: this.pusherService,
      gamesService: this.gamesService,
    }),
    headlines: headlineRouter(this.trpc, {
      headlineService: this.headlineService,
    }),
    playerHeadlines: playerHeadlineRouter(this.trpc, {
      playerHeadlineService: this.playerHeadlineService,
      playerService: this.playersService,
      pusherService: this.pusherService,
      phaseService: this.phaseService,
      gamesService: this.gamesService,
    }),
    companyAwardTrack: companyAwardTrackRouter(this.trpc, {
      companyAwardTrackService: this.companyAwardTrackService,
    }),
    companyAwardTrackSpace: companyAwardTrackSpaceRouter(this.trpc, {
      companyAwardTrackSpaceService: this.companyAwardTrackSpaceService,
    }),
    executiveGame: executiveGameRouter(this.trpc, {
      executiveGameService: this.executiveGameService,
      executiveGameManagementService: this.executiveGameManagementService,
      executiveGameTurnService: this.executiveGameTurnService,
      executiveInfluenceVoteRoundService:
        this.executiveInfluenceVoteRoundService,
    }),
    executiveGameTurn: executiveGameTurnRouter(this.trpc, {
      executiveGameTurnService: this.executiveGameTurnService,
    }),
    executivePlayer: executivePlayerRouter(this.trpc, {
      executivePlayerService: this.executivePlayerService,
    }),
    executiveCard: executiveCardRouter(this.trpc, {
      executiveCardService: this.executiveCardService,
    }),
    executiveInfluence: executiveInfluenceRouter(this.trpc, {
      executiveInfluenceService: this.executiveInfluenceService,
      executiveInfluenceBidService: this.executiveInfluenceBidService,
      executiveGameManagementService: this.executiveGameManagementService,
      executiveCardService: this.executiveCardService,
      executiveGameService: this.executiveGameService,
    }),
    executivePhase: executivePhaseRouter(this.trpc, {
      executivePhaseService: this.executivePhaseService,
    }),
    executiveInfluenceVoteRound: executiveInfluenceVoteRoundRouter(this.trpc, {
      executiveInfluenceVoteRoundService:
        this.executiveInfluenceVoteRoundService,
    }),
    executiveVoteMarker: executiveVoteMarkerRouter(this.trpc, {
      prismaService: this.prismaService,
    }),
  });

  async applyMiddleware(app: INestApplication) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext,
      }),
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
