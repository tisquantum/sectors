//make a map between PhaseName and phase times
import {
  Company,
  CompanyTier,
  OperatingRoundAction,
  PhaseName,
  PrestigeReward,
  SectorName,
  StockTier,
} from '@prisma/client';

export const USER_NAME_MAX_LENGTH = 20;

export const MAX_MARKET_ORDER_ACTIONS = 3;

export const MAX_LIMIT_ORDER_ACTIONS = 5;

export const MAX_SHORT_ORDER_ACTIONS = 2;

export const MAX_SHORT_ORDER_QUANTITY = 3;

export const DEFAULT_SHARE_LIMIT = 12;

export const PRESTIGE_TRACK_LENGTH = 10;

export const PRESTIGE_ACTION_TOKEN_COST = 1;

export const DEFAULT_SHARE_DISTRIBUTION = 10;

export const STABLE_ECONOMY_SCORE = 10;

export const MAX_SHARE_PERCENTAGE = 60;
export const MAX_SHARE_DEFAULT =
  DEFAULT_SHARE_DISTRIBUTION * (MAX_SHARE_PERCENTAGE / 100);

export const DEFAULT_INCREASE_UNIT_PRICE = 20;
export const DEFAULT_DECREASE_UNIT_PRICE = 20;
export const DEFAULT_RESEARCH_DECK_SIZE = 12;

export const GOVERNMENT_GRANT_AMOUNT = 500;

export const MARKETING_CONSUMER_BONUS = 4;

export const DEFAULT_INFLUENCE = 100;

export const OPTION_CONTRACT_ACTIVE_COUNT = 3;
export const OPTION_CONTRACT_MIN_TERM = 1;
export const OPTION_CONTRACT_MAX_TERM = 4;
export const LOAN_AMOUNT = 250;
export const LOAN_INTEREST_RATE = 0.1;
export const PRESTIGE_EFFECT_INCREASE_AMOUNT = 2;
export const AUTOMATION_EFFECT_OPERATIONS_REDUCTION = 20;
/**
 * Phase times in milliseconds
 */
export const phaseTimes = {
  [PhaseName.INFLUENCE_BID_ACTION]: 60 * 1000,
  [PhaseName.INFLUENCE_BID_REVEAL]: 10 * 1000,
  [PhaseName.INFLUENCE_BID_RESOLVE]: 15 * 1000,
  [PhaseName.STOCK_RESOLVE_LIMIT_ORDER]: 15 * 1000,
  [PhaseName.STOCK_MEET]: 30 * 1000,
  [PhaseName.STOCK_ACTION_ORDER]: 30 * 1000,
  [PhaseName.STOCK_ACTION_RESULT]: 10 * 1000,
  [PhaseName.STOCK_ACTION_REVEAL]: 12 * 1000,
  [PhaseName.STOCK_RESOLVE_MARKET_ORDER]: 12 * 1000,
  [PhaseName.STOCK_SHORT_ORDER_INTEREST]: 12 * 1000,
  [PhaseName.STOCK_ACTION_SHORT_ORDER]: 12 * 1000,
  [PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER]: 12 * 1000,
  [PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER]: 12 * 1000,
  [PhaseName.STOCK_RESOLVE_OPTION_ORDER]: 15 * 1000,
  [PhaseName.STOCK_ACTION_OPTION_ORDER]: 20 * 1000,
  [PhaseName.STOCK_OPEN_LIMIT_ORDERS]: 10 * 1000,
  [PhaseName.STOCK_RESULTS_OVERVIEW]: 15 * 1000,
  [PhaseName.OPERATING_PRODUCTION]: 15 * 1000,
  [PhaseName.OPERATING_PRODUCTION_VOTE]: 30 * 1000,
  [PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE]: 10 * 1000,
  [PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT]: 15 * 1000,
  [PhaseName.OPERATING_MEET]: 30 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE]: 20 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT]: 12 * 1000,
  [PhaseName.OPERATING_COMPANY_VOTE_RESOLVE]: 10 * 1000,
  [PhaseName.CAPITAL_GAINS]: 15 * 1000,
  [PhaseName.DIVESTMENT]: 15 * 1000,
  [PhaseName.SECTOR_NEW_COMPANY]: 10 * 1000,
  [PhaseName.START_TURN]: 20 * 1000,
  [PhaseName.END_TURN]: 20 * 1000,
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
export function getStockPriceStepsUp(
  currentPrice: number,
  steps: number,
): number {
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
export function getStockPriceWithStepsDown(
  currentPrice: number,
  steps: number,
): number {
  const currentIndex = stockGridPrices.indexOf(currentPrice);
  if (currentIndex === -1) throw new Error('Invalid current stock price');
  const newIndex = Math.max(currentIndex - Math.abs(steps), 0);
  return stockGridPrices[newIndex];
}

export const interestRatesByTerm: { [key: number]: number } = {
  1: 0.5,
  2: 0.1,
  3: 0.15,
  4: 0.2,
  5: 0.25,
};

export const sectorVolatility: Record<SectorName, number> = {
  [SectorName.CONSUMER_CYCLICAL]: 0.7,
  [SectorName.CONSUMER_DEFENSIVE]: 0.2,
  [SectorName.CONSUMER_DISCRETIONARY]: 0.35,
  [SectorName.CONSUMER_STAPLES]: 0.3,
  [SectorName.ENERGY]: 0.45,
  [SectorName.GENERAL]: 0,
  [SectorName.HEALTHCARE]: 0.6,
  [SectorName.INDUSTRIALS]: 0.4,
  [SectorName.MATERIALS]: 0.5,
  [SectorName.TECHNOLOGY]: 0.9,
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
    OperatingRoundAction.MARKETING_SMALL_CAMPAIGN,
    OperatingRoundAction.MERGE,
    OperatingRoundAction.RESEARCH,
    OperatingRoundAction.SHARE_BUYBACK,
    OperatingRoundAction.SHARE_ISSUE,
    OperatingRoundAction.PRODUCTION,
    OperatingRoundAction.SPEND_PRESTIGE,
    OperatingRoundAction.VETO,
    OperatingRoundAction.LOBBY,
    OperatingRoundAction.INCREASE_PRICE,
    OperatingRoundAction.DECREASE_PRICE,
    OperatingRoundAction.LOBBY,
    OperatingRoundAction.LOAN,
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
  let chosenCompany;
  if (!currentCompanyId) {
    chosenCompany = sortedCompanies[0];
  } else {
    const currentIndex = sortedCompanies.findIndex(
      (company) => company.id === currentCompanyId,
    );
    chosenCompany =
      sortedCompanies[(currentIndex + 1) % sortedCompanies.length];
  }
  return chosenCompany;
};

export enum ThroughputRewardType {
  SECTOR_REWARD = 'SECTOR_REWARD',
  STOCK_PENALTY = 'STOCK_PENALTY',
}
export interface ThroughputReward {
  type: ThroughputRewardType;
  share_price_steps_down?: number;
  share_price_steps_up?: number;
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
      return {
        type: ThroughputRewardType.STOCK_PENALTY,
        share_price_steps_down: 0,
      };
    case 2:
      return {
        type: ThroughputRewardType.STOCK_PENALTY,
        share_price_steps_down: 1,
      };
    case 3:
      return {
        type: ThroughputRewardType.STOCK_PENALTY,
        share_price_steps_down: 2,
      };
    case 4:
      return {
        type: ThroughputRewardType.STOCK_PENALTY,
        share_price_steps_down: 2,
      };
    case 5:
      return {
        type: ThroughputRewardType.STOCK_PENALTY,
        share_price_steps_down: 3,
      };
    case 6:
      return {
        type: ThroughputRewardType.STOCK_PENALTY,
        share_price_steps_down: 3,
      };
    case 7:
      return {
        type: ThroughputRewardType.STOCK_PENALTY,
        share_price_steps_down: 4,
      };
    default:
      return {
        type: ThroughputRewardType.SECTOR_REWARD,
        share_price_steps_down: 1,
      };
  }
};

export const CompanyActionCosts = {
  [OperatingRoundAction.DOWNSIZE]: 200,
  [OperatingRoundAction.EXPANSION]: 350,
  [OperatingRoundAction.MARKETING]: 220,
  [OperatingRoundAction.MARKETING_SMALL_CAMPAIGN]: 100,
  [OperatingRoundAction.MERGE]: 1000,
  [OperatingRoundAction.RESEARCH]: 200,
  [OperatingRoundAction.SHARE_BUYBACK]: 0,
  [OperatingRoundAction.SHARE_ISSUE]: 50,
  [OperatingRoundAction.PRODUCTION]: 0,
  [OperatingRoundAction.SPEND_PRESTIGE]: 0,
  [OperatingRoundAction.VETO]: 0,
  [OperatingRoundAction.LOBBY]: 120,
  [OperatingRoundAction.INCREASE_PRICE]: 0,
  [OperatingRoundAction.DECREASE_PRICE]: 0,
  [OperatingRoundAction.LOAN]: 0,
};

export const CompanyTierData = {
  [CompanyTier.INCUBATOR]: {
    operatingCosts: 10,
    supplyMax: 2,
  },
  [CompanyTier.STARTUP]: {
    operatingCosts: 15,
    supplyMax: 3,
  },
  [CompanyTier.GROWTH]: {
    operatingCosts: 20,
    supplyMax: 4,
  },
  [CompanyTier.ESTABLISHED]: {
    operatingCosts: 40,
    supplyMax: 5,
  },
  [CompanyTier.ENTERPRISE]: {
    operatingCosts: 60,
    supplyMax: 6,
  },
  [CompanyTier.CONGLOMERATE]: {
    operatingCosts: 90,
    supplyMax: 8,
  },
  [CompanyTier.TITAN]: {
    operatingCosts: 150,
    supplyMax: 10,
  },
};

export const getNextCompanyTier = (currentTier: CompanyTier): CompanyTier => {
  const tierOrder = [
    CompanyTier.INCUBATOR,
    CompanyTier.STARTUP,
    CompanyTier.GROWTH,
    CompanyTier.ESTABLISHED,
    CompanyTier.ENTERPRISE,
    CompanyTier.CONGLOMERATE,
    CompanyTier.TITAN,
  ];
  const currentIndex = tierOrder.indexOf(currentTier);
  return tierOrder[currentIndex + 1];
};

export const getPreviousCompanyTier = (
  currentTier: CompanyTier,
): CompanyTier => {
  const tierOrder = [
    CompanyTier.INCUBATOR,
    CompanyTier.STARTUP,
    CompanyTier.GROWTH,
    CompanyTier.ESTABLISHED,
    CompanyTier.ENTERPRISE,
    CompanyTier.CONGLOMERATE,
    CompanyTier.TITAN,
  ];
  const currentIndex = tierOrder.indexOf(currentTier);
  return tierOrder[currentIndex - 1];
};

export const STOCK_ACTION_SUB_ROUND_MAX = 2;

export const CapitalGainsTiers = [
  {
    minNetWorth: 0,
    maxNetWorth: 1000,
    taxPercentage: 0,
  },
  {
    minNetWorth: 1001,
    maxNetWorth: 2000,
    taxPercentage: 5,
  },
  {
    minNetWorth: 2000,
    maxNetWorth: 3000,
    taxPercentage: 7,
  },
  {
    minNetWorth: 3000,
    maxNetWorth: 4000,
    taxPercentage: 8,
  },
  {
    minNetWorth: 4000,
    maxNetWorth: 5000,
    taxPercentage: 10,
  },
  {
    minNetWorth: 5000,
    maxNetWorth: Number.MAX_SAFE_INTEGER,
    taxPercentage: 12,
  },
];

export interface PrestigeTrackItem {
  type: PrestigeReward;
  name: string;
  description: string;
  probability: number;
  cost: number;
}

export const PrestigeTrack = [
  {
    type: PrestigeReward.ELASTICITY,
    name: 'Sector Elasticity',
    description: 'The sector receives +1 base demand.',
    probability: 0.08,
    cost: 3,
  },
  {
    type: PrestigeReward.MAGNET_EFFECT,
    name: 'Magnet Effect',
    description:
      'All other companies in the stock sector receive +1 stock price.',
    probability: 0.05,
    cost: 2,
  },
  {
    type: PrestigeReward.INVESTOR_CONFIDENCE,
    name: 'Investor Confidence',
    description: 'The company puts 3 more shares into the open market.',
    probability: 0.09,
    cost: 2,
  },
  {
    type: PrestigeReward.CAPITAL_INJECTION,
    name: 'Capital Injection',
    description: 'The company receives the money on this space of the track.',
    probability: 0.1,
    cost: 2,
  },
  {
    type: PrestigeReward.BULL_SIGNAL,
    name: 'Bull Signal',
    description: 'The company receives a +1 stock price adjustment.',
    probability: 0.12,
    cost: 1,
  },
];
