import { PhaseName, RoundType } from '@prisma/client';

export function determineNextGamePhase(phaseName: PhaseName): {
  phaseName: PhaseName;
  roundType: RoundType;
} {
  switch (phaseName) {
    case PhaseName.STOCK_MEET:
      return { phaseName: PhaseName.STOCK_1, roundType: RoundType.STOCK };
    case PhaseName.STOCK_1:
      return { phaseName: PhaseName.STOCK_2, roundType: RoundType.STOCK };
    case PhaseName.STOCK_2:
      return { phaseName: PhaseName.STOCK_3, roundType: RoundType.STOCK };
    case PhaseName.STOCK_3:
      return { phaseName: PhaseName.OR_MEET_1, roundType: RoundType.OPERATING };
    case PhaseName.OR_MEET_1:
      return { phaseName: PhaseName.OR_1, roundType: RoundType.OPERATING };
    default:
      return { phaseName: PhaseName.STOCK_MEET, roundType: RoundType.STOCK };
  }
}
