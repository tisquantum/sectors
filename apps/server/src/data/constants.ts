//make a map between PhaseName and phase times
import { PhaseName } from '@prisma/client';

export const MAX_MARKET_ORDER = 3;

export const MAX_LIMIT_ORDER = 5;

export const MAX_SHORT_ORDER = 2;

export const DEFAULT_SHARE_LIMIT = 10;

export const DEFAULT_SHARE_DISTRIBUTION = 15;

/**
 * Phase times in milliseconds
 */
export const phaseTimes = {
  [PhaseName.STOCK_MEET]: 30 * 1000,
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
  [PhaseName.STOCK_RESOLVE]: 30 * 1000,
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
  153, 161, 169, 177, 185, 194, 203, 212, 221, 230, 240, 250, 260, 270, 280,
  291, 302, 313, 324, 335, 346, 358, 370, 382, 394, 406, 418, 431, 444, 457,
  470, 484, 498, 512, 526, 540, 555, 570, 585, 600
];

export const interestRatesByTerm: { [key: number]: number } = {
  1: 2.5,
  2: 4.5,
  3: 4,
  4: 3.5,
  5: 5,
};

export const getInterestRateByTerm = (term: number): number => {
  if (term in interestRatesByTerm) {
    return interestRatesByTerm[term];
  } else {
    // Handle cases where the term is not in the interestRatesByTerm object
    // For example, return a default value or throw an error
    return 0; // Default value if term not found
  }
};