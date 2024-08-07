import {
  Card,
  Company,
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
  Share,
  ShareLocation,
  StockTier,
} from '@prisma/client';
import {
  CompanyWithSector,
  PlayerOrderWithCompany,
  ShareWithCompany,
} from '@server/prisma/prisma.types';
import {
  AUTOMATION_EFFECT_OPERATIONS_REDUCTION,
  DEFAULT_RESEARCH_DECK_SIZE,
  GOVERNMENT_GRANT_AMOUNT,
  PRESTIGE_TRACK_LENGTH,
  PrestigeTrack,
  PrestigeTrackItem,
  STOCK_ACTION_SUB_ROUND_MAX,
  StockTierChartRange,
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
interface NextPhaseOptions {
  allCompaniesHaveVoted?: boolean;
  stockActionSubRound?: number;
}
/**
 * Controls the flow of the game by determining the next phase.
 * @param phaseName
 * @returns
 */
export function determineNextGamePhase(
  phaseName: PhaseName,
  options?: NextPhaseOptions,
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
      phaseName: PhaseName.STOCK_RESOLVE_LIMIT_ORDER,
      roundType: RoundType.STOCK,
    };
  }
  switch (phaseName) {
    case PhaseName.START_TURN:
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
      if ((options?.stockActionSubRound || 0) <= STOCK_ACTION_SUB_ROUND_MAX) {
        return {
          phaseName: PhaseName.STOCK_ACTION_ORDER,
          roundType: RoundType.STOCK,
        };
      } else {
        return {
          phaseName: PhaseName.STOCK_ACTION_REVEAL,
          roundType: RoundType.STOCK,
        };
      }
    case PhaseName.STOCK_ACTION_REVEAL:
      return {
        phaseName: PhaseName.STOCK_RESOLVE_MARKET_ORDER,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
      return {
        phaseName: PhaseName.STOCK_SHORT_ORDER_INTEREST,
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
    case PhaseName.STOCK_RESULTS_OVERVIEW:
      return {
        phaseName: PhaseName.OPERATING_PRODUCTION,
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
      return {
        phaseName: PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT:
      return {
        phaseName: PhaseName.OPERATING_ACTION_COMPANY_VOTE,
        roundType: RoundType.OPERATING,
      };
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
  console.log('totalBuyIpo', totalBuyIpo);
  console.log('totalSellIpo', totalSellIpo);
  console.log('totalBuyOpenMarket', totalBuyOpenMarket);
  console.log('totalSellOpenMarket', totalSellOpenMarket);
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

export function calculateStepsToNewTier(
  currentStockPrice: number,
  revenue: number,
): number {
  let remainingSteps = Math.floor(revenue / currentStockPrice);
  let newStockPrice = currentStockPrice;
  let totalSteps = 0;

  while (remainingSteps > 0) {
    const currentTier = getCurrentTierBySharePrice(newStockPrice);
    const tierMaxValue = getTierMaxValue(currentTier);

    const stepsToTierMax = stockGridPrices.indexOf(tierMaxValue) - stockGridPrices.indexOf(newStockPrice);

    if (remainingSteps <= stepsToTierMax) {
      totalSteps += remainingSteps;
      remainingSteps = 0;
    } else {
      totalSteps += stepsToTierMax + 1;
      newStockPrice = tierMaxValue;
      remainingSteps -= stepsToTierMax + 1;
    }
  }

  return totalSteps;
}

export function determineStockTier(stockPrice: number): StockTier {
  return stockTierChartRanges.find(
    (range) => stockPrice <= range.chartMaxValue,
  )!.tier;
}

function getTierMaxValue(tier: StockTier): number {
  return stockTierChartRanges.find((range) => range.tier === tier)!
    .chartMaxValue;
}

export function getCurrentTierBySharePrice(
  currentSharePrice: number,
): StockTier {
  return stockTierChartRanges.find(
    (range) => currentSharePrice <= range.chartMaxValue,
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

export function companyPriorityOrderOperations(companies: CompanyWithSector[]) {
  // PRIORITY for production and consumption of goods
  // 0: If company has ECONOMIES_OF_SCALE, it is considered to be the cheapest company regardless of it's unit price.
  // 1: Sort companies by prestige tokens DESC
  // 2. Sory companies by unit price ASC (cheapest first)
  // 3: Sort companies by demand score DESC
  return companies.sort((a, b) => {
    if (a.hasEconomiesOfScale && !b.hasEconomiesOfScale) {
      return -1;
    } else if (b.prestigeTokens !== a.prestigeTokens) {
      return b.prestigeTokens - a.prestigeTokens;
    } else if (a.unitPrice !== b.unitPrice) {
      return a.unitPrice - b.unitPrice;
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
    console.log('effect', effect, effectIndex);
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
  console.log('cards', cards);
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
) {
  return supplyBase + supplyScore;
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
  return (
    cashOnHand +
    shares.reduce((acc, share) => acc + share.Company.currentStockPrice, 0)
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
