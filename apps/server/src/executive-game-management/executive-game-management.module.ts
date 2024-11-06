import { Module } from '@nestjs/common';
import { ExecutiveGameManagementService } from './executive-game-management.service';
import { ExecutiveGameModule } from '@server/executive-game/executive-game.module';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PusherModule } from 'nestjs-pusher';

@Module({
  imports: [PrismaModule, PusherModule, ExecutiveGameModule],
  providers: [ExecutiveGameManagementService],
  exports: [ExecutiveGameManagementService],
})
export class ExecutiveGameManagementModule {}
