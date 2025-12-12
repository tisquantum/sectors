//make a map between PhaseName and phase times
import {
  Company,
  CompanyActionOrder,
  CompanyTier,
  DistributionStrategy,
  OperatingRoundAction,
  PhaseName,
  PrestigeReward,
  ResourceType,
  Sector,
  SectorName,
  StockTier,
} from '@prisma/client';
export const GLOBAL_ROOM_ID = process.env.NEXT_PUBLIC_GLOBAL_ROOM_ID ?? '1';
export const GAME_SETUP_DEFAULT_BANK_POOL_NUMBER = 7500;
export const GAME_SETUP_DEFAULT_CONSUMER_POOL_NUMBER = 75;
export const GAME_SETUP_DEFAULT_STARTING_CASH_ON_HAND = 300;
export const GAME_SETUP_DEFAULT_DISTRIBUTION_STRATEGY =
  DistributionStrategy.PRIORITY;
export const GAME_SETUP_DEFAULT_GAME_MAX_TURNS = 8;
export const GAME_SETUP_DEFAULT_PLAYER_ORDERS_CONCEALED = false;
export const GAME_SETUP_DEFAULT_TIMERLESS = true;

export const ROOM_NAME_CHAR_LIMIT = 30;

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

export const DEFAULT_INCREASE_UNIT_PRICE = 10;
export const DEFAULT_DECREASE_UNIT_PRICE = 10;
export const DEFAULT_RESEARCH_DECK_SIZE = 12;

export const GOVERNMENT_GRANT_AMOUNT = 500;

export const MARKETING_CONSUMER_BONUS = 2;
export const LARGE_MARKETING_CAMPAIGN_DEMAND = 4;
export const SMALL_MARKETING_CAMPAIGN_DEMAND = 3;

export const DEFAULT_INFLUENCE = process.env.INFLUENCE_MAX
  ? parseInt(process.env.INFLUENCE_MAX)
  : 50;

export const OPTION_CONTRACT_ACTIVE_COUNT = 3;
export const OPTION_CONTRACT_MIN_TERM = 1;
export const OPTION_CONTRACT_MAX_TERM = 4;
export const LOAN_AMOUNT = 250;
export const LOAN_INTEREST_RATE = 0.1;
export const PRESTIGE_EFFECT_INCREASE_AMOUNT = 2;
export const AUTOMATION_EFFECT_OPERATIONS_REDUCTION = 20;
export const CAPITAL_INJECTION_STARTER = 200;
export const CAPITAL_INJECTION_BOOSTER = 100;
export const CORPORATE_ESPIONAGE_PRESTIGE_REDUCTION = 2;
export const LOBBY_DEMAND_BOOST = 4;
export const ACTION_ISSUE_SHARE_AMOUNT = 2;
export const BANKRUPTCY_SHARE_PERCENTAGE_RETAINED = 10;
export const OURSOURCE_SUPPLY_BONUS = 3;
export const PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION = 50;
export const INSOLVENT_EXTRA_PHASE_TIME = 50 * 1000;
export const STRATEGIC_RESERVE_REVENUE_MULTIPLIER_PERCENTAGE = 10;
export const SURGE_PRICING_REVENUE_MULTIPLIER_PERCENTAGE = 20;
export const STEADY_DEMAND_CONSUMER_BONUS = 2;
export const BOOM_CYCLE_STOCK_CHART_BONUS = 3;
export const PRIZE_FREEZE_AMOUNT = 2;
export const FASTTRACK_APPROVAL_AMOUNT_DEMAND = 2;
export const FASTTRACK_APPROVAL_AMOUNT_CONSUMERS = 3;
export const INNOVATION_SURGE_CARD_DRAW_BONUS = 2;
export const B2B_COMPANY_BONUS = 2;
export const LICENSING_AGREEMENT_UNIT_PRICE_BONUS = 20;
export const ROOM_MESSAGE_MAX_LENGTH = 150;
export const DEFAULT_SECTOR_AMOUNT = 3;
export const PRIZE_CASH_SUM = 100;
export const INACTIVE_COMPANY_PER_TURN_DISCOUNT = 5;
export const AWARD_TRACK_SPACES_RESEARCH = 5;
export const AWARD_TRACK_SPACES_CATALYST = 6;
export const AWARD_TRACK_SPACES_MARKETING = 9;
export const AWARD_PRESTIGE_BONUS = 2;
export const OUTSOURCE_PRESTIGE_PENALTY = 1;

/**
 * Phase times in milliseconds
 */
export const phaseTimes: Record<PhaseName, number> = {
  [PhaseName.INFLUENCE_BID_ACTION]: 55 * 1000,
  [PhaseName.INFLUENCE_BID_REVEAL]: 10 * 1000,
  [PhaseName.INFLUENCE_BID_RESOLVE]: 15 * 1000,
  [PhaseName.STOCK_RESOLVE_LIMIT_ORDER]: 15 * 1000,
  [PhaseName.STOCK_MEET]: 30 * 1000,
  [PhaseName.STOCK_ACTION_ORDER]: 55 * 1000,
  [PhaseName.STOCK_ACTION_RESULT]: 10 * 1000,
  [PhaseName.STOCK_ACTION_REVEAL]: 12 * 1000,
  [PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES]: 15 * 1000,
  [PhaseName.SET_COMPANY_IPO_PRICES]: 15 * 1000,
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
  [PhaseName.OPERATING_PRODUCTION_VOTE]: 50 * 1000,
  [PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE]: 10 * 1000,
  [PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT]: 15 * 1000,
  [PhaseName.OPERATING_MEET]: 30 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE]: 40 * 1000,
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT]: 10 * 1000,
  [PhaseName.OPERATING_COMPANY_VOTE_RESOLVE]: 10 * 1000,
  [PhaseName.CAPITAL_GAINS]: 12 * 1000,
  [PhaseName.DIVESTMENT]: 12 * 1000,
  [PhaseName.SECTOR_NEW_COMPANY]: 10 * 1000,
  [PhaseName.START_TURN]: 30 * 1000,
  [PhaseName.END_TURN]: 20 * 1000,
  [PhaseName.PRIZE_VOTE_ACTION]: 55 * 1000,
  [PhaseName.PRIZE_VOTE_RESOLVE]: 12 * 1000,
  [PhaseName.PRIZE_DISTRIBUTE_ACTION]: 50 * 1000,
  [PhaseName.PRIZE_DISTRIBUTE_RESOLVE]: 12 * 1000,
  [PhaseName.HEADLINE_RESOLVE]: 12 * 1000,
  [PhaseName.FACTORY_CONSTRUCTION]: 12 * 1000, // Legacy - kept for backward compatibility
  [PhaseName.FACTORY_CONSTRUCTION_RESOLVE]: 12 * 1000, // Legacy - kept for backward compatibility
  [PhaseName.MODERN_OPERATIONS]: 60 * 1000, // Combined: Factory Construction + Marketing + Research
  [PhaseName.RESOLVE_MODERN_OPERATIONS]: 12 * 1000, // Combined resolve for all operations
  [PhaseName.RUSTED_FACTORY_UPGRADE]: 12 * 1000, // Resolve rusted factory upgrades
  [PhaseName.MARKETING_CAMPAIGN]: 50 * 1000,
  [PhaseName.MARKETING_CAMPAIGN_RESOLVE]: 12 * 1000,
  [PhaseName.RESEARCH_ACTION]: 50 * 1000,
  [PhaseName.RESEARCH_ACTION_RESOLVE]: 12 * 1000,
  [PhaseName.CONSUMPTION_PHASE]: 60 * 1000,
  [PhaseName.EARNINGS_CALL]: 12 * 1000,
  [PhaseName.RESOLVE_INSOLVENCY]: 60 * 1000,
  [PhaseName.SHAREHOLDER_MEETING]: 60 * 1000, 
  [PhaseName.MARKETING_AND_RESEARCH_ACTION]: 60 * 1000, 
  [PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE]: 12 * 1000,
};

//Stock Grid Prices
export const stockGridPrices = [
  3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 29, 32, 35, 39, 43, 47,
  51, 55, 60, 65, 70, 75, 80, 86, 92, 98, 104, 110, 117, 124, 131, 138, 145,
  153, 161, 169, 177, 185, 194, 203, 212, 221, 230, 240, 250, 260, 270, 280,
  291, 302, 313, 324, 335, 346, 358, 370, 382, 394, 406, 418, 431, 444, 457,
  470, 484, 498, 512, 526, 540, 555, 570, 585, 600,
];

// Worker track values account for the economy score + the worker salaries.
// As workers are added to factories, the economy score increases because the global workforce is increasing strengthing the economy.
// As workers are added to factories, the worker salaries increase because the global workforce is increasing strengthing the economy.
export const workerTrackValues = [
  10, 10, 10, 10, 11, 11, 11, 11, 12, 12,
  13, 13, 13, 13, 14, 14, 14, 14, 15, 15,
  15, 15, 16, 16, 16, 16, 17, 17, 17, 17,
  18, 18, 18, 18, 19, 19, 19, 19, 20, 20,
  20, 20, 21, 21, 21, 21, 22, 22, 22, 22,
  23, 23, 23, 23, 24, 24, 24, 24, 25, 25,
  25, 25, 26, 26, 26, 26, 27, 27, 27, 27,
  28, 28, 28, 28, 29, 29, 29, 29, 30, 30
]

export const DEFAULT_WORKERS = 40;

export function getSectorResourceForSectorName(sectorName: SectorName) {
  switch(sectorName) {
    case SectorName.CONSUMER_DEFENSIVE:
      return ResourceType.CONSUMER_DEFENSIVE;
    case SectorName.CONSUMER_CYCLICAL:
      return ResourceType.CONSUMER_CYCLICAL;
    case SectorName.CONSUMER_DISCRETIONARY:
      return ResourceType.CONSUMER_DISCRETIONARY;
    case SectorName.CONSUMER_STAPLES:
      return ResourceType.CONSUMER_STAPLES;
    case SectorName.ENERGY:
      return ResourceType.ENERGY;
    case SectorName.HEALTHCARE:
      return ResourceType.HEALTHCARE;
    case SectorName.INDUSTRIALS:
      return ResourceType.INDUSTRIALS;
    case SectorName.MATERIALS:
      return ResourceType.MATERIALS;
    case SectorName.TECHNOLOGY:
      return ResourceType.TECHNOLOGY;
    default:
      return ResourceType.GENERAL;
  }
}

//OUTPUT RESOURCES?
export const RESOURCE_PRICES_CIRCLE = [12, 15, 17, 14, 18, 16, 20, 19, 22, 24, 26, 23, 28, 25, 30, 27, 32, 29, 35, 31, 33, 36, 34, 38, 40]

export const RESOURCE_PRICES_SQUARE = [5, 6, 7, 8, 10, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 32, 34, 36, 38, 40]

export const RESOURCE_PRICES_TRIANGLE = [8, 11, 14, 7, 16, 20, 6, 18, 25, 5, 22, 27, 9, 24, 30, 10, 35, 12, 40, 15, 38, 19, 43, 17, 46, 21, 50, 26, 55, 60]

export const RESOURCE_PRICES_GEAR = [20, 22, 24, 27, 30, 34, 38, 42, 47, 53, 58, 65, 72, 80, 90]

//INPUT RESOURCES?
//if these prices were somehow tied to some metric of the company, it could instead drive differentiaion into how much their factories cost.  what resource price *they* get to use to build.
//because right now this track is linear like the other resources are, when you buy a resource at a price, the next spot becomes available.  if instead it was per company in the sector, it could drive differentiation.
// alternatively, the company pays some mutliplier for the resource price given some metric of the company.

export const RESOURCE_PRICES_TECHNOLOGY = [12, 18, 14, 24, 18, 30, 22, 36, 38, 40]

export const RESOURCE_PRICES_INDUSTRIAL = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]

export const RESOURCE_PRICES_ENERGY = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]

export const RESOURCE_PRICES_HEALTHCARE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const RESOURCE_PRICES_CONSUMER_DEFENSIVE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const RESOURCE_PRICES_CONSUMER_CYCLICAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const RESOURCE_PRICES_CONSUMER_DISCRETIONARY = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const RESOURCE_PRICES_CONSUMER_STAPLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const RESOURCE_PRICES_MATERIALS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function getResourcePriceForResourceType(resourceType: ResourceType) {
  switch(resourceType) {
    case ResourceType.CIRCLE:
      return RESOURCE_PRICES_CIRCLE
    case ResourceType.SQUARE:
      return RESOURCE_PRICES_SQUARE;
    case ResourceType.TRIANGLE:
      return RESOURCE_PRICES_TRIANGLE;
    case ResourceType.CONSUMER_DEFENSIVE:
      return RESOURCE_PRICES_CONSUMER_DEFENSIVE;
    case ResourceType.CONSUMER_CYCLICAL:
      return RESOURCE_PRICES_CONSUMER_CYCLICAL;
    case ResourceType.CONSUMER_DISCRETIONARY:
      return RESOURCE_PRICES_CONSUMER_DISCRETIONARY;
    case ResourceType.CONSUMER_STAPLES:
      return RESOURCE_PRICES_CONSUMER_STAPLES;
    case ResourceType.ENERGY:
      return RESOURCE_PRICES_ENERGY;
    case ResourceType.HEALTHCARE:
      return RESOURCE_PRICES_HEALTHCARE;
    case ResourceType.INDUSTRIALS:
      return RESOURCE_PRICES_INDUSTRIAL;
    case ResourceType.MATERIALS:
      return RESOURCE_PRICES_MATERIALS;
    case ResourceType.TECHNOLOGY:
      return RESOURCE_PRICES_TECHNOLOGY;
    default:
      return [];
  }
}

export const getStockPriceClosestEqualOrLess = (price: number): number => {
  const index = stockGridPrices.findIndex((value) => value >= price);
  return stockGridPrices[index];
};

export const getStockPriceClosestEqualOrMore = (price: number): number => {
  const index = stockGridPrices.findIndex((value) => value > price);
  return stockGridPrices[index];
};

export const getStepsBetweenTwoNumbers = (
  start: number,
  end: number,
): number => {
  const startIndex = stockGridPrices.indexOf(start);
  const endIndex = stockGridPrices.indexOf(end);
  return Math.abs(endIndex - startIndex);
};
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
    OperatingRoundAction.VETO,
    OperatingRoundAction.EXPANSION,
    OperatingRoundAction.MARKETING_SMALL_CAMPAIGN,
    OperatingRoundAction.MARKETING,
    OperatingRoundAction.OUTSOURCE,
    OperatingRoundAction.LOAN,
    OperatingRoundAction.DOWNSIZE,
    OperatingRoundAction.SPEND_PRESTIGE,
    OperatingRoundAction.INCREASE_PRICE,
    OperatingRoundAction.DECREASE_PRICE,
    OperatingRoundAction.MERGE,
    OperatingRoundAction.RESEARCH,
    OperatingRoundAction.SHARE_BUYBACK,
    OperatingRoundAction.SHARE_ISSUE,
    OperatingRoundAction.PRODUCTION,
    OperatingRoundAction.LOBBY,
    OperatingRoundAction.LICENSING_AGREEMENT,
    OperatingRoundAction.VISIONARY,
    OperatingRoundAction.STRATEGIC_RESERVE,
    OperatingRoundAction.RAPID_EXPANSION,
    OperatingRoundAction.FASTTRACK_APPROVAL,
    OperatingRoundAction.PRICE_FREEZE,
    OperatingRoundAction.REBRAND,
    OperatingRoundAction.SURGE_PRICING,
    OperatingRoundAction.INNOVATION_SURGE,
    OperatingRoundAction.REGULATORY_SHIELD,
    OperatingRoundAction.EXTRACT,
    OperatingRoundAction.MANUFACTURE,
    OperatingRoundAction.STEADY_DEMAND,
    OperatingRoundAction.BOOM_CYCLE,
    OperatingRoundAction.CARBON_CREDIT,
  ];
  return actions.sort(
    (a, b) => actionPriority.indexOf(a) - actionPriority.indexOf(b),
  )[0];
};

export const sectorPriority = [
  SectorName.CONSUMER_DEFENSIVE,
  SectorName.HEALTHCARE,
  SectorName.MATERIALS,
  SectorName.ENERGY,
  SectorName.INDUSTRIALS,
  SectorName.CONSUMER_CYCLICAL,
  SectorName.TECHNOLOGY,
  SectorName.CONSUMER_DISCRETIONARY,
  SectorName.CONSUMER_STAPLES,
  SectorName.GENERAL,
];

export const getCompanyActionOperatingRoundTurnOrder = (
  companies: Company[],
  companyActionOrder: CompanyActionOrder[],
): Company[] => {
  return companyActionOrder
    .sort((a, b) => a.orderPriority - b.orderPriority)
    .map((companyActionOrder) =>
      companies.find((company) => company.id == companyActionOrder.companyId),
    )
    .filter((company): company is Company => company != undefined);
};

export const getNextCompanyOperatingRoundTurn = (
  companies: Company[],
  companyActionOrder: CompanyActionOrder[],
  currentCompanyId?: string,
): Company => {
  const sortedCompanies = getCompanyActionOperatingRoundTurnOrder(
    companies,
    companyActionOrder,
  );
  if (!currentCompanyId) {
    return sortedCompanies[0];
  }

  const currentIndex = sortedCompanies.findIndex(
    (company) => company.id === currentCompanyId,
  );

  // Handle the case where currentCompanyId is not found
  if (currentIndex === -1) {
    return sortedCompanies[0];
  }

  return sortedCompanies[(currentIndex + 1) % sortedCompanies.length];
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

export const GeneralCompanyActionCosts = {
  [OperatingRoundAction.LICENSING_AGREEMENT]: [150, 200, 250],
  [OperatingRoundAction.MARKETING]: [125, 175, 225],
  [OperatingRoundAction.OUTSOURCE]: [200, 250, 300],
  [OperatingRoundAction.LOBBY]: [100, 150, 200],
};

export const CompanyActionCosts = {
  [OperatingRoundAction.DOWNSIZE]: 50,
  [OperatingRoundAction.EXPANSION]: 150,
  [OperatingRoundAction.MARKETING_SMALL_CAMPAIGN]: 75,
  [OperatingRoundAction.MERGE]: 1000,
  [OperatingRoundAction.RESEARCH]: 25,
  [OperatingRoundAction.SHARE_BUYBACK]: 0,
  [OperatingRoundAction.SHARE_ISSUE]: 25,
  [OperatingRoundAction.PRODUCTION]: 0,
  [OperatingRoundAction.SPEND_PRESTIGE]: 0,
  [OperatingRoundAction.VETO]: 0,
  [OperatingRoundAction.INCREASE_PRICE]: 0,
  [OperatingRoundAction.DECREASE_PRICE]: 0,
  [OperatingRoundAction.LOAN]: 0,
  [OperatingRoundAction.VISIONARY]: 200,
  [OperatingRoundAction.STRATEGIC_RESERVE]: 200,
  [OperatingRoundAction.RAPID_EXPANSION]: 200,
  [OperatingRoundAction.FASTTRACK_APPROVAL]: 200,
  [OperatingRoundAction.PRICE_FREEZE]: 200,
  [OperatingRoundAction.REBRAND]: 200,
  [OperatingRoundAction.SURGE_PRICING]: 200,
  [OperatingRoundAction.INNOVATION_SURGE]: 0,
  [OperatingRoundAction.REGULATORY_SHIELD]: 0,
  [OperatingRoundAction.EXTRACT]: 25,
  [OperatingRoundAction.MANUFACTURE]: 25,
  [OperatingRoundAction.STEADY_DEMAND]: 0,
  [OperatingRoundAction.BOOM_CYCLE]: 0,
  [OperatingRoundAction.CARBON_CREDIT]: 0,
};

export const CompanyActionPrestigeCosts = {
  [OperatingRoundAction.DOWNSIZE]: 0,
  [OperatingRoundAction.EXPANSION]: 0,
  [OperatingRoundAction.MARKETING]: 0,
  [OperatingRoundAction.MARKETING_SMALL_CAMPAIGN]: 0,
  [OperatingRoundAction.MERGE]: 0,
  [OperatingRoundAction.RESEARCH]: 0,
  [OperatingRoundAction.SHARE_BUYBACK]: 0,
  [OperatingRoundAction.SHARE_ISSUE]: 0,
  [OperatingRoundAction.PRODUCTION]: 0,
  [OperatingRoundAction.SPEND_PRESTIGE]: 0,
  [OperatingRoundAction.VETO]: 0,
  [OperatingRoundAction.LOBBY]: 0,
  [OperatingRoundAction.INCREASE_PRICE]: 0,
  [OperatingRoundAction.DECREASE_PRICE]: 0,
  [OperatingRoundAction.OUTSOURCE]: 0,
  [OperatingRoundAction.LOAN]: 0,
  [OperatingRoundAction.LICENSING_AGREEMENT]: 0,
  //active effects
  [OperatingRoundAction.VISIONARY]: 2,
  [OperatingRoundAction.STRATEGIC_RESERVE]: 2,
  [OperatingRoundAction.RAPID_EXPANSION]: 2,
  [OperatingRoundAction.FASTTRACK_APPROVAL]: 2,
  [OperatingRoundAction.PRICE_FREEZE]: 2,
  [OperatingRoundAction.REBRAND]: 2,
  [OperatingRoundAction.SURGE_PRICING]: 2,
  //passive effects
  [OperatingRoundAction.INNOVATION_SURGE]: 0,
  [OperatingRoundAction.REGULATORY_SHIELD]: 0,
  [OperatingRoundAction.EXTRACT]: 0,
  [OperatingRoundAction.MANUFACTURE]: 0,
  [OperatingRoundAction.STEADY_DEMAND]: 0,
  [OperatingRoundAction.BOOM_CYCLE]: 0,
  [OperatingRoundAction.CARBON_CREDIT]: 0,
};

export const CompanyTierData = {
  [CompanyTier.INCUBATOR]: {
    operatingCosts: 10,
    supplyMax: 2,
    companyActions: 1,
    insolvencyShortFall: 50,
  },
  [CompanyTier.STARTUP]: {
    operatingCosts: 20,
    supplyMax: 3,
    companyActions: 1,
    insolvencyShortFall: 100,
  },
  [CompanyTier.GROWTH]: {
    operatingCosts: 40,
    supplyMax: 4,
    companyActions: 2,
    insolvencyShortFall: 150,
  },
  [CompanyTier.ESTABLISHED]: {
    operatingCosts: 50,
    supplyMax: 5,
    companyActions: 2,
    insolvencyShortFall: 200,
  },
  [CompanyTier.ENTERPRISE]: {
    operatingCosts: 70,
    supplyMax: 6,
    companyActions: 3,
    insolvencyShortFall: 250,
  },
  [CompanyTier.CONGLOMERATE]: {
    operatingCosts: 80,
    supplyMax: 8,
    companyActions: 3,
    insolvencyShortFall: 300,
  },
  [CompanyTier.TITAN]: {
    operatingCosts: 100,
    supplyMax: 10,
    companyActions: 4,
    insolvencyShortFall: 400,
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

export const MARGIN_ACCOUNT_ID_PREFIX = 'MA__';

export const CapitalGainsTiers = [
  {
    minNetWorth: 0,
    maxNetWorth: 100,
    taxPercentage: 0,
  },
  {
    minNetWorth: 100,
    maxNetWorth: 200,
    taxPercentage: 5,
  },
  {
    minNetWorth: 200,
    maxNetWorth: 300,
    taxPercentage: 6,
  },
  {
    minNetWorth: 300,
    maxNetWorth: 400,
    taxPercentage: 7,
  },
  {
    minNetWorth: 400,
    maxNetWorth: 500,
    taxPercentage: 8,
  },
  {
    minNetWorth: 500,
    maxNetWorth: Number.MAX_SAFE_INTEGER,
    taxPercentage: 10,
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
    probability: 0.07,
    cost: 3,
  },
  {
    type: PrestigeReward.MAGNET_EFFECT,
    name: 'Magnet Effect',
    description: 'All companies in the stock sector receive +1 stock price.',
    probability: 0.06,
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
    description: `The company receives the money on this space of the track. If you pass over this, all capital injections rewards receive another $${CAPITAL_INJECTION_BOOSTER}.`,
    probability: 0.12,
    cost: 2,
  },
  {
    type: PrestigeReward.BULL_SIGNAL,
    name: 'Bull Signal',
    description: 'The company receives a +1 stock price adjustment.',
    probability: 0.12,
    cost: 1,
  },
  {
    type: PrestigeReward.INFLUENCER,
    name: 'Influencer',
    description: 'The company receives +1 permanent demand.',
    probability: 0.08,
    cost: 3,
  },
];

export const StartingTier = {
  [SectorName.CONSUMER_CYCLICAL]: {
    sector: 'Consumer Cyclical',
    tier: CompanyTier.STARTUP,
  },
  [SectorName.CONSUMER_DEFENSIVE]: {
    sector: 'Consumer Defensive',
    tier: CompanyTier.STARTUP,
  },
  [SectorName.INDUSTRIALS]: {
    sector: 'Industrial',
    tier: CompanyTier.STARTUP,
  },
  [SectorName.TECHNOLOGY]: {
    sector: 'Technology',
    tier: CompanyTier.INCUBATOR,
  },
  [SectorName.HEALTHCARE]: {
    sector: 'Healthcare',
    tier: CompanyTier.GROWTH,
  },
  [SectorName.ENERGY]: {
    sector: 'Energy',
    tier: CompanyTier.INCUBATOR,
  },
  [SectorName.MATERIALS]: {
    sector: 'Materials',
    tier: CompanyTier.STARTUP,
  },
  [SectorName.CONSUMER_DISCRETIONARY]: {
    sector: 'nothing',
    tier: CompanyTier.STARTUP,
  },
  [SectorName.CONSUMER_STAPLES]: {
    sector: 'nothing',
    tier: CompanyTier.STARTUP,
  },
  [SectorName.GENERAL]: {
    sector: 'nothing',
    tier: CompanyTier.STARTUP,
  },
};

interface SectorEffects {
  active: OperatingRoundAction;
  passive: OperatingRoundAction;
}

export const SectorEffects: {
  [key: string]: SectorEffects;
} = {
  [SectorName.CONSUMER_CYCLICAL]: {
    active: OperatingRoundAction.REBRAND,
    passive: OperatingRoundAction.BOOM_CYCLE,
  },
  [SectorName.CONSUMER_DEFENSIVE]: {
    active: OperatingRoundAction.PRICE_FREEZE,
    passive: OperatingRoundAction.STEADY_DEMAND,
  },
  [SectorName.INDUSTRIALS]: {
    active: OperatingRoundAction.RAPID_EXPANSION,
    passive: OperatingRoundAction.MANUFACTURE,
  },
  [SectorName.TECHNOLOGY]: {
    active: OperatingRoundAction.VISIONARY,
    passive: OperatingRoundAction.INNOVATION_SURGE,
  },
  [SectorName.HEALTHCARE]: {
    active: OperatingRoundAction.FASTTRACK_APPROVAL,
    passive: OperatingRoundAction.REGULATORY_SHIELD,
  },
  [SectorName.ENERGY]: {
    active: OperatingRoundAction.SURGE_PRICING,
    passive: OperatingRoundAction.CARBON_CREDIT,
  },
  [SectorName.MATERIALS]: {
    active: OperatingRoundAction.STRATEGIC_RESERVE,
    passive: OperatingRoundAction.EXTRACT,
  },
  [SectorName.CONSUMER_DISCRETIONARY]: {
    active: OperatingRoundAction.REBRAND,
    passive: OperatingRoundAction.CARBON_CREDIT,
  },
  [SectorName.CONSUMER_STAPLES]: {
    active: OperatingRoundAction.PRICE_FREEZE,
    passive: OperatingRoundAction.CARBON_CREDIT,
  },
  [SectorName.GENERAL]: {
    active: OperatingRoundAction.RAPID_EXPANSION,
    passive: OperatingRoundAction.CARBON_CREDIT,
  },
};

export type PrizeType = 'passive_effect' | 'prestige';

export interface Prize {
  type: PrizeType;
  sector?: SectorName;
  prestigeAmount?: number;
}

export interface PrizePool {
  prize: Prize[];
  cash: number;
}

export type PlayerReadiness = {
  playerId: string;
  isReady: boolean;
};

export type CompanyActionType =
  | 'general'
  | 'internal'
  | 'sector'
  | 'sector-active'
  | 'sector-passive';
export interface CompanyActionDescription {
  id: number;
  title: string;
  name: OperatingRoundAction;
  message: string;
  actionType: CompanyActionType;
}

export const companyActionsDescription: CompanyActionDescription[] = [
  {
    id: 1,
    title: 'Large Marketing Campaign',
    name: OperatingRoundAction.MARKETING,
    message: `Your company receives +${LARGE_MARKETING_CAMPAIGN_DEMAND} demand that decays 1 per production phase. The sector receives an additional ${MARKETING_CONSUMER_BONUS} demand that decays 1 per production phase.`,
    actionType: 'general',
  },
  {
    id: 2,
    title: 'Small Marketing Campaign',
    name: OperatingRoundAction.MARKETING_SMALL_CAMPAIGN,
    message: `The company receives +${SMALL_MARKETING_CAMPAIGN_DEMAND} demand that decays 1 per production phase.`,
    actionType: 'internal',
  },
  {
    id: 3,
    title: 'Research',
    name: OperatingRoundAction.RESEARCH,
    message:
      'Invest in research to gain a competitive edge. Draw one card from the research deck.',
    actionType: 'internal',
  },
  {
    id: 4,
    title: 'Expansion',
    name: OperatingRoundAction.EXPANSION,
    message:
      'Increase company size (base operational costs per OR) to meet higher demand and increase supply.',
    actionType: 'internal',
  },
  {
    id: 5,
    title: 'Downsize',
    name: OperatingRoundAction.DOWNSIZE,
    message:
      'Reduce company size (base operational costs per OR) to lower operation costs and decrease supply.',
    actionType: 'internal',
  },
  {
    id: 6,
    title: 'Share Buyback',
    name: OperatingRoundAction.SHARE_BUYBACK,
    message:
      'Buy back a share from the open market. This share is taken out of rotation from the game.',
    actionType: 'internal',
  },
  {
    id: 7,
    title: 'Share Issue',
    name: OperatingRoundAction.SHARE_ISSUE,
    message: `Issue ${ACTION_ISSUE_SHARE_AMOUNT} share(s) to the open market.`,
    actionType: 'internal',
  },
  {
    id: 8,
    title: 'Increase Unit Price',
    name: OperatingRoundAction.INCREASE_PRICE,
    message: `Increase the unit price of the company's product by $${DEFAULT_INCREASE_UNIT_PRICE}. The company loses 1 demand.`,
    actionType: 'internal',
  },
  {
    id: 9,
    title: 'Decrease Unit Price',
    name: OperatingRoundAction.DECREASE_PRICE,
    message: `Decrease the unit price of the company's product by $${DEFAULT_DECREASE_UNIT_PRICE}.`,
    actionType: 'internal',
  },
  {
    id: 10,
    title: 'Spend Prestige',
    name: OperatingRoundAction.SPEND_PRESTIGE,
    message: `Purchase the current prestige track item at it's cost to receive the reward on the prestige track and move it forward by 1. If the company does not have enough prestige, move the prestige track forward by 1.`,
    actionType: 'internal',
  },
  {
    id: 11,
    title: 'Loan',
    name: OperatingRoundAction.LOAN,
    message: `Take out a loan of $${LOAN_AMOUNT} to increase cash on hand. Be careful, loans must be paid back with interest @ %${LOAN_INTEREST_RATE} per turn. This action can only be taken once per game.`,
    actionType: 'internal',
  },
  {
    id: 12,
    title: 'Lobby',
    name: OperatingRoundAction.LOBBY,
    message: `Lobby the government to force demand in your favor. Boost the sectors demand by ${LOBBY_DEMAND_BOOST}. This demand will decay 1 per stock price adjustment phase.`,
    actionType: 'general',
  },
  {
    id: 13,
    title: 'Outsource',
    name: OperatingRoundAction.OUTSOURCE,
    message: `The company outsources production.  Increase supply by ${OURSOURCE_SUPPLY_BONUS} that decays once per turn.  Lose ${OUTSOURCE_PRESTIGE_PENALTY} prestige tokens. A company may only ever have up to twice of the maximum supply it's company tier allows.`,
    actionType: 'general',
  },
  {
    id: 14,
    title: 'Licensing Agreement',
    name: OperatingRoundAction.LICENSING_AGREEMENT,
    message: `Increase the companies unit price by $${LICENSING_AGREEMENT_UNIT_PRICE_BONUS}.`,
    actionType: 'general',
  },
  {
    id: 15,
    title: 'Veto',
    name: OperatingRoundAction.VETO,
    message:
      "The company does nothing this turn. The next turn this company's operating costs are 50% less.",
    actionType: 'internal',
  },
  //sector specific actions active effects
  //technology
  {
    id: 16,
    title: 'Visionary',
    name: OperatingRoundAction.VISIONARY,
    message:
      'Draw 2 research cards and the company gains +1 demand permanently.',
    actionType: 'sector-active',
  },
  //materials
  {
    id: 17,
    title: 'Strategic Reserve',
    name: OperatingRoundAction.STRATEGIC_RESERVE,
    message: `The company has no production cost next turn and revenue is increased ${STRATEGIC_RESERVE_REVENUE_MULTIPLIER_PERCENTAGE}%.`,
    actionType: 'sector-active',
  },
  //industrial
  {
    id: 18,
    title: 'Rapid Expansion',
    name: OperatingRoundAction.RAPID_EXPANSION,
    message: 'The company expands two levels.',
    actionType: 'sector-active',
  },
  //Healthcare
  {
    id: 19,
    title: 'Fast-track Approval',
    name: OperatingRoundAction.FASTTRACK_APPROVAL,
    message: `Take up to ${FASTTRACK_APPROVAL_AMOUNT_CONSUMERS} consumers from each other sector and add them to the Healthcare sector, the company gets +${FASTTRACK_APPROVAL_AMOUNT_DEMAND} temporary demand.`,
    actionType: 'sector-active',
  },
  //consumer defensive
  {
    id: 20,
    title: 'Price Freeze',
    name: OperatingRoundAction.PRICE_FREEZE,
    message: `During the marketing action resolve round, the company stock price will move a maximum of ${PRIZE_FREEZE_AMOUNT} spaces next turn.`,
    actionType: 'sector-active',
  },
  //consumer cyclical
  {
    id: 21,
    title: 'Re-Brand',
    name: OperatingRoundAction.REBRAND,
    message:
      'The company gains +1 temporary demand, +1 permanent demand and a $40 increase in price.',
    actionType: 'sector-active',
  },
  //energy
  {
    id: 22,
    title: 'Surge Pricing',
    name: OperatingRoundAction.SURGE_PRICING,
    message: `Next turn, company revenue is increased ${SURGE_PRICING_REVENUE_MULTIPLIER_PERCENTAGE}%.`,
    actionType: 'sector-active',
  },
  //passive effect badges
  //technology
  {
    id: 23,
    title: 'Innovation Surge',
    name: OperatingRoundAction.INNOVATION_SURGE,
    message: `Should the company draw a research card, draw ${INNOVATION_SURGE_CARD_DRAW_BONUS} cards instead.`,
    actionType: 'sector-passive',
  },
  //healthcare
  {
    id: 24,
    title: 'Regulatory Shield',
    name: OperatingRoundAction.REGULATORY_SHIELD,
    message:
      'Should the company stock price decrease, it will stop at the top of the next stock price tier should it drop any further.',
    actionType: 'sector-passive',
  },
  {
    id: 25,
    title: 'Extract',
    name: OperatingRoundAction.EXTRACT,
    message:
      'Gain this action during the Company Action phase: The company gains 1 temporary supply and, if the Industrial Sector exists,  a random active insolvent Industrials sector company gains one temporary supply.',
    actionType: 'sector-passive',
  },
  {
    id: 26,
    title: 'Manufacture',
    name: OperatingRoundAction.MANUFACTURE,
    message:
      'Gain this action during the Company Action phase: The company gains 1 temporary supply and, if the Materials Sector exists, a random active insolvent Materials sector company gains one temporary supply.',
    actionType: 'sector-passive',
  },
  //consumer defensive
  {
    id: 27,
    title: 'Steady Demand',
    name: OperatingRoundAction.STEADY_DEMAND,
    message: `Should the company have remaining demand to fill but no consumers are available, sell up to ${STEADY_DEMAND_CONSUMER_BONUS} demand anyway given there is enough supply left to sell.`,
    actionType: 'sector-passive',
  },
  //consumer cyclical
  {
    id: 28,
    title: 'Boom Cycle',
    name: OperatingRoundAction.BOOM_CYCLE,
    message: `Would the companies stock price be stopped by a new price tier as it's price increases, allow it to move up at least ${BOOM_CYCLE_STOCK_CHART_BONUS} spaces further.`,
    actionType: 'sector-passive',
  },
  //energy
  {
    id: 29,
    title: 'Carbon Credit',
    name: OperatingRoundAction.CARBON_CREDIT,
    message:
      'This companies throughput can never be less than -1 or greater than 1.',
    actionType: 'sector-passive',
  },
];

export const phasesInOrder = [
  PhaseName.INFLUENCE_BID_ACTION,
  PhaseName.INFLUENCE_BID_RESOLVE,
  PhaseName.START_TURN,
  // PhaseName.HEADLINE_RESOLVE,
  PhaseName.SET_COMPANY_IPO_PRICES,
  PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES,
  PhaseName.PRIZE_VOTE_ACTION,
  PhaseName.PRIZE_VOTE_RESOLVE,
  PhaseName.PRIZE_DISTRIBUTE_ACTION,
  PhaseName.PRIZE_DISTRIBUTE_RESOLVE,
  //PhaseName.STOCK_MEET,
  PhaseName.STOCK_RESOLVE_LIMIT_ORDER,
  PhaseName.STOCK_ACTION_ORDER,
  PhaseName.STOCK_ACTION_RESULT,
  PhaseName.STOCK_ACTION_REVEAL,
  PhaseName.STOCK_RESOLVE_MARKET_ORDER,
  PhaseName.STOCK_SHORT_ORDER_INTEREST,
  PhaseName.STOCK_ACTION_SHORT_ORDER,
  PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER,
  PhaseName.STOCK_RESOLVE_OPTION_ORDER, //this is the first thing that has to happen, as it expires you will no chance to act on it that turn
  PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER,
  PhaseName.STOCK_ACTION_OPTION_ORDER, //exercise option orders, this can currently happen the turn they are opened
  PhaseName.STOCK_OPEN_LIMIT_ORDERS,
  PhaseName.STOCK_RESULTS_OVERVIEW,
  // PhaseName.OPERATING_MEET,
  // PhaseName.OPERATING_ACTION_COMPANY_VOTE,
  // PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT,
  // PhaseName.OPERATING_COMPANY_VOTE_RESOLVE,
  // PhaseName.OPERATING_PRODUCTION,
  //OPERATIONS V2 PHASES
  // PhaseName.FACTORY_CONSTRUCTION,
  // PhaseName.FACTORY_CONSTRUCTION_RESOLVE,
  // PhaseName.MARKETING_AND_RESEARCH_ACTION,
  // PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE,
  PhaseName.MODERN_OPERATIONS,
  PhaseName.RESOLVE_MODERN_OPERATIONS,
  PhaseName.RUSTED_FACTORY_UPGRADE,
  PhaseName.CONSUMPTION_PHASE,
  PhaseName.EARNINGS_CALL,
  PhaseName.OPERATING_PRODUCTION_VOTE,
  PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE,
  // PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT,
  PhaseName.CAPITAL_GAINS,
  PhaseName.DIVESTMENT,
  PhaseName.END_TURN,
];

export function getSectorValidIpoPrices(sector: Sector) {
  const sectorMinIpoPrice = sector.ipoMin;
  const sectorMaxIpoPrice = sector.ipoMax;
  return stockGridPrices.filter(
    (price) => price >= sectorMinIpoPrice && price <= sectorMaxIpoPrice,
  );
}

// Modern Operation Mechanics Constants
export const MARKETING_SLOT_COSTS = [0, 100, 200, 300, 400]; // Cost for each concurrent marketing slot
export const RESEARCH_COSTS_BY_PHASE = [100, 200, 300, 400]; // Research cost per research stage (based on sector researchMarker: Stage 1=0-5, Stage 2=6-10, Stage 3=11-15, Stage 4=16-20)
export const DEFAULT_CONSUMPTION_MARKERS_PER_SECTOR = 5;
export const FACTORY_WORKER_REQUIREMENTS = {
  FACTORY_I: 2,
  FACTORY_II: 4,
  FACTORY_III: 6,
  FACTORY_IV: 8,
};
export const FACTORY_CUSTOMER_LIMITS = {
  FACTORY_I: 3,
  FACTORY_II: 4,
  FACTORY_III: 5,
  FACTORY_IV: 6,
};
export const BASE_WORKER_SALARY = 10;
