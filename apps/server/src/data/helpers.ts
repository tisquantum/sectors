import { OrderType, PhaseName, RoundType, Sector, ShareLocation } from '@prisma/client';
import { PlayerOrderWithCompany } from '@server/prisma/prisma.types';
import { stockGridPrices } from './constants';

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