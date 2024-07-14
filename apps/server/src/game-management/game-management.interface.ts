import { DistributionStrategy } from '@prisma/client';

export interface StartGameInput {
  roomId: number;
  startingCashOnHand: number;
  consumerPoolNumber: number;
  bankPoolNumber: number;
  distributionStrategy: DistributionStrategy;
}
