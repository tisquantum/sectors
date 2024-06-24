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
  ],
})
export class TrpcModule {}
