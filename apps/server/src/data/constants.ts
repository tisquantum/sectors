//make a map between PhaseName and phase times
import { PhaseName } from '@prisma/client';

export const phaseTimes = {
  [PhaseName.STOCK_MEET]: 60 * 1000,
  [PhaseName.STOCK_1]: 15 * 1000,
  [PhaseName.STOCK_2]: 15 * 1000,
  [PhaseName.STOCK_3]: 15 * 1000,
  [PhaseName.STOCK_4]: 15 * 1000,
  [PhaseName.STOCK_5]: 15 * 1000,
  [PhaseName.OR_1]: 15 * 1000,
  [PhaseName.OR_2]: 15 * 1000,
  [PhaseName.OR_3]: 15 * 1000,
  [PhaseName.OR_MEET_1]: 15 * 1000,
  [PhaseName.OR_MEET_2]: 15 * 1000,
  [PhaseName.OR_MEET_3]: 15 * 1000,
};
