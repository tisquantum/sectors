import { FactorySize, MarketingCampaignTier } from '@prisma/client';
import { validFactorySizeForResearchStage } from '@server/data/helpers';

/** Stable per-bot play style for modern operations (derived from player id). */
export type BotModernOperationsPersonality =
  | 'BALANCED'
  | 'EXPANSIONIST'
  | 'MARKETER'
  | 'SCIENTIST'
  | 'GAMBLER'
  | 'CONSERVATIVE';

const PERSONALITIES: BotModernOperationsPersonality[] = [
  'BALANCED',
  'EXPANSIONIST',
  'MARKETER',
  'SCIENTIST',
  'GAMBLER',
  'CONSERVATIVE',
];

export interface BotModernOpsProfile {
  /** Human-readable label for logs */
  label: string;
  maxFactoryAttempts: number;
  /** Chance to skip the research order this phase (0 = always try if affordable). */
  researchSkipProbability: number;
  /** When cash is “tight”, chance to skip marketing and keep building. */
  marketingSkipProbWhenTight: number;
  /** When cash is comfortable, small chance to skip marketing anyway. */
  marketingSkipProbWhenLoose: number;
  /** Tight if cash < researchCost * mult + flat (encourages skipping ads to fund plants). */
  marketingTightResearchMult: number;
  marketingTightFlat: number;
  /** Relative weights for [TIER_1, TIER_2, TIER_3] when choosing marketing. */
  marketingTierWeights: readonly [number, number, number];
}

export const BOT_MODERN_OPS_PROFILES: Record<
  BotModernOperationsPersonality,
  BotModernOpsProfile
> = {
  BALANCED: {
    label: 'Balanced',
    maxFactoryAttempts: 2,
    researchSkipProbability: 0.06,
    marketingSkipProbWhenTight: 0.42,
    marketingSkipProbWhenLoose: 0.08,
    marketingTightResearchMult: 2.2,
    marketingTightFlat: 180,
    marketingTierWeights: [0.38, 0.37, 0.25],
  },
  EXPANSIONIST: {
    label: 'Expansionist',
    maxFactoryAttempts: 3,
    researchSkipProbability: 0.1,
    marketingSkipProbWhenTight: 0.62,
    marketingSkipProbWhenLoose: 0.18,
    marketingTightResearchMult: 1.8,
    marketingTightFlat: 220,
    marketingTierWeights: [0.52, 0.32, 0.16],
  },
  MARKETER: {
    label: 'Marketer',
    maxFactoryAttempts: 1,
    researchSkipProbability: 0.22,
    marketingSkipProbWhenTight: 0.14,
    marketingSkipProbWhenLoose: 0.04,
    marketingTightResearchMult: 1.2,
    marketingTightFlat: 80,
    marketingTierWeights: [0.12, 0.38, 0.5],
  },
  SCIENTIST: {
    label: 'Scientist',
    maxFactoryAttempts: 1,
    researchSkipProbability: 0,
    marketingSkipProbWhenTight: 0.48,
    marketingSkipProbWhenLoose: 0.12,
    marketingTightResearchMult: 2.8,
    marketingTightFlat: 200,
    marketingTierWeights: [0.42, 0.38, 0.2],
  },
  GAMBLER: {
    label: 'Gambler',
    maxFactoryAttempts: 2,
    researchSkipProbability: 0.18,
    marketingSkipProbWhenTight: 0.35,
    marketingSkipProbWhenLoose: 0.22,
    marketingTightResearchMult: 2,
    marketingTightFlat: 140,
    marketingTierWeights: [0.34, 0.33, 0.33],
  },
  CONSERVATIVE: {
    label: 'Conservative',
    maxFactoryAttempts: 1,
    researchSkipProbability: 0.14,
    marketingSkipProbWhenTight: 0.78,
    marketingSkipProbWhenLoose: 0.2,
    marketingTightResearchMult: 3,
    marketingTightFlat: 280,
    marketingTierWeights: [0.86, 0.11, 0.03],
  },
};

function hashPlayerIdToUint(playerId: string): number {
  let h = 0;
  for (let i = 0; i < playerId.length; i++) {
    h = (Math.imul(31, h) + playerId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getBotModernOperationsPersonality(
  playerId: string,
): BotModernOperationsPersonality {
  return PERSONALITIES[hashPlayerIdToUint(playerId) % PERSONALITIES.length];
}

export function getBotModernOpsProfile(
  playerId: string,
): BotModernOpsProfile {
  const p = getBotModernOperationsPersonality(playerId);
  return BOT_MODERN_OPS_PROFILES[p];
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FACTORY_SIZE_DESC: FactorySize[] = [
  FactorySize.FACTORY_IV,
  FactorySize.FACTORY_III,
  FactorySize.FACTORY_II,
  FactorySize.FACTORY_I,
];

/**
 * Order of factory sizes to try this attempt (personality + rng).
 */
export function buildFactorySizeTryOrder(
  personality: BotModernOperationsPersonality,
  factoryResearchStage: number,
  rng: () => number,
): FactorySize[] {
  const valid = FACTORY_SIZE_DESC.filter((s) =>
    validFactorySizeForResearchStage(s, factoryResearchStage),
  );
  if (valid.length === 0) return [];

  if (personality === 'GAMBLER') {
    return shuffleArray(valid, rng);
  }

  if (
    personality === 'MARKETER' ||
    personality === 'SCIENTIST' ||
    personality === 'CONSERVATIVE'
  ) {
    return [...valid].reverse();
  }

  // BALANCED, EXPANSIONIST — usually largest-first; Balanced sometimes shuffles
  if (personality === 'BALANCED' && rng() < 0.28) {
    return shuffleArray(valid, rng);
  }

  return valid;
}

export function isMarketingCashTight(
  cashOnHand: number,
  researchCost: number,
  profile: BotModernOpsProfile,
): boolean {
  return (
    cashOnHand <
    researchCost * profile.marketingTightResearchMult + profile.marketingTightFlat
  );
}

export function shouldSkipBotMarketing(
  profile: BotModernOpsProfile,
  cashOnHand: number,
  researchCost: number,
  rng: () => number,
): boolean {
  const tight = isMarketingCashTight(cashOnHand, researchCost, profile);
  const p = tight
    ? profile.marketingSkipProbWhenTight
    : profile.marketingSkipProbWhenLoose;
  return rng() < p;
}

const TIER_COST: Record<MarketingCampaignTier, number> = {
  [MarketingCampaignTier.TIER_1]: 50,
  [MarketingCampaignTier.TIER_2]: 100,
  [MarketingCampaignTier.TIER_3]: 200,
};

const TIER_NEED_COUNT: Record<MarketingCampaignTier, number> = {
  [MarketingCampaignTier.TIER_1]: 1,
  [MarketingCampaignTier.TIER_2]: 2,
  [MarketingCampaignTier.TIER_3]: 3,
};

/**
 * Weighted random marketing tier; downgrades until affordable.
 */
export function pickMarketingTierWeighted(
  profile: BotModernOpsProfile,
  personality: BotModernOperationsPersonality,
  cashOnHand: number,
  rng: () => number,
): MarketingCampaignTier | null {
  const [w1, w2, w3] = profile.marketingTierWeights;
  let a = w1;
  let b = w2;
  let c = w3;

  if (personality === 'GAMBLER' && rng() < 0.45) {
    a = 0.2 + rng() * 0.9;
    b = 0.2 + rng() * 0.9;
    c = 0.2 + rng() * 0.9;
  }

  const sum = a + b + c;
  let u = rng() * sum;
  let tier: MarketingCampaignTier;
  if (u < a) {
    tier = MarketingCampaignTier.TIER_1;
  } else if (u < a + b) {
    tier = MarketingCampaignTier.TIER_2;
  } else {
    tier = MarketingCampaignTier.TIER_3;
  }

  const downgrade: Partial<
    Record<MarketingCampaignTier, MarketingCampaignTier>
  > = {
    [MarketingCampaignTier.TIER_3]: MarketingCampaignTier.TIER_2,
    [MarketingCampaignTier.TIER_2]: MarketingCampaignTier.TIER_1,
  };

  while (TIER_COST[tier] > cashOnHand) {
    const next = downgrade[tier];
    if (next === undefined) {
      return null;
    }
    tier = next;
  }
  return tier;
}

export function marketingTierResourceCount(tier: MarketingCampaignTier): number {
  return TIER_NEED_COUNT[tier];
}

export function marketingTierCost(tier: MarketingCampaignTier): number {
  return TIER_COST[tier];
}
