import { Module } from '@nestjs/common';
import { AiBotService } from './ai-bot.service';
import { PlayersModule } from '@server/players/players.module';

@Module({
  imports: [
    PlayersModule,
  ],
  providers: [AiBotService],
  exports: [AiBotService],
})
export class AiBotModule {}
