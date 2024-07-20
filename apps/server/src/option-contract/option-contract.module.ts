import { Module } from '@nestjs/common';
import { OptionContractService } from './option-contract.service';

@Module({
  providers: [OptionContractService],
  exports: [OptionContractService],
})
export class OptionContractModule {}
