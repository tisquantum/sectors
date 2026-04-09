/**
 * Shared 12-space sector research track (4 stages × 3 spaces).
 * Matches game rules in modern-operation-mechanics.service (researchMarker).
 */

export function researchCostStageFromSectorMarker(researchMarker: number): number {
  return Math.min(Math.floor(researchMarker / 3) + 1, 4);
}

export function researchTrackStageForDisplay(sectorProgress: number): number {
  return Math.min(Math.ceil(sectorProgress / 3) || 1, 4);
}

export function createSectorResearchTrackSpaces(sectorProgress: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `sector-space-${i + 1}`,
    number: i + 1,
    phase: Math.ceil((i + 1) / 3),
    isUnlocked: i < sectorProgress,
    hasReward: [3, 6, 9, 12].includes(i + 1),
    reward: [3, 6, 9, 12].includes(i + 1)
      ? {
          type: i + 1 === 12 ? ('MARKET_FAVOR' as const) : ('GRANT' as const),
          amount: i + 1 === 12 ? 2 : 1,
        }
      : undefined,
  }));
}
