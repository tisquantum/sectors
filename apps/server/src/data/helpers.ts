import {
  AwardTrackType,
  Card,
  Company,
  CompanyStatus,
  FactorySize,
  OperatingRoundAction,
  OrderType,
  Phase,
  PhaseName,
  PrestigeReward,
  Prisma,
  ResearchCardEffect,
  ResearchCardEffectType,
  RoundType,
  Sector,
  SectorName,
  SectorPriority,
  Share,
  ShareLocation,
  StockTier,
} from '@prisma/client';
import {
  CompanyOperationOrderPartial,
  CompanyWithSector,
  CompanyWithSectorPartial,
  PlayerOrderWithCompany,
  ShareWithCompany,
} from '@server/prisma/prisma.types';
import {
  AUTOMATION_EFFECT_OPERATIONS_REDUCTION,
  AWARD_TRACK_SPACES_CATALYST,
  AWARD_TRACK_SPACES_MARKETING,
  AWARD_TRACK_SPACES_RESEARCH,
  BOOM_CYCLE_STOCK_CHART_BONUS,
  CompanyActionCosts,
  DEFAULT_RESEARCH_DECK_SIZE,
  GOVERNMENT_GRANT_AMOUNT,
  GeneralCompanyActionCosts,
  PRESTIGE_TRACK_LENGTH,
  PrestigeTrack,
  PrestigeTrackItem,
  RESOURCE_PRICES_CONSUMER_CYCLICAL,
  RESOURCE_PRICES_CONSUMER_DEFENSIVE,
  RESOURCE_PRICES_CONSUMER_DISCRETIONARY,
  RESOURCE_PRICES_CONSUMER_STAPLES,
  RESOURCE_PRICES_ENERGY,
  RESOURCE_PRICES_HEALTHCARE,
  RESOURCE_PRICES_INDUSTRIAL,
  RESOURCE_PRICES_MATERIALS,
  RESOURCE_PRICES_TECHNOLOGY,
  StockTierChartRange,
  companyActionsDescription,
  getStockPriceClosestEqualOrMore,
  stockGridPrices,
  stockTierChartRanges,
} from './constants';
import {
  consumerCyclical,
  consumerDefensive,
  energy,
  healthcare,
  industrial,
  materials,
  technology,
} from './gameData';
import { get } from 'http';
interface NextPhaseOptions {
  allCompaniesHaveVoted?: boolean;
  stockActionSubRoundIsOver?: boolean;
}
/**
 * Controls the flow of the game by determining the next phase.
 * @param phaseName
 * @returns
 */
export function determineNextGamePhase(
  phaseName: PhaseName,
  options?: NextPhaseOptions,
  modernOperations: boolean = false,
): {
  phaseName: PhaseName;
  roundType: RoundType;
} {
  //Only applicable to the first turn
  if (phaseName === PhaseName.INFLUENCE_BID_ACTION) {
    return {
      phaseName: PhaseName.INFLUENCE_BID_RESOLVE,
      roundType: RoundType.INFLUENCE,
    };
  }
  if (phaseName === PhaseName.INFLUENCE_BID_RESOLVE) {
    return {
      phaseName: PhaseName.SET_COMPANY_IPO_PRICES,
      roundType: RoundType.STOCK,
    };
  }
  switch (phaseName) {
    case PhaseName.START_TURN:
      return {
        phaseName: PhaseName.SET_COMPANY_IPO_PRICES,
        roundType: RoundType.INFLUENCE,
      };
    case PhaseName.HEADLINE_RESOLVE:
      return {
        phaseName: PhaseName.SET_COMPANY_IPO_PRICES,
        roundType: RoundType.STOCK,
      };
    case PhaseName.SET_COMPANY_IPO_PRICES:
      return {
        phaseName: PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES,
        roundType: RoundType.STOCK,
      };
    case PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES:
      return {
        phaseName: PhaseName.STOCK_RESOLVE_LIMIT_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.PRIZE_VOTE_ACTION:
      return {
        phaseName: PhaseName.PRIZE_VOTE_RESOLVE,
        roundType: RoundType.INFLUENCE,
      };
    case PhaseName.PRIZE_VOTE_RESOLVE:
      return {
        phaseName: PhaseName.PRIZE_DISTRIBUTE_ACTION,
        roundType: RoundType.INFLUENCE,
      };
    case PhaseName.PRIZE_DISTRIBUTE_ACTION:
      return {
        phaseName: PhaseName.PRIZE_DISTRIBUTE_RESOLVE,
        roundType: RoundType.INFLUENCE,
      };
    case PhaseName.PRIZE_DISTRIBUTE_RESOLVE:
      return {
        phaseName: PhaseName.STOCK_RESOLVE_LIMIT_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
      return {
        phaseName: PhaseName.STOCK_ACTION_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_ACTION_ORDER:
      return {
        phaseName: PhaseName.STOCK_ACTION_RESULT,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_ACTION_RESULT:
      return {
        phaseName: PhaseName.STOCK_ACTION_REVEAL,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_ACTION_REVEAL:
      return {
        phaseName: PhaseName.STOCK_RESOLVE_MARKET_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
      if (options?.stockActionSubRoundIsOver) {
        return {
          phaseName: PhaseName.STOCK_SHORT_ORDER_INTEREST,
          roundType: RoundType.STOCK,
        };
      }
      return {
        phaseName: PhaseName.STOCK_ACTION_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_SHORT_ORDER_INTEREST:
      return {
        phaseName: PhaseName.STOCK_ACTION_SHORT_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_ACTION_SHORT_ORDER:
      return {
        phaseName: PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER:
      return {
        phaseName: PhaseName.STOCK_RESOLVE_OPTION_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_RESOLVE_OPTION_ORDER:
      return {
        phaseName: PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER:
      return {
        phaseName: PhaseName.STOCK_ACTION_OPTION_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_ACTION_OPTION_ORDER:
      return {
        phaseName: PhaseName.STOCK_OPEN_LIMIT_ORDERS,
        roundType: RoundType.STOCK,
      };
    //we do this here so that limit orders that are opened can't be closed on the first turn.
    //they effectively are the "slowest" order to place.
    case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
      return {
        phaseName: PhaseName.STOCK_RESULTS_OVERVIEW,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_RESULTS_OVERVIEW: {
      //if modern operations, move to operations production
      if (modernOperations) {
        return {
          phaseName: PhaseName.FACTORY_CONSTRUCTION,
          roundType: RoundType.OPERATING,
        };
      }
      return {
        phaseName: PhaseName.OPERATING_ACTION_COMPANY_VOTE,
        roundType: RoundType.OPERATING,
      };
    }
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE:
      return {
        phaseName: PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT:
      return {
        phaseName: PhaseName.OPERATING_COMPANY_VOTE_RESOLVE,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_COMPANY_VOTE_RESOLVE:
      return {
        phaseName: PhaseName.OPERATING_ACTION_COMPANY_VOTE,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_PRODUCTION:
      return {
        phaseName: PhaseName.OPERATING_PRODUCTION_VOTE,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_PRODUCTION_VOTE:
      return {
        phaseName: PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE:
      if (modernOperations) {
        return {
          phaseName: PhaseName.CAPITAL_GAINS,
          roundType: RoundType.OPERATING,
        };
      }
      return {
        phaseName: PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT: {
      //if modern operations, move to factory construction
      if (modernOperations) {
        throw new Error('Modern operations not implemented');
      }
      return {
        phaseName: PhaseName.CAPITAL_GAINS,
        roundType: RoundType.OPERATING,
      };
    }
    //if you are over some threshold on stocks, you must pay a tax.
    case PhaseName.CAPITAL_GAINS:
      return {
        phaseName: PhaseName.DIVESTMENT,
        roundType: RoundType.OPERATING,
      };
    //if you are over %60 in a company you must divest some of your shares.
    case PhaseName.DIVESTMENT:
      return {
        phaseName: PhaseName.END_TURN,
        roundType: RoundType.GAME_UPKEEP,
      };
    case PhaseName.END_TURN:
      return {
        phaseName: PhaseName.START_TURN,
        roundType: RoundType.GAME_UPKEEP,
      };
    // MODERN OPERATING MECHANICS PHASE FLOW
    case PhaseName.CONSUMPTION_PHASE:
      return {
        phaseName: PhaseName.EARNINGS_CALL,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.EARNINGS_CALL:
      return {
        phaseName: PhaseName.OPERATING_PRODUCTION_VOTE,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.FACTORY_CONSTRUCTION:
      return {
        phaseName: PhaseName.FACTORY_CONSTRUCTION_RESOLVE,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.FACTORY_CONSTRUCTION_RESOLVE:
      return {
        phaseName: PhaseName.MARKETING_AND_RESEARCH_ACTION,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.MARKETING_AND_RESEARCH_ACTION:
      return {
        phaseName: PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE:
      return {
        phaseName: PhaseName.CONSUMPTION_PHASE,
        roundType: RoundType.GAME_UPKEEP,
      };
    default:
      return {
        phaseName: PhaseName.START_TURN,
        roundType: RoundType.GAME_UPKEEP,
      };
  }
}

export const getPseudoSpend = (orders: PlayerOrderWithCompany[]) => {
  //filter orders by MARKET ORDER
  const marketOrders = orders.filter(
    (order) => order.orderType === OrderType.MARKET,
  );
  //get sell orders
  const sellOrders = marketOrders.filter((order) => order.isSell);
  //get buy orders
  const buyOrders = marketOrders.filter((order) => !order.isSell);

  //filter sell orders by ipo
  const sellOrdersIpo = sellOrders.filter(
    (order) => order.location == ShareLocation.IPO,
  );
  //filter buy orders by ipo
  const buyOrdersIpo = buyOrders.filter(
    (order) => order.location == ShareLocation.IPO,
  );
  //filter sell orders by open market
  const sellOrdersOpenMarket = sellOrders.filter(
    (order) => order.location == ShareLocation.OPEN_MARKET,
  );
  //filter buy orders by open market
  const buyOrdersOpenMarket = buyOrders.filter(
    (order) => order.location == ShareLocation.OPEN_MARKET,
  );

  //calculate total spend
  const totalBuyIpo = buyOrdersIpo.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0,
  );

  const totalSellIpo = sellOrdersIpo.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0,
  );

  const totalBuyOpenMarket = buyOrdersOpenMarket.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0,
  );

  const totalSellOpenMarket = sellOrdersOpenMarket.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0,
  );
  return totalBuyIpo - totalSellIpo + totalBuyOpenMarket - totalSellOpenMarket;
};

export function determineFloatPrice(sector: Sector) {
  const { ipoMin, ipoMax } = sector;
  const floatValue = Math.floor(Math.random() * (ipoMax - ipoMin + 1) + ipoMin);
  // pick the number closest in the stockGridPrices array
  const closest = stockGridPrices.reduce((a, b) => {
    return Math.abs(b - floatValue) < Math.abs(a - floatValue) ? b : a;
  });
  return closest;
}

/**
 * Calculate the steps a price will move given revenue and current price.
 * The price will jump as many steps as is divisible by the revenue and the current price.
 * Should the steps hit the next tier, the steps will stop being counted halting the price
 * at the next tier's minimum value.  Also factor in BOOM_CYCLE passive effect if it is available.
 *
 * @param revenue
 * @param currentStockPrice
 * @returns
 */
export function getStepsWithMaxBeingTheNextTierMin(
  revenue: number,
  currentStockPrice: number,
  companyHasBoomCyclePassive: boolean,
): number {
  let remainingSteps = Math.floor(revenue / currentStockPrice);

  // Get current index
  const currentIndex = stockGridPrices.indexOf(currentStockPrice);
  if (currentIndex === -1) throw new Error('Invalid current stock price');

  if (currentIndex + remainingSteps >= stockGridPrices.length) {
    return stockGridPrices.length - 1 - currentIndex;
  }

  const theoreticalNewPrice = stockGridPrices[currentIndex + remainingSteps];
  const currentTier = getCurrentTierBySharePrice(currentStockPrice);
  const nextTier = getNextTier(currentTier);

  if (theoreticalNewPrice <= getTierMaxValue(currentTier)) {
    return remainingSteps;
  }

  if (!nextTier) {
    return Math.min(remainingSteps, stockGridPrices.length - 1 - currentIndex);
  }

  const nextTierMinValue = getTierMinValue(nextTier);
  const nextGridPrice = getStockPriceClosestEqualOrMore(nextTierMinValue);
  let stoppingPointIndex = stockGridPrices.indexOf(nextGridPrice);

  if (stoppingPointIndex === -1) {
    console.error(
      'Stopping point not found:',
      stoppingPointIndex,
      nextGridPrice,
    );
    return Math.min(remainingSteps, stockGridPrices.length - 1 - currentIndex);
  }

  if (companyHasBoomCyclePassive) {
    stoppingPointIndex = Math.min(
      stoppingPointIndex + BOOM_CYCLE_STOCK_CHART_BONUS,
      stockGridPrices.length - 1,
    );
  }

  return Math.min(stoppingPointIndex - currentIndex, remainingSteps);
}

export function determineStockTier(stockPrice: number): StockTier {
  return stockTierChartRanges.find(
    (range) => stockPrice <= range.chartMaxValue,
  )!.tier;
}

export function getTierMaxValue(tier: StockTier): number {
  return stockTierChartRanges.find((range) => range.tier === tier)!
    .chartMaxValue;
}

export function getTierMinValue(tier: StockTier): number {
  return stockTierChartRanges.find((range) => range.tier === tier)!
    .chartMinValue;
}

export function getCurrentTierBySharePrice(
  currentSharePrice: number,
): StockTier {
  return stockTierChartRanges.find(
    (range) =>
      currentSharePrice >= range.chartMinValue &&
      currentSharePrice <= range.chartMaxValue,
  )!.tier;
}

/**
 * Calculates the number of steps required to fulfill a given net difference in shares,
 * updating the tier shares fulfilled, the current tier, and the new share price accordingly.
 *
 * @param netDifference - The net number of shares to be processed.
 * @param tierSharesFulfilled - The number of shares already fulfilled in the current tier.
 * @param currentTierFillSize - The total number of shares required to fill the current tier.
 * @param currentSharePrice - The current price of the share.
 * @returns An object containing:
 *          - steps: The number of steps taken to fulfill the net difference.
 *          - newTierSharesFulfilled: The updated number of shares fulfilled in the current tier.
 *          - newTier: The updated tier after processing the net difference.
 *          - newSharePrice: The new share price after processing the net difference.
 */
export function calculateStepsAndRemainder(
  netDifference: number,
  tierSharesFulfilled: number,
  currentTierFillSize: number,
  currentSharePrice: number,
): {
  steps: number;
  newTierSharesFulfilled: number;
  newTier: StockTier;
  newSharePrice: number;
} {
  Math.abs(netDifference);
  let steps = 0;
  let newTierSharesFulfilled = tierSharesFulfilled;
  let remainingShares = netDifference;
  let currentPriceIndex = stockGridPrices.indexOf(currentSharePrice);
  let currentTier = getCurrentTierBySharePrice(currentSharePrice);

  while (remainingShares > 0) {
    const sharesNeededForCurrentStep =
      currentTierFillSize - newTierSharesFulfilled;

    if (remainingShares >= sharesNeededForCurrentStep) {
      remainingShares -= sharesNeededForCurrentStep;
      steps++;
      newTierSharesFulfilled = 0;
      currentPriceIndex++;

      // Check if the new share price exceeds the current tier's max value
      if (
        currentPriceIndex < stockGridPrices.length &&
        stockGridPrices[currentPriceIndex] > getTierMaxValue(currentTier)
      ) {
        const nextTier = getNextTier(currentTier);
        if (nextTier) {
          currentTier = nextTier;
          currentTierFillSize = stockTierChartRanges.find(
            (range) => range.tier === currentTier,
          )!.fillSize;
        }
      }
    } else {
      newTierSharesFulfilled += remainingShares;
      remainingShares = 0;
    }
  }
  return {
    steps,
    newTierSharesFulfilled,
    newTier: currentTier,
    newSharePrice: stockGridPrices[currentPriceIndex],
  };
}

export function getNextTier(currentTier: StockTier): StockTier | undefined {
  const currentIndex = stockTierChartRanges.findIndex(
    (range) => range.tier === currentTier,
  );
  if (currentIndex !== -1 && currentIndex < stockTierChartRanges.length - 1) {
    return stockTierChartRanges[currentIndex + 1].tier;
  }
  return undefined;
}

//TODO: We might need to adjust this.
export function calculateMarginAccountMinimum(shortOrderValue: number): number {
  return Math.ceil(shortOrderValue / 2);
}

/**
 * Sorts an array of companies based on multiple criteria in ASCENDING order, where the lower the number, the higher the priority.
 *
 * The sorting logic is applied as follows:
 * 1. Companies with the `ECONOMIES_OF_SCALE` advantage are given the highest priority and considered the "cheapest" (sorted first).
 * 2. Companies are then sorted by their unit price in ascending order (cheapest first).
 * 3. In the case of a tie in unit price, companies are further sorted by the number of prestige tokens in descending order (most tokens first).
 * 4. Finally, if the previous criteria are still tied, companies are sorted by their demand score, calculated using `calculateDemand()`, in descending order (highest demand first).
 *
 * @param companies - An array of `CompanyOperationOrderPartial` objects to be sorted.
 * @returns The sorted array of `CompanyOperationOrderPartial` objects.
 */
export function companyPriorityOrderOperations(
  companies: CompanyOperationOrderPartial[],
) {
  // PRIORITY for production and consumption of goods
  // 0: If company has ECONOMIES_OF_SCALE, it is considered to be the cheapest company regardless of it's unit price.
  // 1. Sory companies by unit price ASC (cheapest first)
  // 2: Sort companies by prestige tokens DESC
  // 3: Sort companies by demand score DESC
  return companies.sort((a, b) => {
    if (a.hasEconomiesOfScale && !b.hasEconomiesOfScale) {
      return -1;
    } else if (a.unitPrice !== b.unitPrice) {
      return a.unitPrice - b.unitPrice;
    } else if (b.prestigeTokens !== a.prestigeTokens) {
      return b.prestigeTokens - a.prestigeTokens;
    } else {
      return (
        calculateDemand(b.demandScore, b.baseDemand) -
        calculateDemand(a.demandScore, a.baseDemand)
      );
    }
  });
}

export function getNextPrestigeReward(prestigeReward: PrestigeReward) {
  //find the next prestige reward on the prestige track
  const currentIndex = PrestigeTrack.findIndex(
    (reward) => reward.type === prestigeReward,
  );
  if (currentIndex !== -1 && currentIndex < PrestigeTrack.length - 1) {
    return PrestigeTrack[currentIndex + 1].type;
  } else {
    return PrestigeTrack[0].type;
  }
}

function lcg(seed: number): () => number {
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  let state = seed;

  return function (): number {
    state = (a * state + c) % m;
    return state / m;
  };
}

function stringToSeed(str: string): number {
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    seed = (seed << 5) - seed + str.charCodeAt(i);
    seed |= 0; // Convert to 32bit integer
  }
  return seed;
}

function createCumulativeProbabilities(items: PrestigeTrackItem[]): number[] {
  const cumulativeProbabilities = [];
  let sum = 0;

  for (const item of items) {
    sum += item.probability;
    cumulativeProbabilities.push(sum);
  }

  return cumulativeProbabilities;
}

function weightedRandom(
  rng: () => number,
  items: PrestigeTrackItem[],
  cumulative: number[],
): PrestigeTrackItem {
  const totalWeight = cumulative[cumulative.length - 1];
  const random = rng() * totalWeight;

  for (let i = 0; i < cumulative.length; i++) {
    if (Math.abs(random) < cumulative[i]) {
      return items[i];
    }
  }

  return items[items.length - 1]; // Fallback, should not reach here
}

export function createPrestigeTrackBasedOnSeed(
  seed: string,
): PrestigeTrackItem[] {
  const rng = lcg(stringToSeed(seed));
  const cumulative = createCumulativeProbabilities(PrestigeTrack);

  const track: PrestigeTrackItem[] = [];
  while (track.length < PRESTIGE_TRACK_LENGTH) {
    const item = weightedRandom(rng, PrestigeTrack, cumulative);
    track.push(item);
  }

  return track;
}

export function getNextPrestigeInt(currentPrestigeInt: number): number {
  //if prestige int is equal to 10, reset to 0
  if (currentPrestigeInt === PRESTIGE_TRACK_LENGTH - 1) {
    return 0;
  } else {
    return currentPrestigeInt + 1;
  }
}

function getSectorBasedOnEffect(effect: ResearchCardEffect): SectorName {
  switch (effect) {
    case ResearchCardEffect.CLINICAL_TRIAL:
      return SectorName.HEALTHCARE;
    case ResearchCardEffect.ARTIFICIAL_INTELLIGENCE:
      return SectorName.TECHNOLOGY;
    case ResearchCardEffect.ENERGY_SAVING:
      return SectorName.ENERGY;
    case ResearchCardEffect.GLOBALIZATION:
      return SectorName.TECHNOLOGY;
    case ResearchCardEffect.ECOMMERCE:
      return SectorName.CONSUMER_DEFENSIVE;
    case ResearchCardEffect.ROBOTICS:
      return SectorName.TECHNOLOGY;
    case ResearchCardEffect.NO_DISCERNIBLE_FINDINGS:
      return SectorName.GENERAL;
    case ResearchCardEffect.PRODUCT_DEVELOPMENT:
      return SectorName.GENERAL;
    case ResearchCardEffect.RENEWABLE_ENERGY:
      return SectorName.ENERGY;
    case ResearchCardEffect.QUALITY_CONTROL:
      return SectorName.GENERAL;
    default:
      return SectorName.GENERAL;
  }
}

export function getEffectType(
  effect: ResearchCardEffect,
): ResearchCardEffectType {
  switch (effect) {
    case ResearchCardEffect.ECONOMIES_OF_SCALE:
      return ResearchCardEffectType.ONE_TIME_USE;
    default:
      return ResearchCardEffectType.PERMANENT;
  }
}

export function createSeededResearchCards(seed: string): Card[] {
  const rng = lcg(stringToSeed(seed));
  let cards: Card[] = [];
  const effects = Object.values(ResearchCardEffect);
  const noDiscernibleFindingsCount = Math.floor(
    DEFAULT_RESEARCH_DECK_SIZE * 0.25,
  );
  const otherEffectsCount =
    DEFAULT_RESEARCH_DECK_SIZE - noDiscernibleFindingsCount;

  // Add NO_DISCERNIBLE_FINDINGS cards
  for (let i = 0; i < noDiscernibleFindingsCount; i++) {
    cards.push({
      id: i + 1,
      name: 'No Discernible Findings',
      description: 'This research yielded no discernible findings.',
      sector: getSectorBasedOnEffect(
        ResearchCardEffect.NO_DISCERNIBLE_FINDINGS,
      ), // Provide appropriate sector
      effect: ResearchCardEffect.NO_DISCERNIBLE_FINDINGS as ResearchCardEffect,
      effectType: ResearchCardEffectType.PERMANENT,
      effectUsed: false,
      deckId: 0, // Set appropriate deckId
      gameId: seed,
      companyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Add other effects cards
  for (
    let i = noDiscernibleFindingsCount;
    i < DEFAULT_RESEARCH_DECK_SIZE;
    i++
  ) {
    const effectIndex = Math.abs(Math.floor(rng() * (effects.length - 1)));
    const effect = effects[effectIndex];
    cards.push({
      id: i + 1,
      name: effect,
      description: descriptionForEffect(effect as ResearchCardEffect),
      sector: getSectorBasedOnEffect(effect), // Provide appropriate sector
      effect: effect,
      effectType: getEffectType(effect as ResearchCardEffect),
      effectUsed: false,
      deckId: 0, // Set appropriate deckId
      gameId: seed,
      companyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Shuffle the deck
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.abs(Math.floor(rng() * (i + 1)));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  //remove any cards that are undefined
  cards = cards.filter((card) => card !== undefined);
  return cards;
}

function descriptionForEffect(effect: ResearchCardEffect): string {
  switch (effect) {
    case ResearchCardEffect.CLINICAL_TRIAL:
      return 'This research has yielded a breakthrough in clinical trials. Move stock price up 1 step.';
    case ResearchCardEffect.ARTIFICIAL_INTELLIGENCE:
      return 'This research has yielded a breakthrough in artificial intelligence.  Move stock price up 1 step.';
    case ResearchCardEffect.ENERGY_SAVING:
      return 'This research has yielded a breakthrough in energy saving.  Move stock price up 1 step.';
    case ResearchCardEffect.GLOBALIZATION:
      return 'This research has yielded a breakthrough in globalization.  Move stock price up 1 step.';
    case ResearchCardEffect.ECOMMERCE:
      return 'This research has yielded a breakthrough in ecommerce.  Move stock price up 1 step.';
    case ResearchCardEffect.ROBOTICS:
      return 'This research has yielded a breakthrough in robotics.  Move stock price up 1 step.';
    case ResearchCardEffect.NEW_ALLOY:
      return 'This research has yielded a breakthrough in a new alloy.  Move stock price up 1 step.';
    case ResearchCardEffect.GOVERNMENT_GRANT:
      return `The company has received a government grant, receive ${GOVERNMENT_GRANT_AMOUNT}.`;
    case ResearchCardEffect.RENEWABLE_ENERGY:
      return 'This research has yielded a breakthrough in renewable energy.  Move stock price up 1 step.';
    case ResearchCardEffect.QUALITY_CONTROL:
      return 'The company has achieved a breakthrough in quality control. Increase the supply permanently by 1.';
    case ResearchCardEffect.PRODUCT_DEVELOPMENT:
      return 'The company has achieved a breakthrough in product development. Increase the supply permanently by 1.';
    case ResearchCardEffect.ECONOMIES_OF_SCALE:
      return "When this company operates, it is considered to be the cheapest company regardless of it's unit price.";
    case ResearchCardEffect.CORPORATE_ESPIONAGE:
      return 'Reduce all other companies prestige tokens in the sector by 2.';
    case ResearchCardEffect.AUTOMATION:
      return `This company reduces it's operating costs by ${AUTOMATION_EFFECT_OPERATIONS_REDUCTION}.`;
    case ResearchCardEffect.SPECIALIZATION:
      return 'This company has specialized in a particular area. It receives two prestige.';
    case ResearchCardEffect.NO_DISCERNIBLE_FINDINGS:
      return 'This research yielded no discernible findings.';
    default:
      return 'This research yielded no discernible findings.';
  }
}

export function calculateCompanySupply(
  supplyBase: number,
  supplyScore: number,
  supplyTemporary: number,
) {
  return supplyBase + supplyScore + supplyTemporary;
}

export function isActivePhase(name: PhaseName) {
  switch (name) {
    case PhaseName.STOCK_ACTION_ORDER:
    case PhaseName.INFLUENCE_BID_ACTION:
    case PhaseName.OPERATING_PRODUCTION_VOTE:
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE:
      return true;
    default:
      return false;
  }
}

export function calculateNetWorth(
  cashOnHand: number,
  shares: ShareWithCompany[],
) {
  //filter out shares with companys that are bankrupt
  const activeShares = shares.filter(
    (share) => share.Company.status !== CompanyStatus.BANKRUPT,
  );
  return (
    cashOnHand +
    activeShares.reduce(
      (acc, share) => acc + (share.Company.currentStockPrice || 0),
      0,
    )
  );
}

export function getRandomCompany(sectorName: SectorName): {
  name: string;
  symbol: string;
} {
  switch (sectorName) {
    case SectorName.HEALTHCARE:
      return healthcare[Math.floor(Math.random() * healthcare.length)];
    case SectorName.TECHNOLOGY:
      return technology[Math.floor(Math.random() * technology.length)];
    case SectorName.ENERGY:
      return energy[Math.floor(Math.random() * energy.length)];
    case SectorName.CONSUMER_DEFENSIVE:
      return consumerDefensive[
        Math.floor(Math.random() * consumerDefensive.length)
      ];
    case SectorName.CONSUMER_CYCLICAL:
      return consumerCyclical[
        Math.floor(Math.random() * consumerCyclical.length)
      ];
    case SectorName.INDUSTRIALS:
      return industrial[Math.floor(Math.random() * industrial.length)];
    case SectorName.MATERIALS:
      return materials[Math.floor(Math.random() * materials.length)];
    default:
      return {
        name: 'Generic Company',
        symbol: 'GEN',
      };
  }
}

export function calculateDemand(demandScore: number, baseDemand: number) {
  return demandScore + baseDemand;
}

export function calculateCertLimitForPlayerCount(playerCount: number): number {
  // Define the extremes
  const minPlayerCount = 2;
  const maxPlayerCount = 20;
  const maxCertLimit = 20;
  const minCertLimit = 6;

  // Ensure the player count is within the defined range
  if (playerCount < minPlayerCount) {
    return maxCertLimit;
  }
  if (playerCount > maxPlayerCount) {
    return minCertLimit;
  }

  // Calculate the cert limit using linear interpolation
  const certLimit =
    maxCertLimit -
    ((maxCertLimit - minCertLimit) / (maxPlayerCount - minPlayerCount)) *
      (playerCount - minPlayerCount);

  return Math.round(certLimit);
}

/**
 * Helper function to group an array of objects by a specific key.
 */
export function groupBy<T>(array: T[], key: keyof T) {
  return array.reduce(
    (acc, obj) => {
      const group = String(obj[key]); // Convert the key to a string
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(obj);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

export function calculateAverageStockPrice(
  companiesInSector: CompanyWithSector[],
) {
  return Math.floor(
    companiesInSector.reduce((acc, company) => {
      return acc + (company.currentStockPrice || 0);
    }, 0) / companiesInSector.length,
  );
}

export function calculateStartingCompanyCount(playerCount: number) {
  const minimumStartingCompanies = 3;
  const maximumStartingCompanies = 6;
  switch (playerCount) {
    case 1:
    case 2:
    case 3:
    case 4:
      return minimumStartingCompanies;
    case 5:
    case 6:
    case 7:
      return playerCount - 1;
    default:
      return maximumStartingCompanies;
  }
}

export function getCompanyActionCost(
  companyAction: OperatingRoundAction,
  companyStockPrice: number,
  generalCompanyActionCount?: number,
) {
  if (companyAction == OperatingRoundAction.SHARE_BUYBACK) {
    return companyStockPrice;
  }
  if (
    companyActionsDescription.find(
      (description) => description.name == companyAction,
    )?.actionType == 'general'
  ) {
    const generalCompanyActionCost =
      GeneralCompanyActionCosts[
        companyAction as keyof typeof GeneralCompanyActionCosts
      ];
    return generalCompanyActionCost[
      generalCompanyActionCount
        ? Math.min(generalCompanyActionCount, generalCompanyActionCost.length)
        : 0
    ];
  } else {
    return CompanyActionCosts[companyAction as keyof typeof CompanyActionCosts];
  }
}

/**
 * Sorts an array of sector IDs based on their priority.
 * @param sectorIds - The array of sector IDs to sort.
 * @param sectorPriorities - The array of sector priority objects.
 * @returns An array of sector IDs sorted by priority.
 */
export function sortSectorIdsByPriority(
  sectorIds: string[],
  sectorPriorities: SectorPriority[],
): string[] {
  // Create a lookup map for sector priorities
  const priorityMap = sectorPriorities.reduce<{ [key: string]: number }>(
    (map, sp) => {
      map[sp.sectorId] = sp.priority;
      return map;
    },
    {},
  );

  // Sort the sector IDs based on the priority
  return sectorIds.slice().sort((a, b) => {
    const priorityA = priorityMap[a] ?? Number.MAX_VALUE;
    const priorityB = priorityMap[b] ?? Number.MAX_VALUE;
    return priorityA - priorityB;
  });
}

export function getSpacesForAwardTrackType(awardType: AwardTrackType) {
  switch (awardType) {
    case AwardTrackType.CATALYST:
      return AWARD_TRACK_SPACES_CATALYST;
    case AwardTrackType.MARKETING:
      return AWARD_TRACK_SPACES_MARKETING;
    case AwardTrackType.RESEARCH:
      return AWARD_TRACK_SPACES_RESEARCH;
    default:
      return 0;
  }
}

export function isAtSpaceLimit(
  awardType: AwardTrackType,
  currentSpace: number,
) {
  switch (awardType) {
    case AwardTrackType.CATALYST:
      return currentSpace >= AWARD_TRACK_SPACES_CATALYST - 1;
    case AwardTrackType.MARKETING:
      return currentSpace >= AWARD_TRACK_SPACES_MARKETING - 1;
    case AwardTrackType.RESEARCH:
      return currentSpace >= AWARD_TRACK_SPACES_RESEARCH - 1;
    default:
      return false;
  }
}

export function getPassiveEffectForSector(sector: SectorName) {
  switch (sector) {
    case SectorName.HEALTHCARE:
      return OperatingRoundAction.FASTTRACK_APPROVAL;
    case SectorName.TECHNOLOGY:
      return OperatingRoundAction.INNOVATION_SURGE;
    case SectorName.ENERGY:
      return OperatingRoundAction.CARBON_CREDIT;
    case SectorName.CONSUMER_DEFENSIVE:
      return OperatingRoundAction.STEADY_DEMAND;
    case SectorName.CONSUMER_CYCLICAL:
      return OperatingRoundAction.BOOM_CYCLE;
    case SectorName.INDUSTRIALS:
      return OperatingRoundAction.MANUFACTURE;
    case SectorName.MATERIALS:
      return OperatingRoundAction.EXTRACT;
    default:
      return OperatingRoundAction.VETO;
  }
}

export function getResourcePricesForSector(sector: SectorName) {
  switch (sector) {
    case SectorName.HEALTHCARE:
      return RESOURCE_PRICES_HEALTHCARE;
    case SectorName.TECHNOLOGY:
      return RESOURCE_PRICES_TECHNOLOGY;
    case SectorName.ENERGY:
      return RESOURCE_PRICES_ENERGY;
    case SectorName.CONSUMER_DEFENSIVE:
      return RESOURCE_PRICES_CONSUMER_DEFENSIVE;
    case SectorName.CONSUMER_CYCLICAL:
      return RESOURCE_PRICES_CONSUMER_CYCLICAL;
    case SectorName.INDUSTRIALS:
      return RESOURCE_PRICES_INDUSTRIAL;
    case SectorName.MATERIALS:
      return RESOURCE_PRICES_MATERIALS;
    case SectorName.CONSUMER_DISCRETIONARY:
      return RESOURCE_PRICES_CONSUMER_DISCRETIONARY;
    case SectorName.CONSUMER_STAPLES:
      return RESOURCE_PRICES_CONSUMER_STAPLES;
    default:
      return [1];
  }
}

export function getNumberForFactorySize(factorySize: FactorySize) {
  switch (factorySize) {
    case FactorySize.FACTORY_I:
      return 1;
    case FactorySize.FACTORY_II:
      return 2;
    case FactorySize.FACTORY_III:
      return 3;
    case FactorySize.FACTORY_IV:
      return 4;
    default:
      return 0;
  }
}

export function validFactorySizeForSectorTechnologyLevel(factorySize: FactorySize, sectorTechnologyLevel: number) {
  switch (factorySize) {
    case FactorySize.FACTORY_I:
      return sectorTechnologyLevel >= 1 && sectorTechnologyLevel <= 3;
    case FactorySize.FACTORY_II:
      return sectorTechnologyLevel >= 2 && sectorTechnologyLevel <= 4;
    case FactorySize.FACTORY_III:
      return sectorTechnologyLevel >= 3;
    case FactorySize.FACTORY_IV:
      return sectorTechnologyLevel >= 4;
    default:
      return false;
  }
}