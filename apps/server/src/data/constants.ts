//make a map between PhaseName and phase times
import { PhaseName } from "@prisma/client";

export const phaseTimes = {
  [PhaseName.STOCK_MEET]: 60,
  [PhaseName.STOCK_1]: 15,
  [PhaseName.OR_1]: 15,
  [PhaseName.OR_2]: 15,
};