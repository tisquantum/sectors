import {
  Company,
  OrderType,
  Phase,
  PhaseName,
  Prisma,
  RoundType,
  Sector,
  ShareLocation,
  StockTier,
} from '@prisma/client';
import { PlayerOrderWithCompany } from '@server/prisma/prisma.types';
import {
  StockTierChartRange,
  stockGridPrices,
  stockTierChartRanges,
} from './constants';
let stockActionCounter = 0;
/**
 * Controls the flow of the game by determining the next phase.
 * @param phaseName
 * @returns
 */
export function determineNextGamePhase(
  phaseName: PhaseName,
  allCompaniesHaveVoted?: boolean,
): {
  phaseName: PhaseName;
  roundType: RoundType;
} {
  switch (phaseName) {
    case PhaseName.STOCK_MEET:
      stockActionCounter = 0;
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
      if (stockActionCounter < 2) {
        stockActionCounter++;
        return {
          phaseName: PhaseName.STOCK_ACTION_ORDER,
          roundType: RoundType.STOCK,
        };
      } else {
        stockActionCounter = 0; // Reset counter after 3 repetitions
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
        phaseName: PhaseName.OPERATING_MEET,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.OPERATING_MEET:
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
      if (allCompaniesHaveVoted) {
        return {
          phaseName: PhaseName.CAPITAL_GAINS,
          roundType: RoundType.OPERATING,
        };
      }
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
        phaseName: PhaseName.STOCK_MEET,
        roundType: RoundType.STOCK,
      };
    default:
      return { phaseName: PhaseName.STOCK_MEET, roundType: RoundType.STOCK };
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
  const floatValue = Math.floor(
    Math.random() * (ipoMax - ipoMin + 1) + ipoMin,
  );
  // pick the number closest in the stockGridPrices array
  const closest = stockGridPrices.reduce((a, b) => {
    return Math.abs(b - floatValue) < Math.abs(a - floatValue) ? b : a;
  });
  return closest;
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

export function getCurrentTierBySharePrice(currentSharePrice: number): StockTier {
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
