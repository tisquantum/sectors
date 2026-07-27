import { FactorySize, MarketingCampaignTier } from "@server/prisma/prisma.client";
import {
  getMarketingSlotCountForStage,
  getResearchStageFromMarker,
} from "@server/data/marketing-unlock";

export { getResearchStageFromMarker };

/** The size range a single factory slot accepts at the sector's current stage. */
export interface FactorySlotPhase {
  min: FactorySize;
  max: FactorySize;
}

const SLOT_PLAN_STAGE_1: FactorySlotPhase[] = [
  { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
  { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
  { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
];

/**
 * How many factory slots a company has and what each accepts, by the sector's
 * research stage. Research both opens slots and raises what they can hold.
 */
export function getFactorySlotPlan(stage: number): FactorySlotPhase[] {
  switch (stage) {
    case 2:
      return [
        { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
        { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
        { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
      ];
    case 3:
      return [
        { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
        { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
        { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_III },
        { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
      ];
    case 4:
      return [
        { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
        { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_IV },
        { min: FactorySize.FACTORY_IV, max: FactorySize.FACTORY_IV },
      ];
    default:
      return SLOT_PLAN_STAGE_1;
  }
}

/** "I" for a fixed slot, "I/II" for one that accepts a range. */
export function factorySlotLabel(phase: FactorySlotPhase): string {
  const min = phase.min.replace("FACTORY_", "");
  const max = phase.max.replace("FACTORY_", "");
  return min === max ? min : `${min}/${max}`;
}

/** Every size a slot will accept, smallest first. */
export function factorySizesForSlot(phase: FactorySlotPhase): FactorySize[] {
  const order = [
    FactorySize.FACTORY_I,
    FactorySize.FACTORY_II,
    FactorySize.FACTORY_III,
    FactorySize.FACTORY_IV,
  ];
  const from = order.indexOf(phase.min);
  const to = order.indexOf(phase.max);
  return order.slice(from, to + 1);
}

/** Concurrent marketing campaigns a company may run at each research stage. */
export const getMarketingSlotCount = getMarketingSlotCountForStage;

export const MARKETING_TIERS = [
  MarketingCampaignTier.TIER_1,
  MarketingCampaignTier.TIER_2,
  MarketingCampaignTier.TIER_3,
] as const;

/** Cost, workers and effects of a campaign tier, mirroring MarketingService. */
export const MARKETING_TIER_CONFIG: Record<
  MarketingCampaignTier,
  {
    label: string;
    cost: number;
    workers: number;
    brandBonus: number;
    demandBonus: number;
    resources: number;
  }
> = {
  [MarketingCampaignTier.TIER_1]: {
    label: "I",
    cost: 50,
    workers: 1,
    brandBonus: 1,
    demandBonus: 1,
    resources: 1,
  },
  [MarketingCampaignTier.TIER_2]: {
    label: "II",
    cost: 100,
    workers: 2,
    brandBonus: 2,
    demandBonus: 1,
    resources: 2,
  },
  [MarketingCampaignTier.TIER_3]: {
    label: "III",
    cost: 200,
    workers: 3,
    brandBonus: 3,
    demandBonus: 2,
    resources: 3,
  },
};
