import { MarketingCampaignTier } from '@prisma/client';

/** Matches sector research track: 0–3 stage 1, 4–6 stage 2, 7–9 stage 3, 10+ stage 4 */
export function getResearchStageFromMarker(researchMarker: number): number {
  if (researchMarker >= 10) return 4;
  if (researchMarker >= 7) return 3;
  if (researchMarker >= 4) return 2;
  return 1;
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
