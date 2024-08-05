import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TrpcModule } from '@server/trpc/trpc.module';
import { PlayersModule } from './players/players.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { RoomMessagesModule } from './room-messages/room-messages.module';
import { RoomUserModule } from './room-user/room-user.module';
import { PrismaModule } from './prisma/prisma.module';
import { PusherModule } from 'nestjs-pusher';
import { GamesModule } from './games/games.module';
import { GameManagementModule } from './game-management/game-management.module';
import { CompanyModule } from './company/company.module';
import { SectorModule } from './sector/sector.module';
import { ResearchDeckModule } from './research-deck/research-deck.module';
import { MeetingMessageModule } from './meeting-message/meeting-message.module';
import { PhaseModule } from './phase/phase.module';
import { OperatingRoundModule } from './operating-round/operating-round.module';
import { StockRoundModule } from './stock-round/stock-round.module';
import { GameLogModule } from './game-log/game-log.module';
import { TimerModule } from './timer/timer.module';
import { PlayerOrderModule } from './player-order/player-order.module';
import { ShareModule } from './share/share.module';
import { OperatingRoundVoteModule } from './operating-round-vote/operating-round-vote.module';
import { StockHistoryModule } from './stock-history/stock-history.module';
import { ProductionResultModule } from './production-result/production-result.module';
import { RevenueDistributionVoteModule } from './revenue-distribution-vote/revenue-distribution-vote.module';
import { CompanyActionModule } from './company-action/company-action.module';
import { CapitalGainsModule } from './capital-gains/capital-gains.module';
import { GameTurnModule } from './game-turn/game-turn.module';
import { PrestigeRewardsModule } from './prestige-rewards/prestige-rewards.module';
import { CardsModule } from './cards/cards.module';
import { PlayerPriorityModule } from './player-priority/player-priority.module';
import { InfluenceRoundModule } from './influence-round/influence-round.module';
import { InfluenceRoundVotesModule } from './influence-round-votes/influence-round-votes.module';
import { OptionContractModule } from './option-contract/option-contract.module';
import { ShortOrderModule } from './short-order/short-order.module';
import { GameRecordModule } from './game-record/game-record.module';
import { PlayerResultModule } from './player-result/player-result.module';
import { TransactionModule } from './transaction/transaction.module';

const yourPusherOptions = {
  cluster: process.env.PUSHER_CLUSTER ?? 'CLUSTER',
  key: process.env.PUSHER_KEY ?? 'YOUR_KEY',
  appId: process.env.PUSHER_APP_ID ?? 'ID',
  secret: process.env.PUSHER_SECRET ?? 'YOUR_SECRET',
};

const chunkingOptions = {
  limit: 4000, //4mb
  enabled: false,
};

@Module({
  imports: [
    TrpcModule,
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.local'],
    }),
    PlayersModule,
    UsersModule,
    RoomsModule,
    RoomMessagesModule,
    RoomUserModule,
    PrismaModule,
    PusherModule.forRoot(yourPusherOptions, chunkingOptions, true),
    GamesModule,
    GameManagementModule,
    CompanyModule,
    SectorModule,
    ResearchDeckModule,
    MeetingMessageModule,
    PhaseModule,
    OperatingRoundModule,
    StockRoundModule,
    GameLogModule,
    TimerModule,
    PlayerOrderModule,
    ShareModule,
    OperatingRoundVoteModule,
    StockHistoryModule,
    ProductionResultModule,
    RevenueDistributionVoteModule,
    CompanyActionModule,
    CapitalGainsModule,
    GameTurnModule,
    PrestigeRewardsModule,
    CardsModule,
    PlayerPriorityModule,
    InfluenceRoundModule,
    InfluenceRoundVotesModule,
    OptionContractModule,
    ShortOrderModule,
    GameRecordModule,
    PlayerResultModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
