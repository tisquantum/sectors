//make a map between PhaseName and phase times
import {
  Company,
  CompanyTier,
  OperatingRoundAction,
  PhaseName,
  StockTier,
} from '@prisma/client';

export const MAX_MARKET_ORDER = 3;

export const MAX_LIMIT_ORDER = 5;

export const MAX_SHORT_ORDER = 2;

export const DEFAULT_SHARE_LIMIT = 10;

export const DEFAULT_SHARE_DISTRIBUTION = 10;

export const STABLE_ECONOMY_SCORE = 15;

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
  [PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER]: 15 * 1000,
  [PhaseName.STOCK_RESOLVE_OPTION_ORDER]: 15 * 1000,
  [PhaseName.STOCK_OPEN_LIMIT_ORDERS]: 10 * 1000,
  [PhaseName.STOCK_RESULTS_OVERVIEW]: 15 * 1000,
  [PhaseName.OPERATING_PRODUCTION]: 15 * 1000,
  [PhaseName.OPERATING_PRODUCTION_VOTE]: 20 * 1000,
  [PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE]: 10 * 1000,
  [PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT]: 15 * 1000,
  [PhaseName.OPERATING_MEET]: 30 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE]: 15 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT]: 10 * 1000,
  [PhaseName.OPERATING_COMPANY_VOTE_RESOLVE]: 15 * 1000,
  [PhaseName.CAPITAL_GAINS]: 20 * 1000,
  [PhaseName.DIVESTMENT]: 20 * 1000,
  [PhaseName.SECTOR_NEW_COMPANY]: 10 * 1000,
  [PhaseName.START_TURN]: 10 * 1000,
  [PhaseName.END_TURN]: 10 * 1000,
};

//Stock Grid Prices
export const stockGridPrices = [
  3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 29, 32, 35, 39, 43, 47,
  51, 55, 60, 65, 70, 75, 80, 86, 92, 98, 104, 110, 117, 124, 131, 138, 145,
  153, 161, 169, 177, 185, 194, 203, 212, 221, 230, 240, 250, 260, 270, 280,
  291, 302, 313, 324, 335, 346, 358, 370, 382, 394, 406, 418, 431, 444, 457,
  470, 484, 498, 512, 526, 540, 555, 570, 585, 600,
];


/**
 * Move the stock price up by a given number of steps.
 * @param currentPrice The current stock price.
 * @param steps The number of steps to move up.
 * @returns The new stock price after moving up.
 */
export function getStockPriceStepsUp(currentPrice: number, steps: number): number {
  const currentIndex = stockGridPrices.indexOf(currentPrice);
  if (currentIndex === -1) throw new Error('Invalid current stock price');
  
  const newIndex = Math.min(currentIndex + steps, stockGridPrices.length - 1);
  return stockGridPrices[newIndex];
}

/**
 * Move the stock price down by a given number of steps.
 * @param currentPrice The current stock price.
 * @param steps The number of steps to move down.
 * @returns The new stock price after moving down.
 */
export function getStockPriceWithStepsDown(currentPrice: number, steps: number): number {
  const currentIndex = stockGridPrices.indexOf(currentPrice);
  if (currentIndex === -1) throw new Error('Invalid current stock price');
  const newIndex = Math.max(currentIndex - Math.abs(steps), 0);
  return stockGridPrices[newIndex];
}

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
    fillSize: 1,
  },
  {
    tier: StockTier.TIER_2,
    chartMinValue: 21,
    chartMaxValue: 150,
    fillSize: 2,
  },
  {
    tier: StockTier.TIER_3,
    chartMinValue: 151,
    chartMaxValue: 300,
    fillSize: 4,
  },
  {
    tier: StockTier.TIER_4,
    chartMinValue: 301,
    chartMaxValue: 500,
    fillSize: 5,
  },
  {
    tier: StockTier.TIER_5,
    chartMinValue: 501,
    chartMaxValue: 1000,
    fillSize: 6,
  },
];

const overdraftTiers = [
  {
    tier: StockTier.TIER_1,
    maxOverdraft: 100,
    portfolioThreshold: 500,
  },
  {
    tier: StockTier.TIER_2,
    maxOverdraft: 200,
    portfolioThreshold: 1000,
  },
  {
    tier: StockTier.TIER_3,
    maxOverdraft: 400,
    portfolioThreshold: 2000,
  },
  {
    tier: StockTier.TIER_4,
    maxOverdraft: 700,
    portfolioThreshold: 5000,
  },
  {
    tier: StockTier.TIER_5,
    maxOverdraft: 1000,
    portfolioThreshold: 10000,
  },
];

//For resolving company voting ties
export const companyVoteActionPriority = (
  actions: OperatingRoundAction[],
): OperatingRoundAction => {
  const actionPriority = [
    OperatingRoundAction.DOWNSIZE,
    OperatingRoundAction.EXPANSION,
    OperatingRoundAction.MARKETING,
    OperatingRoundAction.MERGE,
    OperatingRoundAction.RESEARCH,
    OperatingRoundAction.SHARE_BUYBACK,
    OperatingRoundAction.SHARE_ISSUE,
    OperatingRoundAction.PRODUCTION,
    OperatingRoundAction.SPEND_PRESTIGE,
    OperatingRoundAction.VETO,
    OperatingRoundAction.LOBBY,
    OperatingRoundAction.INCREASE_PRICE,
    OperatingRoundAction.DECREASE_PRICE
  ];
  return actions.sort(
    (a, b) => actionPriority.indexOf(a) - actionPriority.indexOf(b),
  )[0];
};

export const getCompanyOperatingRoundTurnOrder = (
  companies: Company[],
): Company[] => {
  return companies.sort(
    (a: Company, b: Company) =>
      (a.currentStockPrice || 0) - (b.currentStockPrice || 0),
  );
};

export const getNextCompanyOperatingRoundTurn = (
  companies: Company[],
  currentCompanyId?: string,
): Company => {
  const sortedCompanies = getCompanyOperatingRoundTurnOrder(companies);
  if (!currentCompanyId) {
    return sortedCompanies[0];
  } else {
    const currentIndex = sortedCompanies.findIndex(
      (company) => company.id === currentCompanyId,
    );
    return sortedCompanies[(currentIndex + 1) % sortedCompanies.length];
  }
};

export enum ThroughputRewardType {
  SECTOR_REWARD = 'SECTOR_REWARD',
  STOCK_PENALTY = 'STOCK_PENALTY',
}
export interface ThroughputReward {
  type: ThroughputRewardType;
  share_price_steps_down?: number;
}

export const throughputRewardOrPenalty = (
  throughput: number,
): ThroughputReward => {
  //make the negative or number absolute
  throughput = Math.abs(throughput);
  switch (throughput) {
    //optimal efficiency
    case 0:
      return { type: ThroughputRewardType.SECTOR_REWARD };
    case 1:
      return { type: ThroughputRewardType.STOCK_PENALTY, share_price_steps_down: 1 };
    case 2:
      return { type: ThroughputRewardType.STOCK_PENALTY, share_price_steps_down: 1 };
    case 3:
      return { type: ThroughputRewardType.STOCK_PENALTY, share_price_steps_down: 2 };
    case 4:
      return { type: ThroughputRewardType.STOCK_PENALTY, share_price_steps_down: 2 };
    case 5:
      return { type: ThroughputRewardType.STOCK_PENALTY, share_price_steps_down: 3 };
    case 6:
      return { type: ThroughputRewardType.STOCK_PENALTY, share_price_steps_down: 3 };
    case 7:
      return { type: ThroughputRewardType.STOCK_PENALTY, share_price_steps_down: 4 };
    default:
      return { type: ThroughputRewardType.SECTOR_REWARD, share_price_steps_down: 1 };
  }
};

export const CompanyActionCosts = {
  [OperatingRoundAction.DOWNSIZE]: 500,
  [OperatingRoundAction.EXPANSION]: 500,
  [OperatingRoundAction.MARKETING]: 200,
  [OperatingRoundAction.MERGE]: 1000,
  [OperatingRoundAction.RESEARCH]: 200,
  [OperatingRoundAction.SHARE_BUYBACK]: 0,
  [OperatingRoundAction.SHARE_ISSUE]: 50,
  [OperatingRoundAction.PRODUCTION]: 0,
  [OperatingRoundAction.SPEND_PRESTIGE]: 0,
  [OperatingRoundAction.VETO]: 0,
  [OperatingRoundAction.LOBBY]: 0,
  [OperatingRoundAction.INCREASE_PRICE]: 0,
  [OperatingRoundAction.DECREASE_PRICE]: 0,
}

export const CompanyTierData = {
  [CompanyTier.INCUBATOR]: {
    operatingCosts: 25,
    supplyMax: 2
  },
  [CompanyTier.STARTUP]: {
    operatingCosts: 50,
    supplyMax: 3
  },
  [CompanyTier.GROWTH]: {
    operatingCosts: 100,
    supplyMax: 4
  },
  [CompanyTier.ESTABLISHED]: {
    operatingCosts: 150,
    supplyMax: 5
  },
  [CompanyTier.ENTERPRISE]: {
    operatingCosts: 200,
    supplyMax: 6
  },
  [CompanyTier.CONGLOMERATE]: {
    operatingCosts: 300,
    supplyMax: 8
  },
  [CompanyTier.TITAN]: {
    operatingCosts: 400,
    supplyMax: 10
  },
}
