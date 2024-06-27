//make a map between PhaseName and phase times
import { PhaseName, StockTier } from '@prisma/client';

export const MAX_MARKET_ORDER = 3;

export const MAX_LIMIT_ORDER = 5;

export const MAX_SHORT_ORDER = 2;

export const DEFAULT_SHARE_LIMIT = 10;

export const DEFAULT_SHARE_DISTRIBUTION = 15;

/**
 * Phase times in milliseconds
 */
export const phaseTimes = {
  [PhaseName.STOCK_RESOLVE_LIMIT_ORDER]: 15 * 1000,
  [PhaseName.STOCK_MEET]: 30 * 1000,
  [PhaseName.STOCK_ACTION_ORDER]: 15 * 1000,
  [PhaseName.STOCK_ACTION_RESULT]: 10 * 1000,
  [PhaseName.STOCK_ACTION_REVEAL]: 20 * 1000,
  [PhaseName.STOCK_RESOLVE_MARKET_ORDER]: 15 * 1000,
  [PhaseName.STOCK_SHORT_ORDER_INTEREST]: 12 * 1000,
  [PhaseName.STOCK_ACTION_SHORT_ORDER]: 12 * 1000,
  [PhaseName.STOCK_RESOLVE_OPEN_SHORT_ORDER]: 15 * 1000,
  [PhaseName.STOCK_RESULTS_OVERVIEW]: 15 * 1000,
  [PhaseName.OPERATING_PRODUCTION]: 20 * 1000,
  [PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT]: 15 * 1000,
  [PhaseName.OPERATING_MEET]: 30 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE]: 15 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT]: 10 * 1000,
  [PhaseName.OPERATING_COMPANY_VOTE_RESOLVE]: 15 * 1000,
  [PhaseName.CAPITAL_GAINS]: 20 * 1000,
  [PhaseName.DIVESTMENT]: 20 * 1000,
  [PhaseName.SECTOR_NEW_COMPANY]: 10 * 1000,
};

//Stock Grid Prices
export const stockGridPrices = [
  3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 29, 32, 35, 39, 43, 47,
  51, 55, 60, 65, 70, 75, 80, 86, 92, 98, 104, 110, 117, 124, 131, 138, 145,
  153, 161, 169, 177, 185, 194, 203, 212, 221, 230, 240, 250, 260, 270, 280,
  291, 302, 313, 324, 335, 346, 358, 370, 382, 394, 406, 418, 431, 444, 457,
  470, 484, 498, 512, 526, 540, 555, 570, 585, 600
];

/** DEPRECATED */
export const interestRatesByTerm: { [key: number]: number } = {
  1: 2.5,
  2: 4.5,
  3: 4,
  4: 3.5,
  5: 5,
};

export const BORROW_RATE = 5; // 5%

export const getInterestRateByTerm = (term: number): number => {
  if (term in interestRatesByTerm) {
    return interestRatesByTerm[term];
  } else {
    // Handle cases where the term is not in the interestRatesByTerm object
    // For example, return a default value or throw an error
    return 0; // Default value if term not found
  }
};

export interface StockTierChartRange {
  tier: StockTier;
  chartMinValue: number;
  chartMaxValue: number;
  fillSize: number;
}

export const stockTierChartRanges: StockTierChartRange[] = [
  {
    tier: StockTier.TIER_1,
    chartMinValue: 0,
    chartMaxValue: 20,
    fillSize: 2,
  },
  {
    tier: StockTier.TIER_2,
    chartMinValue: 21,
    chartMaxValue: 50,
    fillSize: 3,
  },
  {
    tier: StockTier.TIER_3,
    chartMinValue: 51,
    chartMaxValue: 100,
    fillSize: 4,
  },
  {
    tier: StockTier.TIER_4,
    chartMinValue: 101,
    chartMaxValue: 300,
    fillSize: 5,
  },
  {
    tier: StockTier.TIER_5,
    chartMinValue: 301,
    chartMaxValue: 1000,
    fillSize: 7,
  },
];