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
import { GamePlayerModule } from './game-player/game-player.module';
import { GameManagementModule } from './game-management/game-management.module';
import { GameCompanyModule } from './game-company/game-company.module';

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
    GamePlayerModule,
    GameManagementModule,
    GameCompanyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
