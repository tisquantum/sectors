import { MarketingCampaignTier } from '@prisma/client';

/** Matches sector research track: 0–3 stage 1, 4–6 stage 2, 7–9 stage 3, 10+ stage 4 */
export function getResearchStageFromMarker(researchMarker: number): number {
  if (researchMarker >= 10) return 4;
  if (researchMarker >= 7) return 3;
  if (researchMarker >= 4) return 2;
  return 1;
}

/** Concurrent marketing slots unlocked at each sector research stage */
export const MARKETING_SLOTS_BY_STAGE = [2, 3, 4, 5];

export const MAX_MARKETING_SLOTS =
  MARKETING_SLOTS_BY_STAGE[MARKETING_SLOTS_BY_STAGE.length - 1];

export function getMarketingSlotCountForStage(stage: number): number {
  return MARKETING_SLOTS_BY_STAGE[stage - 1] ?? MARKETING_SLOTS_BY_STAGE[0];
}

export function getMarketingSlotCountForMarker(researchMarker: number): number {
  return getMarketingSlotCountForStage(
    getResearchStageFromMarker(researchMarker),
  );
}

/** Minimum sector research stage required to run this campaign tier */
export function getMinimumResearchStageForMarketingTier(
  tier: MarketingCampaignTier,
): number {
  switch (tier) {
    case MarketingCampaignTier.TIER_1:
      return 1;
    case MarketingCampaignTier.TIER_2:
      return 2;
    case MarketingCampaignTier.TIER_3:
      return 3;
    default:
      return 1;
  }
}

export function isMarketingTierUnlockedForSector(
  researchMarker: number,
  tier: MarketingCampaignTier,
): boolean {
  return (
    getResearchStageFromMarker(researchMarker) >=
    getMinimumResearchStageForMarketingTier(tier)
  );
}
