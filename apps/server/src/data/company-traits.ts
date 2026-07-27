import { CompanyTraitType, FactorySize, ResourceType } from '@prisma/client';
import { GLOBAL_RESOURCE_TYPES } from './constants';
import { getNumberForFactorySize } from './helpers';

/**
 * Company traits (MODERN operations only).
 *
 * Every company is rolled exactly one trait at creation, scoped to one of the three
 * global materials. Blueprints are free-form — factory size caps how many distinct
 * materials you may use, never which ones — so a trait does not gate on anything. It
 * biases which material is worth one of your scarce blueprint slots, and the three
 * price tracks behave very differently, so the same trait plays out differently
 * depending on the material it landed on.
 *
 * All traits are pure upside; company quality is meant to vary, and the randomly
 * assigned IPO price is what players weigh it against.
 */

/**
 * Materials a trait can attach to: the global ones, which any company may freely put in
 * a blueprint. Sector resources are excluded because every factory in a sector already
 * carries its sector resource, so a trait scoped to it would cost nothing to trigger.
 */
export const TRAIT_RESOURCES: ResourceType[] = GLOBAL_RESOURCE_TYPES;

/** Multiplier applied to the trait material's price when costing a factory build or upgrade. */
export const SUPPLY_CONTRACT_COST_MULTIPLIER = 0.5;

/** Multiplier applied to the trait material's price when computing revenue per customer. */
export const PREMIUM_LINE_REVENUE_MULTIPLIER = 2;

/** Extra customers a HIGH_CAPACITY factory can serve. */
export const HIGH_CAPACITY_BONUS_CUSTOMERS = 1;

/** Workers saved per factory by EFFICIENT_TOOLING. A factory always needs at least one. */
export const EFFICIENT_TOOLING_WORKER_REDUCTION = 1;

/** Extra consumption markers a SIGNATURE_PRODUCT campaign places for the trait material. */
export const SIGNATURE_PRODUCT_BONUS_MARKERS = 1;

export interface CompanyTraitDefinition {
  type: CompanyTraitType;
  label: string;
  /** Short description with the material name substituted in. */
  describe: (resource: ResourceType) => string;
}

export const COMPANY_TRAIT_DEFINITIONS: Record<
  CompanyTraitType,
  CompanyTraitDefinition
> = {
  [CompanyTraitType.SUPPLY_CONTRACT]: {
    type: CompanyTraitType.SUPPLY_CONTRACT,
    label: 'Supply Contract',
    describe: (resource) =>
      `Pays half price for ${resource} when building or upgrading factories.`,
  },
  [CompanyTraitType.PREMIUM_LINE]: {
    type: CompanyTraitType.PREMIUM_LINE,
    label: 'Premium Line',
    describe: (resource) =>
      `${resource} counts double toward revenue for every customer served.`,
  },
  [CompanyTraitType.MARKET_DARLING]: {
    type: CompanyTraitType.MARKET_DARLING,
    label: 'Market Darling',
    describe: (resource) =>
      `Consumers ignore the price of ${resource}, so factories using it attract more customers without earning less.`,
  },
  [CompanyTraitType.HIGH_CAPACITY]: {
    type: CompanyTraitType.HIGH_CAPACITY,
    label: 'High Capacity',
    describe: (resource) =>
      `Factories using ${resource} serve one extra customer.`,
  },
  [CompanyTraitType.EFFICIENT_TOOLING]: {
    type: CompanyTraitType.EFFICIENT_TOOLING,
    label: 'Efficient Tooling',
    describe: (resource) =>
      `Factories using ${resource} are built with one fewer worker.`,
  },
  [CompanyTraitType.SIGNATURE_PRODUCT]: {
    type: CompanyTraitType.SIGNATURE_PRODUCT,
    label: 'Signature Product',
    describe: (resource) =>
      `Marketing campaigns that select ${resource} place an extra consumption marker.`,
  },
};

const TRAIT_TYPES = Object.keys(
  COMPANY_TRAIT_DEFINITIONS,
) as CompanyTraitType[];

export interface RolledCompanyTrait {
  traitType: CompanyTraitType;
  traitResource: ResourceType;
}

/** Rolls a uniformly random trait/material pairing for a newly created company. */
export function rollCompanyTrait(): RolledCompanyTrait {
  return {
    traitType: TRAIT_TYPES[Math.floor(Math.random() * TRAIT_TYPES.length)],
    traitResource:
      TRAIT_RESOURCES[Math.floor(Math.random() * TRAIT_RESOURCES.length)],
  };
}

/** Minimal shape needed to evaluate a trait; satisfied by any Company row. */
export interface TraitBearer {
  traitType?: CompanyTraitType | null;
  traitResource?: ResourceType | null;
}

/**
 * Returns the material a company's trait applies to, or null when the trait is absent
 * or is not the one being asked about.
 */
export function getTraitResource(
  company: TraitBearer | null | undefined,
  traitType: CompanyTraitType,
): ResourceType | null {
  if (!company?.traitType || !company.traitResource) {
    return null;
  }
  return company.traitType === traitType ? company.traitResource : null;
}

/** True when the company has the given trait and the blueprint uses its material. */
export function blueprintTriggersTrait(
  company: TraitBearer | null | undefined,
  traitType: CompanyTraitType,
  resourceTypes: ResourceType[] | string[],
): boolean {
  const traitResource = getTraitResource(company, traitType);
  if (!traitResource) {
    return false;
  }
  return (resourceTypes as string[]).includes(traitResource);
}

/** Flat fee charged for a fresh factory plot. Upgrades to an existing plot do not pay it. */
export const PLOT_FEE_FRESH = 100;

export type ResourcePriceLookup =
  | ReadonlyMap<ResourceType, number>
  | ReadonlyMap<string, number>;

/**
 * Sum of current market prices for a blueprint, one of each resource type. A
 * SUPPLY_CONTRACT company pays a reduced rate for its trait material.
 */
export function calculateBlueprintPrice(
  resourceTypes: ResourceType[] | string[],
  resourcePrices: ResourcePriceLookup,
  company: TraitBearer | null | undefined,
): number {
  const discounted = getTraitResource(company, CompanyTraitType.SUPPLY_CONTRACT);
  let total = 0;
  for (const resourceType of resourceTypes) {
    const price = (resourcePrices as ReadonlyMap<string, number>).get(
      resourceType as string,
    );
    if (!price) {
      continue;
    }
    total +=
      resourceType === discounted
        ? price * SUPPLY_CONTRACT_COST_MULTIPLIER
        : price;
  }
  return total;
}

/**
 * Cost to build a factory on a fresh plot: blueprint price × factory size, plus the plot fee.
 */
export function calculateFactoryConstructionCost(
  size: FactorySize,
  resourceTypes: ResourceType[] | string[],
  resourcePrices: ResourcePriceLookup,
  company: TraitBearer | null | undefined,
): number {
  const blueprintPrice = calculateBlueprintPrice(
    resourceTypes,
    resourcePrices,
    company,
  );
  return (
    Math.ceil(blueprintPrice * getNumberForFactorySize(size)) + PLOT_FEE_FRESH
  );
}

/**
 * Cost to upgrade a rusted factory to a larger size. Same blueprint math as construction
 * but without the plot fee, since the plot is already owned.
 */
export function calculateFactoryUpgradeCost(
  size: FactorySize,
  resourceTypes: ResourceType[] | string[],
  resourcePrices: ResourcePriceLookup,
  company: TraitBearer | null | undefined,
): number {
  const blueprintPrice = calculateBlueprintPrice(
    resourceTypes,
    resourcePrices,
    company,
  );
  return Math.ceil(blueprintPrice * getNumberForFactorySize(size));
}

export function describeCompanyTrait(
  company: TraitBearer | null | undefined,
): string | null {
  if (!company?.traitType || !company.traitResource) {
    return null;
  }
  return COMPANY_TRAIT_DEFINITIONS[company.traitType].describe(
    company.traitResource,
  );
}
