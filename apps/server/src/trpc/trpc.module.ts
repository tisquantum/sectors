import { Module } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { TrpcRouter } from '@server/trpc/trpc.router';
import { UsersService } from '@server/users/users.service';
import { RoomService } from '@server/rooms/rooms.service';
import { RoomMessageService } from '@server/room-messages/room-messages.service';
import { RoomUserService } from '@server/room-user/room-user.service';
import { PrismaModule } from '@server/prisma/prisma.module';
import { GameManagementService } from '@server/game-management/game-management.service';
import { PlayersService } from '@server/players/players.service';
import { GamesService } from '@server/games/games.service';
import { CompanyService } from '@server/company/company.service';
import { SectorService } from '@server/sector/sector.service';
import { MeetingMessageService } from '@server/meeting-message/meeting-message.service';
import { StockRoundService } from '@server/stock-round/stock-round.service';
import { PhaseService } from '@server/phase/phase.service';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';
import { TimerService } from '@server/timer/timer.service';
import { PlayerOrderService } from '@server/player-order/player-order.service';
import { ShareService } from '@server/share/share.service';
import { OperatingRoundVoteService } from '@server/operating-round-vote/operating-round-vote.service';
import { StockHistoryService } from '@server/stock-history/stock-history.service';
import { ProductionResultService } from '@server/production-result/production-result.service';
import { RevenueDistributionVoteService } from '@server/revenue-distribution-vote/revenue-distribution-vote.service';
import { CompanyActionService } from '@server/company-action/company-action.service';
import { CapitalGainsService } from '@server/capital-gains/capital-gains.service';
import { GameTurnService } from '@server/game-turn/game-turn.service';
import { PrestigeRewardsService } from '@server/prestige-rewards/prestige-rewards.service';
import { ResearchDeckService } from '@server/research-deck/research-deck.service';
import { CardsService } from '@server/cards/cards.service';
import { InfluenceRoundService } from '@server/influence-round/influence-round.service';
import { InfluenceRoundVotesService } from '@server/influence-round-votes/influence-round-votes.service';
import { PlayerPriorityService } from '@server/player-priority/player-priority.service';
import { OptionContractService } from '@server/option-contract/option-contract.service';
import { ShortOrderService } from '@server/short-order/short-order.service';
import { GameRecordService } from '@server/game-record/game-record.service';
import { PlayerResultService } from '@server/player-result/player-result.service';
import { TransactionService } from '@server/transaction/transaction.service';
import { InsolvencyContributionService } from '@server/insolvency-contribution/insolvency-contribution.service';
import { PrizeService } from '@server/prize/prize.service';
import { PrizeVotesService } from '@server/prize-votes/prize-votes.service';
import { PrizeDistributionService } from '@server/prize-distribution/prize-distribution.service';
import { CompanyActionOrderService } from '@server/company-action-order/company-action-order.service';
import { HeadlineService } from '@server/headline/headline.service';
import { PlayerHeadlineService } from '@server/player-headline/player-headline.service';
import { StockSubRoundService } from '@server/stock-sub-round/stock-sub-round.service';
import { CompanyAwardTrackService } from '@server/company-award-track/company-award-track.service';
import { CompanyAwardTrackSpaceService } from '@server/company-award-track-space/company-award-track-space.service';
import { ExecutiveGameService } from '@server/executive-game/executive-game.service';
import { ExecutiveCardService } from '@server/executive-card/executive-card.service';
import { ExecutiveInfluenceBidService } from '@server/executive-influence-bid/executive-influence-bid.service';
import { ExecutiveInfluenceService } from '@server/executive-influence/executive-influence.service';
import { ExecutivePlayerService } from '@server/executive-player/executive-player.service';
import { ExecutiveGameManagementService } from '@server/executive-game-management/executive-game-management.service';
import { ExecutivePhaseService } from '@server/executive-phase/executive-phase.service';
import { ExecutiveGameTurnService } from '@server/executive-game-turn/executive-game-turn.service';
import { ExecutiveInfluenceVoteRoundService } from '@server/executive-influence-vote-round/executive-influence-vote-round.service';
import { AiBotService } from '@server/ai-bot/ai-bot.service';

@Module({
  imports: [PrismaModule],
  providers: [
    TrpcService,
    TrpcRouter,
    UsersService,
    RoomService,
    RoomMessageService,
    RoomUserService,
    GameManagementService,
    PlayersService,
    GamesService,
    CompanyService,
    SectorService,
    StockRoundService,
    MeetingMessageService,
    PhaseService,
    OperatingRoundService,
    TimerService,
    PlayerOrderService,
    ShareService,
    OperatingRoundVoteService,
    OperatingRoundService,
    StockHistoryService,
    ProductionResultService,
    RevenueDistributionVoteService,
    CompanyActionService,
    CapitalGainsService,
    GameTurnService,
    PrestigeRewardsService,
    ResearchDeckService,
    CardsService,
    PlayerPriorityService,
    InfluenceRoundService,
    InfluenceRoundVotesService,
    OptionContractService,
    ShortOrderService,
    GameRecordService,
    PlayerResultService,
    TransactionService,
    InsolvencyContributionService,
    PrizeService,
    PrizeVotesService,
    PrizeDistributionService,
    RoomUserService,
    CompanyActionOrderService,
    HeadlineService,
    PlayerHeadlineService,
    StockSubRoundService,
    CompanyAwardTrackService,
    CompanyAwardTrackSpaceService,
    ExecutiveGameService,
    ExecutiveGameTurnService,
    ExecutivePlayerService,
    ExecutiveCardService,
    ExecutiveInfluenceBidService,
    ExecutiveInfluenceService,
    ExecutiveGameManagementService,
    ExecutivePhaseService,
    ExecutiveInfluenceService,
    ExecutiveInfluenceVoteRoundService,
    AiBotService,
  ],
})
export class TrpcModule {}
