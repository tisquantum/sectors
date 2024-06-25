import { OrderType, PhaseName, RoundType, Sector, ShareLocation, StockTier } from '@prisma/client';
import { PlayerOrderWithCompany } from '@server/prisma/prisma.types';
import { StockTierChartRange, stockGridPrices, stockTierChartRanges } from './constants';

/**
 * Controls the flow of the game by determining the next phase.
 * @param phaseName 
 * @returns 
 */
export function determineNextGamePhase(phaseName: PhaseName): {
  phaseName: PhaseName;
  roundType: RoundType;
} {
  switch (phaseName) {
    case PhaseName.STOCK_MEET:
      return { phaseName: PhaseName.STOCK_1, roundType: RoundType.STOCK };
    case PhaseName.STOCK_1:
      return {
        phaseName: PhaseName.STOCK_1_RESULT,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_1_RESULT:
      return { phaseName: PhaseName.STOCK_2, roundType: RoundType.STOCK };
    case PhaseName.STOCK_2:
      return {
        phaseName: PhaseName.STOCK_2_RESULT,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_2_RESULT:
      return { phaseName: PhaseName.STOCK_3, roundType: RoundType.STOCK };
    case PhaseName.STOCK_3:
      return {
        phaseName: PhaseName.STOCK_3_RESULT,
        roundType: RoundType.STOCK,
      };
    case PhaseName.STOCK_3_RESULT:
      return {
        phaseName: PhaseName.STOCK_REVEAL,
        roundType: RoundType.OPERATING,
      };
    case PhaseName.STOCK_REVEAL:
      return { phaseName: PhaseName.STOCK_RESOLVE, roundType: RoundType.STOCK };
    case PhaseName.STOCK_RESOLVE:
      return { phaseName: PhaseName.OR_MEET_1, roundType: RoundType.OPERATING };
    case PhaseName.OR_MEET_1:
      return { phaseName: PhaseName.OR_1, roundType: RoundType.OPERATING };
    default:
      return { phaseName: PhaseName.STOCK_MEET, roundType: RoundType.STOCK };
  }
}

export function isStockRoundAction(phaseName: PhaseName | undefined): boolean {
  if (!phaseName) return false;
  return (
    phaseName === PhaseName.STOCK_1 ||
    phaseName === PhaseName.STOCK_2 ||
    phaseName === PhaseName.STOCK_3 ||
    phaseName === PhaseName.STOCK_4 ||
    phaseName === PhaseName.STOCK_5
  );
}

export function isStockRoundResult(phaseName: PhaseName | undefined): boolean {
  if (!phaseName) return false;
  return (
    phaseName === PhaseName.STOCK_1_RESULT ||
    phaseName === PhaseName.STOCK_2_RESULT ||
    phaseName === PhaseName.STOCK_3_RESULT ||
    phaseName === PhaseName.STOCK_4_RESULT ||
    phaseName === PhaseName.STOCK_5_RESULT
  );
}


export const getPseudoSpend = (orders: PlayerOrderWithCompany[]) => {
  //filter orders by MARKET ORDER
  const marketOrders = orders.filter(
    (order) => order.orderType === OrderType.MARKET
  );
  //get sell orders
  const sellOrders = marketOrders.filter((order) => order.isSell);
  //get buy orders
  const buyOrders = marketOrders.filter((order) => !order.isSell);

  //filter sell orders by ipo
  const sellOrdersIpo = sellOrders.filter(
    (order) => order.location == ShareLocation.IPO
  );
  //filter buy orders by ipo
  const buyOrdersIpo = buyOrders.filter(
    (order) => order.location == ShareLocation.IPO
  );
  //filter sell orders by open market
  const sellOrdersOpenMarket = sellOrders.filter(
    (order) => order.location == ShareLocation.OPEN_MARKET
  );
  //filter buy orders by open market
  const buyOrdersOpenMarket = buyOrders.filter(
    (order) => order.location == ShareLocation.OPEN_MARKET
  );

  //calculate total spend
  const totalBuyIpo = buyOrdersIpo.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0
  );

  const totalSellIpo = sellOrdersIpo.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0
  );

  const totalBuyOpenMarket = buyOrdersOpenMarket.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0
  );

  const totalSellOpenMarket = sellOrdersOpenMarket.reduce(
    (acc, order) =>
      acc + (order.quantity ?? 0) * (order.Company.currentStockPrice ?? 0),
    0
  );
  console.log('totalBuyIpo', totalBuyIpo);
  console.log('totalSellIpo', totalSellIpo);
  console.log('totalBuyOpenMarket', totalBuyOpenMarket);
  console.log('totalSellOpenMarket', totalSellOpenMarket);
  return (
    totalBuyIpo - totalSellIpo + totalBuyOpenMarket - totalSellOpenMarket
  );
};

export function determineFloatPrice(sector: Sector) {
  const { floatNumberMin, floatNumberMax} = sector;
  const floatValue = Math.floor(Math.random() * (floatNumberMax - floatNumberMin + 1) + floatNumberMin);
  // pick the number closest in the stockGridPrices array
  const closest = stockGridPrices.reduce((a, b) => {
    return Math.abs(b - floatValue) < Math.abs(a - floatValue) ? b : a;
  });
  return closest;
}

function getTierMaxValue(tier: StockTier): number {
  return stockTierChartRanges.find(range => range.tier === tier)!.chartMaxValue;
}

function getCurrentTierBySharePrice(currentSharePrice: number): StockTier {
  return stockTierChartRanges.find(range => currentSharePrice <= range.chartMaxValue)!.tier;
}

export function calculateStepsAndRemainder(
  netDifference: number,
  tierSharesFulfilled: number,
  currentTierFillSize: number,
  currentSharePrice: number
): { steps: number; newTierSharesFulfilled: number; newTier: StockTier; newSharePrice: number } {
  let steps = 0;
  let newTierSharesFulfilled = tierSharesFulfilled;
  let remainingShares = netDifference;
  let currentPriceIndex = stockGridPrices.indexOf(currentSharePrice);
  let currentTier = getCurrentTierBySharePrice(currentSharePrice);

  while (remainingShares > 0) {
    const sharesNeededForCurrentStep = currentTierFillSize - newTierSharesFulfilled;

    if (remainingShares >= sharesNeededForCurrentStep) {
      remainingShares -= sharesNeededForCurrentStep;
      steps++;
      newTierSharesFulfilled = 0;
      currentPriceIndex++;

      // Check if the new share price exceeds the current tier's max value
      if (currentPriceIndex < stockGridPrices.length && stockGridPrices[currentPriceIndex] > getTierMaxValue(currentTier)) {
        const nextTier = getNextTier(currentTier);
        if (nextTier) {
          currentTier = nextTier;
          currentTierFillSize = stockTierChartRanges.find(
            (range) => range.tier === currentTier
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
    newSharePrice: stockGridPrices[currentPriceIndex]
  };
}

export function getNextTier(currentTier: StockTier): StockTier | undefined {
  const currentIndex = stockTierChartRanges.findIndex(
    range => range.tier === currentTier
  );
  if (currentIndex !== -1 && currentIndex < stockTierChartRanges.length - 1) {
    return stockTierChartRanges[currentIndex + 1].tier;
  }
  return undefined;
}