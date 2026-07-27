import { PhaseName } from "@server/prisma/prisma.client";

/**
 * Regions of the single-screen board. The current phase decides which regions
 * matter right now; everything else stays legible but visually recedes.
 */
export type BoardRegion =
  | "players"
  | "workforce"
  | "stocks"
  | "resources"
  | "research"
  | "companies";

export interface BoardFocus {
  /** Regions the player should be looking at, brightest first. */
  regions: BoardRegion[];
  /** Imperative one-liner describing what to do, shown in the action dock. */
  prompt: string;
  /** True when the phase expects direct input from the player. */
  isActionable: boolean;
  /**
   * True when the input happens on the board itself (pressing a company tile,
   * for instance) rather than in the phase panel, so the panel stays shut.
   */
  actsOnBoard?: boolean;
}

const NOTHING: BoardFocus = {
  regions: [],
  prompt: "Watching the board.",
  isActionable: false,
};

const FOCUS_BY_PHASE: Partial<Record<PhaseName, BoardFocus>> = {
  [PhaseName.START_TURN]: {
    regions: ["players"],
    prompt: "Review standings before the turn begins.",
    isActionable: false,
  },
  [PhaseName.END_TURN]: {
    regions: ["workforce", "resources", "players"],
    prompt: "The economy settles up for the turn.",
    isActionable: false,
  },
  [PhaseName.HEADLINE_RESOLVE]: {
    regions: ["companies"],
    prompt: "Headlines hit the market.",
    isActionable: false,
  },

  [PhaseName.INFLUENCE_BID_ACTION]: {
    regions: ["players"],
    prompt: "Commit influence to set turn order.",
    isActionable: true,
  },
  [PhaseName.INFLUENCE_BID_REVEAL]: {
    regions: ["players"],
    prompt: "Influence bids are revealed.",
    isActionable: false,
  },
  [PhaseName.INFLUENCE_BID_RESOLVE]: {
    regions: ["players"],
    prompt: "Influence bids resolve into priority.",
    isActionable: false,
  },

  [PhaseName.STOCK_MEET]: {
    regions: ["companies", "stocks"],
    prompt: "Talk it over before orders are placed.",
    isActionable: true,
  },
  [PhaseName.STOCK_ACTION_ORDER]: {
    regions: ["companies", "stocks"],
    prompt: "Place your orders from the company tiles.",
    isActionable: true,
    actsOnBoard: true,
  },
  [PhaseName.STOCK_ACTION_RESULT]: {
    regions: ["companies"],
    prompt: "Your submitted orders.",
    isActionable: false,
  },
  [PhaseName.STOCK_ACTION_REVEAL]: {
    regions: ["companies"],
    prompt: "All orders are on the table.",
    isActionable: false,
  },
  [PhaseName.STOCK_RESOLVE_LIMIT_ORDER]: {
    regions: ["companies", "stocks"],
    prompt: "Limit orders are being filled.",
    isActionable: false,
  },
  [PhaseName.STOCK_RESOLVE_MARKET_ORDER]: {
    regions: ["companies", "stocks"],
    prompt: "Market orders are being filled.",
    isActionable: false,
  },
  [PhaseName.STOCK_SHORT_ORDER_INTEREST]: {
    regions: ["players"],
    prompt: "Short interest is charged.",
    isActionable: false,
  },
  [PhaseName.STOCK_ACTION_SHORT_ORDER]: {
    regions: ["companies", "players"],
    prompt: "Cover open short positions if you want to.",
    isActionable: true,
  },
  [PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER]: {
    regions: ["companies"],
    prompt: "Pending shorts open up.",
    isActionable: false,
  },
  [PhaseName.STOCK_ACTION_OPTION_ORDER]: {
    regions: ["companies", "players"],
    prompt: "Exercise option contracts if you want to.",
    isActionable: true,
  },
  [PhaseName.STOCK_RESOLVE_OPTION_ORDER]: {
    regions: ["companies"],
    prompt: "Option contracts resolve.",
    isActionable: false,
  },
  [PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER]: {
    regions: ["companies"],
    prompt: "Pending option conflicts resolve.",
    isActionable: false,
  },
  [PhaseName.STOCK_OPEN_LIMIT_ORDERS]: {
    regions: ["companies"],
    prompt: "New limit orders go on the book.",
    isActionable: false,
  },
  [PhaseName.STOCK_RESULTS_OVERVIEW]: {
    regions: ["stocks", "companies"],
    prompt: "Stock round results.",
    isActionable: false,
  },

  [PhaseName.OPERATING_PRODUCTION]: {
    regions: ["companies"],
    prompt: "Companies produce and earn revenue.",
    isActionable: false,
  },
  [PhaseName.OPERATING_PRODUCTION_VOTE]: {
    regions: ["companies"],
    prompt: "Vote on how each company spends its revenue.",
    isActionable: true,
  },
  [PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE]: {
    regions: ["companies", "stocks"],
    prompt: "Revenue votes resolve.",
    isActionable: false,
  },
  [PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT]: {
    regions: ["stocks"],
    prompt: "Stock prices adjust from operations.",
    isActionable: false,
  },
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE]: {
    regions: ["companies"],
    prompt: "Choose each company's action.",
    isActionable: true,
  },
  [PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT]: {
    regions: ["companies"],
    prompt: "Company action votes revealed.",
    isActionable: false,
  },
  [PhaseName.OPERATING_COMPANY_VOTE_RESOLVE]: {
    regions: ["companies"],
    prompt: "Company actions resolve.",
    isActionable: false,
  },

  [PhaseName.CAPITAL_GAINS]: {
    regions: ["players"],
    prompt: "Capital gains tax is assessed on net worth.",
    isActionable: false,
  },
  [PhaseName.DIVESTMENT]: {
    regions: ["players", "companies"],
    prompt: "Divest down to the certificate limit.",
    isActionable: true,
  },

  [PhaseName.PRIZE_VOTE_ACTION]: {
    regions: ["players"],
    prompt: "Vote on prizes.",
    isActionable: true,
  },
  [PhaseName.PRIZE_VOTE_RESOLVE]: {
    regions: ["players"],
    prompt: "Prize votes revealed.",
    isActionable: false,
  },
  [PhaseName.PRIZE_DISTRIBUTE_ACTION]: {
    regions: ["players", "companies"],
    prompt: "Distribute your prize.",
    isActionable: true,
  },
  [PhaseName.PRIZE_DISTRIBUTE_RESOLVE]: {
    regions: ["players", "companies"],
    prompt: "Prizes are handed out.",
    isActionable: false,
  },

  [PhaseName.MODERN_OPERATIONS]: {
    regions: ["companies", "workforce", "resources", "research"],
    prompt: "Build factories, run marketing, fund research.",
    isActionable: true,
  },
  [PhaseName.RESOLVE_MODERN_OPERATIONS]: {
    regions: ["workforce", "resources", "research", "companies"],
    prompt: "Operations resolve across the board.",
    isActionable: false,
  },
  [PhaseName.FACTORY_CONSTRUCTION]: {
    regions: ["companies", "resources", "workforce"],
    prompt: "Commission new factories.",
    isActionable: true,
  },
  [PhaseName.FACTORY_CONSTRUCTION_RESOLVE]: {
    regions: ["resources", "workforce", "companies"],
    prompt: "Factory construction resolves.",
    isActionable: false,
  },
  [PhaseName.MARKETING_AND_RESEARCH_ACTION]: {
    regions: ["companies", "research", "workforce"],
    prompt: "Commit to marketing campaigns and research.",
    isActionable: true,
  },
  [PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE]: {
    regions: ["research", "workforce", "companies"],
    prompt: "Marketing and research resolve.",
    isActionable: false,
  },
  [PhaseName.MARKETING_CAMPAIGN]: {
    regions: ["companies", "workforce"],
    prompt: "Launch marketing campaigns.",
    isActionable: true,
  },
  [PhaseName.MARKETING_CAMPAIGN_RESOLVE]: {
    regions: ["companies", "workforce"],
    prompt: "Marketing campaigns activate.",
    isActionable: false,
  },
  [PhaseName.RESEARCH_ACTION]: {
    regions: ["research", "workforce", "companies"],
    prompt: "Fund research for your sectors.",
    isActionable: true,
  },
  [PhaseName.RESEARCH_ACTION_RESOLVE]: {
    regions: ["research", "resources"],
    prompt: "Research tracks advance.",
    isActionable: false,
  },
  [PhaseName.RUSTED_FACTORY_UPGRADE]: {
    regions: ["companies", "resources"],
    prompt: "Upgrade or scrap rusted factories.",
    isActionable: true,
  },
  [PhaseName.CONSUMPTION_PHASE]: {
    regions: ["companies", "workforce"],
    prompt: "Consumers buy from the sectors.",
    isActionable: false,
  },
  [PhaseName.EARNINGS_CALL]: {
    regions: ["companies", "stocks"],
    prompt: "Profits are reported and stocks move.",
    isActionable: false,
  },
  [PhaseName.RESOLVE_INSOLVENCY]: {
    regions: ["companies", "players"],
    prompt: "Contribute to keep insolvent companies alive.",
    isActionable: true,
  },
  [PhaseName.SHAREHOLDER_MEETING]: {
    regions: ["companies", "players"],
    prompt: "Shareholders meet.",
    isActionable: true,
  },
  [PhaseName.SECTOR_NEW_COMPANY]: {
    regions: ["companies"],
    prompt: "A new company opens.",
    isActionable: false,
  },

  [PhaseName.FORECAST_COMMITMENT_START_TURN]: {
    regions: ["players", "companies"],
    prompt: "Commit your forecast for the turn.",
    isActionable: true,
  },
  [PhaseName.FORECAST_COMMITMENT_END_TURN]: {
    regions: ["players", "companies"],
    prompt: "Commit your closing forecast.",
    isActionable: true,
  },
  [PhaseName.FORECAST_RESOLVE]: {
    regions: ["players"],
    prompt: "Forecasts pay out.",
    isActionable: false,
  },
};

export function getBoardFocus(phaseName: PhaseName | undefined): BoardFocus {
  if (!phaseName) return NOTHING;
  return FOCUS_BY_PHASE[phaseName] ?? NOTHING;
}

/**
 * Focus intensity for a region: `primary` is where the action is, `secondary`
 * regions are changing as a side effect, `idle` is reference material.
 */
export type FocusLevel = "primary" | "secondary" | "idle";

export function focusLevelFor(
  focus: BoardFocus,
  region: BoardRegion
): FocusLevel {
  const index = focus.regions.indexOf(region);
  if (index === -1) return "idle";
  return index === 0 ? "primary" : "secondary";
}
