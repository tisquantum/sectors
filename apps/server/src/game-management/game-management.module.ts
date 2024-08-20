import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PlayersModule } from '@server/players/players.module';
import { GameManagementService } from './game-management.service';
import { GamesModule } from '@server/games/games.module';
import { CompanyModule } from '@server/company/company.module';
import { SectorModule } from '@server/sector/sector.module';
import { StockRoundModule } from '@server/stock-round/stock-round.module';
import { PhaseModule } from '@server/phase/phase.module';
import { TimerModule } from '@server/timer/timer.module';
import { PusherModule } from 'nestjs-pusher';
import { OperatingRoundModule } from '@server/operating-round/operating-round.module';
import { ShareModule } from '@server/share/share.module';
import { PlayerOrderModule } from '@server/player-order/player-order.module';
import { ProductionResultModule } from '@server/production-result/production-result.module';
import { StockHistoryModule } from '@server/stock-history/stock-history.module';
import { CompanyActionModule } from '@server/company-action/company-action.module';
import { GameLogModule } from '@server/game-log/game-log.module';
import { CapitalGainsModule } from '@server/capital-gains/capital-gains.module';
import { GameTurnModule } from '@server/game-turn/game-turn.module';
import { PrestigeRewardsModule } from '@server/prestige-rewards/prestige-rewards.module';
import { CardsModule } from '@server/cards/cards.module';
import { ResearchDeckModule } from '@server/research-deck/research-deck.module';
import { InfluenceRoundVotesModule } from '@server/influence-round-votes/influence-round-votes.module';
import { InfluenceRoundModule } from '@server/influence-round/influence-round.module';
import { PlayerPriorityModule } from '@server/player-priority/player-priority.module';
import { OptionContractModule } from '@server/option-contract/option-contract.module';
import { ShortOrderModule } from '@server/short-order/short-order.module';
import { GameRecordModule } from '@server/game-record/game-record.module';
import { PlayerResultModule } from '@server/player-result/player-result.module';
import { UsersModule } from '@server/users/users.module';
import { TransactionModule } from '@server/transaction/transaction.module';
import { InsolvencyContributionModule } from '@server/insolvency-contribution/insolvency-contribution.module';
import { PrizeModule } from '@server/prize/prize.module';
import { PrizeVotesModule } from '@server/prize-votes/prize-votes.module';

@Module({
  imports: [
    PrismaModule,
    PlayersModule,
    GamesModule,
    CompanyModule,
    SectorModule,
    StockRoundModule,
    PhaseModule,
    TimerModule,
    PusherModule,
    OperatingRoundModule,
    ShareModule,
    PlayerOrderModule,
    StockHistoryModule,
    ProductionResultModule,
    CompanyActionModule,
    GameLogModule,
    CapitalGainsModule,
    GameTurnModule,
    PrestigeRewardsModule,
    CardsModule,
    ResearchDeckModule,
    PlayerPriorityModule,
    InfluenceRoundModule,
    InfluenceRoundVotesModule,
    OptionContractModule,
    ShortOrderModule,
    GameRecordModule,
    PlayerResultModule,
    UsersModule,
    TransactionModule,
    InsolvencyContributionModule,
    PrizeModule,
    PrizeVotesModule,
  ],
  providers: [GameManagementService],
  exports: [GameManagementService],
})
export class GameManagementModule {}
