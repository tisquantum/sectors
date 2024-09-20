import { DistributionStrategy } from '@prisma/client';

export interface StartGameInput {
  roomId: number;
  roomName: string;
  startingCashOnHand: number;
  consumerPoolNumber: number;
  bankPoolNumber: number;
  distributionStrategy: DistributionStrategy;
  gameMaxTurns?: number;
  playerOrdersConcealed: boolean;
  useLimitOrders: boolean;
  useShortOrders: boolean;
  useOptionOrders: boolean;
}
