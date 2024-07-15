import { DistributionStrategy } from '@prisma/client';

export interface StartGameInput {
  roomId: number;
  roomName: string;
  startingCashOnHand: number;
  consumerPoolNumber: number;
  bankPoolNumber: number;
  distributionStrategy: DistributionStrategy;
}
