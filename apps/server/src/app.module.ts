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
    ConfigModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
