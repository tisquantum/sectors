import { Module } from '@nestjs/common';
import { ExecutiveGameManagementService } from './executive-game-management.service';
import { ExecutiveGameModule } from '@server/executive-game/executive-game.module';
import { PrismaModule } from '@server/prisma/prisma.module';
import { PusherModule } from 'nestjs-pusher';
import { ExecutiveInfluenceBidModule } from '@server/executive-influence-bid/executive-influence-bid.module';
import { ExecutivePlayerModule } from '@server/executive-player/executive-player.module';
import { ExecutiveCardModule } from '@server/executive-card/executive-card.module';
import { ExecutiveInfluenceModule } from '@server/executive-influence/executive-influence.module';

@Module({
  imports: [
    PrismaModule,
    PusherModule,
    ExecutiveGameModule,
    ExecutiveInfluenceBidModule,
    ExecutivePlayerModule,
    ExecutiveCardModule,
    ExecutiveInfluenceModule,
  ],
  providers: [ExecutiveGameManagementService],
  exports: [ExecutiveGameManagementService],
})
export class ExecutiveGameManagementModule {}
