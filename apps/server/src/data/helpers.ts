import { PhaseName, RoundType } from '@prisma/client';

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
