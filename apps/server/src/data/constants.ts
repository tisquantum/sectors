//make a map between PhaseName and phase times
import { PhaseName } from '@prisma/client';

export const MAX_MARKET_ORDER = 3;

export const MAX_LIMIT_ORDER = 5;

export const MAX_SHORT_ORDER = 2;

/**
 * Phase times in milliseconds
 */
export const phaseTimes = {
  [PhaseName.STOCK_MEET]: 60 * 1000,
  [PhaseName.STOCK_1]: 20 * 1000,
  [PhaseName.STOCK_2]: 20 * 1000,
  [PhaseName.STOCK_3]: 20 * 1000,
  [PhaseName.STOCK_4]: 20 * 1000,
  [PhaseName.STOCK_5]: 20 * 1000,
  [PhaseName.STOCK_1_RESULT]: 10 * 1000,
  [PhaseName.STOCK_2_RESULT]: 10 * 1000,
  [PhaseName.STOCK_3_RESULT]: 10 * 1000,
  [PhaseName.STOCK_4_RESULT]: 10 * 1000,
  [PhaseName.STOCK_5_RESULT]: 10 * 1000,
  [PhaseName.STOCK_RESULT]: 20 * 1000,
  [PhaseName.STOCK_REVEAL]: 20 * 1000,
  [PhaseName.OR_1]: 15 * 1000,
  [PhaseName.OR_2]: 15 * 1000,
  [PhaseName.OR_3]: 15 * 1000,
  [PhaseName.OR_MEET_1]: 15 * 1000,
  [PhaseName.OR_MEET_2]: 15 * 1000,
  [PhaseName.OR_MEET_3]: 15 * 1000,
};

//Stock Grid Prices
export const stockGridPrices = [
  3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 29, 32, 35, 39, 43, 47,
  51, 55, 60, 65, 70, 75, 80, 86, 92, 98, 104, 110, 117, 124, 131, 138, 145,
  153, 161, 169, 177,
];
