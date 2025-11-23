import {
  Company,
  DistributionStrategy,
  GameStatus,
  OrderType,
  PhaseName,
  ResearchCardEffect,
  Sector,
  ShareLocation,
} from "@server/prisma/prisma.client";
import { CompanyWithSector } from "@server/prisma/prisma.types";

type CompaniesBySector = Record<
  string,
  {
    sector: Sector;
    companies: any[];
  }
>;

export function organizeCompaniesBySector(
  companies: CompanyWithSector[]
): CompaniesBySector {
  return companies.reduce((acc, company) => {
    if (!acc[company.sectorId]) {
      acc[company.sectorId] = {
        sector: company.Sector,
        companies: [],
      };
    }
    acc[company.sectorId].companies.push(company);
    return acc;
  }, {} as Record<string, { sector: (typeof companies)[0]["Sector"]; companies: typeof companies }>);
}

export function friendlyPhaseName(name: PhaseName | undefined): string {
  if (name == undefined) {
    return "Unknown Phase";
  }
  switch (name) {
    case PhaseName.HEADLINE_RESOLVE:
      return "Resolve Headlines";
    case PhaseName.INFLUENCE_BID_ACTION:
      return "Influence Bid";
    case PhaseName.INFLUENCE_BID_REVEAL:
      return "Influence Bid Reveal";
    case PhaseName.INFLUENCE_BID_RESOLVE:
      return "Influence Bid Resolve";
    case PhaseName.SET_COMPANY_IPO_PRICES:
      return "Set IPO Prices";
    case PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES:
      return "Resolve IPO Prices";
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE:
      return "Company Vote";
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT:
      return "Company Vote Result";
    case PhaseName.OPERATING_MEET:
      return "Operating Round Meeting";
    case PhaseName.STOCK_ACTION_ORDER:
      return "Place Stock Orders";
    case PhaseName.STOCK_ACTION_RESULT:
      return "Review Concealed Orders";
    case PhaseName.STOCK_ACTION_REVEAL:
      return "Reveal Orders";
    case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
      return "Resolve Limit Orders";
    case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
      return "Resolve Market Orders";
    case PhaseName.STOCK_SHORT_ORDER_INTEREST:
      return "Charge Interest Short Orders";
    case PhaseName.STOCK_ACTION_SHORT_ORDER:
      return "Cover Short Orders";
    case PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER:
      return "Resolve Pending Short Orders";
    case PhaseName.STOCK_ACTION_OPTION_ORDER:
      return "Exercise Option Orders";
    case PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER:
      return "Resolve Pending Option Orders";
    case PhaseName.STOCK_RESOLVE_OPTION_ORDER:
      return "Resolve Expired Contracts";
    case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
      return "Open Pending Limit Orders";
    case PhaseName.STOCK_RESULTS_OVERVIEW:
      return "Stock Round Results";
    case PhaseName.STOCK_MEET:
      return "Stock Round Meeting";
    case PhaseName.OPERATING_PRODUCTION:
      return "Operating Round Production";
    case PhaseName.OPERATING_PRODUCTION_VOTE:
      return "Vote on Revenue Distribution";
    case PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE:
      return "Resolve Revenue Distribution";
    case PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT:
      return "Stock Price Adjustment";
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE:
      return "Company Vote";
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT:
      return "Company Vote Result";
    case PhaseName.OPERATING_COMPANY_VOTE_RESOLVE:
      return "Resolve Company Action";
    case PhaseName.CONSUMPTION_PHASE:
      return "Consumption Phase";
    case PhaseName.FACTORY_CONSTRUCTION:
      return "Factory Construction";
    case PhaseName.FACTORY_CONSTRUCTION_RESOLVE:
      return "Resolve Factory Construction";
    case PhaseName.MARKETING_AND_RESEARCH_ACTION:
      return "Marketing and Research";
    case PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE:
      return "Resolve Marketing and Research";
    case PhaseName.EARNINGS_CALL:
      return "Earnings Call";
    case PhaseName.CAPITAL_GAINS:
      return "Capital Gains";
    case PhaseName.DIVESTMENT:
      return "Divestment";
    case PhaseName.START_TURN:
      return "Start Turn";
    case PhaseName.END_TURN:
      return "End Turn";
    case PhaseName.PRIZE_VOTE_ACTION:
      return "Tranches Votes";
    case PhaseName.PRIZE_VOTE_RESOLVE:
      return "Resolve Tranches Votes";
    case PhaseName.PRIZE_DISTRIBUTE_ACTION:
      return "Distribute Tranches";
    case PhaseName.PRIZE_DISTRIBUTE_RESOLVE:
      return "Resolve Tranches Distribution";
    case PhaseName.MODERN_OPERATIONS:
      return "Modern Operations";
    case PhaseName.RESOLVE_MODERN_OPERATIONS:
      return "Resolve Modern Operations";
    case PhaseName.RUSTED_FACTORY_UPGRADE:
      return "Rusted Factory Upgrade";
    default:
      return "Unknown Phase";
  }
}

export const isCurrentPhaseInteractive = (
  phaseName: PhaseName | undefined
): boolean => {
  if (phaseName == undefined) {
    return false;
  }
  return (
    phaseName === PhaseName.STOCK_MEET ||
    phaseName === PhaseName.STOCK_ACTION_ORDER
  );
};

export const determineColorByOrderType = (
  orderType: OrderType,
  isSell: boolean | null
) => {
  switch (orderType) {
    case OrderType.LIMIT:
      return isSell ? "danger" : "secondary";
    case OrderType.MARKET:
      return isSell ? "danger" : "primary";
    case OrderType.SHORT:
      return "warning";
    default:
      return "default";
  }
};

export const renderGameStatusColor = (status?: GameStatus) => {
  switch (status) {
    case GameStatus.PENDING:
      return "warning";
    case GameStatus.ACTIVE:
      return "success";
    case GameStatus.FINISHED:
      return "secondary";
    default:
      return "warning";
  }
};

export const friendlyDistributionStrategyName = (
  strategy: DistributionStrategy
) => {
  switch (strategy) {
    case DistributionStrategy.FAIR_SPLIT:
      return "Fair Split";
    case DistributionStrategy.BID_PRIORITY:
      return "Bid Priority";
    case DistributionStrategy.PRIORITY:
      return "Priority";
    default:
      return "Unknown";
  }
};

export function renderLocationShortHand(location: ShareLocation) {
  switch (location) {
    case ShareLocation.DERIVATIVE_MARKET:
      return "DM";
    case ShareLocation.OPEN_MARKET:
      return "OM";
    case ShareLocation.IPO:
      return "IPO";
    case ShareLocation.PLAYER:
      return "PLAYER";
    default:
      return location;
  }
}

export function renderOrderTypeShortHand(orderType: OrderType) {
  switch (orderType) {
    case OrderType.LIMIT:
      return "LO";
    case OrderType.MARKET:
      return "MO";
    case OrderType.SHORT:
      return "SO";
    case OrderType.OPTION:
      return "OO";
    default:
      return orderType;
  }
}

export function friendlyResearchName(cardEffect: ResearchCardEffect) {
  switch (cardEffect) {
    case ResearchCardEffect.ARTIFICIAL_INTELLIGENCE:
      return "Artificial Intelligence";
    case ResearchCardEffect.AUTOMATION:
      return "Automation";
    case ResearchCardEffect.CLINICAL_TRIAL:
      return "Clinical Trial";
    case ResearchCardEffect.CORPORATE_ESPIONAGE:
      return "Corporate Espionage";
    case ResearchCardEffect.DIVERSIFICATION:
      return "Diversification";
    case ResearchCardEffect.ECOMMERCE:
      return "E-Commerce";
    case ResearchCardEffect.ECONOMIES_OF_SCALE:
      return "Economies of Scale";
    case ResearchCardEffect.ENERGY_SAVING:
      return "Energy Saving";
    case ResearchCardEffect.GLOBALIZATION:
      return "Globalization";
    case ResearchCardEffect.GOVERNMENT_GRANT:
      return "Government Grant";
    case ResearchCardEffect.INNOVATION:
      return "Innovation";
    case ResearchCardEffect.MARKET_EXPANSION:
      return "Market Expansion";
    case ResearchCardEffect.NEW_ALLOY:
      return "New Alloy";
    case ResearchCardEffect.NO_DISCERNIBLE_FINDINGS:
      return "No Discernible Findings";
    case ResearchCardEffect.PRODUCT_DEVELOPMENT:
      return "Product Development";
    case ResearchCardEffect.QUALITY_CONTROL:
      return "Quality Control";
    case ResearchCardEffect.RENEWABLE_ENERGY:
      return "Renewable Energy";
    case ResearchCardEffect.ROBOTICS:
      return "Robotics";
    case ResearchCardEffect.SPECIALIZATION:
      return "Specialization";
    default:
      return "Unknown";
  }
}

export function hashStringToColor(str: string): string {
  // Simple hash function to generate a consistent hash from a string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a hex color
  let color = "";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }

  return color;
}
