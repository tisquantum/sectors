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
import { InsolvencyContributionModule } from './insolvency-contribution/insolvency-contribution.module';
import { PrizeModule } from './prize/prize.module';
import { PrizeVotesModule } from './prize-votes/prize-votes.module';
import { PrizeDistributionModule } from './prize-distribution/prize-distribution.module';
import { CompanyActionOrderModule } from './company-action-order/company-action-order.module';
import { SectorPriorityModule } from './sector-priority/sector-priority.module';
import { HeadlineModule } from './headline/headline.module';
import { PlayerHeadlineModule } from './player-headline/player-headline.module';
import { StockSubRoundModule } from './stock-sub-round/stock-sub-round.module';
import { CompanyAwardTrackModule } from './company-award-track/company-award-track.module';
import { CompanyAwardTrackSpaceModule } from './company-award-track-space/company-award-track-space.module';
import { ExecutiveGameModule } from './executive-game/executive-game.module';
import { ExecutiveGameManagementModule } from './executive-game-management/executive-game-management.module';
import { ExecutivePlayerModule } from './executive-player/executive-player.module';
import { ExecutiveCardModule } from './executive-card/executive-card.module';
import { ExecutiveInfluenceBidModule } from './executive-influence-bid/executive-influence-bid.module';
import { ExecutiveInfluenceModule } from './executive-influence/executive-influence.module';
import { ExecutivePhaseModule } from './executive-phase/executive-phase.module';
import { ExecutiveGameTurnModule } from './executive-game-turn/executive-game-turn.module';
import { ExecutiveInfluenceVoteRoundModule } from './executive-influence-vote-round/executive-influence-vote-round.module';
import { AiBotModule } from './ai-bot/ai-bot.module';
import { FactoryConstructionModule } from './factory-construction/factory-construction.module';
import { ResourceModule } from './resource/resource.module';
import { ConsumptionMarkerModule } from './consumption-marker/consumption-marker.module';
import { MarketingModule } from './marketing/marketing.module';
import { FactoryModule } from './factory/factory.module';
import { FactoryProductionModule } from './factory-production/factory-production.module';

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
    InsolvencyContributionModule,
    PrizeModule,
    PrizeVotesModule,
    PrizeDistributionModule,
    CompanyActionOrderModule,
    SectorPriorityModule,
    HeadlineModule,
    PlayerHeadlineModule,
    StockSubRoundModule,
    CompanyAwardTrackModule,
    CompanyAwardTrackSpaceModule,
    ExecutiveGameModule,
    ExecutiveGameManagementModule,
    ExecutivePlayerModule,
    ExecutiveCardModule,
    ExecutiveInfluenceBidModule,
    ExecutiveInfluenceModule,
    ExecutivePhaseModule,
    ExecutiveGameTurnModule,
    ExecutiveInfluenceVoteRoundModule,
    AiBotModule,
    FactoryConstructionModule,
    ResourceModule,
    ConsumptionMarkerModule,
    MarketingModule,
    FactoryModule,
    FactoryProductionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
