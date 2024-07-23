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

@Module({
  imports: [PrismaModule],
  controllers: [],
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
  ],
})
export class TrpcModule {}
