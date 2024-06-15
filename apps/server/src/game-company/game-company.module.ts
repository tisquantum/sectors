import { Module } from '@nestjs/common';
import { GameCompanyService } from './game-company.service';

@Module({
  providers: [GameCompanyService],
  exports: [GameCompanyService],
})
export class GameCompanyModule {}
