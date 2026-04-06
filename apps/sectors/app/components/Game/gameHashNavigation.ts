/**
 * URL hash navigation for the in-game top bar and nested tabs.
 * Format: #<view> or #<view>/<subTab>, e.g. #economy/research-track
 */

export const GAME_VIEWS = [
  "action",
  "pending",
  "chart",
  "companies",
  "economy",
  "operations",
] as const;

export type GameView = (typeof GAME_VIEWS)[number];

const ECONOMY_TABS = [
  "overview",
  "capital-gains",
  "divestment",
  "resource-market",
  "research-track",
  "workforce-track",
] as const;

const OPERATIONS_TABS = [
  "consumption",
  "earnings",
  "operations",
  "operations-resolve",
] as const;

const COMPANIES_TABS = ["companies", "derivatives"] as const;

export function normalizeGameView(view: string): GameView {
  return GAME_VIEWS.includes(view as GameView) ? (view as GameView) : "action";
}

export function parseGameHash(hash: string): {
  view: GameView;
  economyTab: string;
  operationsTab: string;
  companiesTab: string;
} {
  const raw = (hash.startsWith("#") ? hash.slice(1) : hash).trim();
  if (!raw) {
    return {
      view: "action",
      economyTab: "overview",
      operationsTab: "consumption",
      companiesTab: "companies",
    };
  }
  const parts = raw.split("/").filter(Boolean);
  const view = normalizeGameView(parts[0] || "action");
  const sub = parts[1];

  let economyTab = "overview";
  let operationsTab = "consumption";
  let companiesTab = "companies";

  if (view === "economy") {
    economyTab =
      sub && (ECONOMY_TABS as readonly string[]).includes(sub)
        ? sub
        : "overview";
  } else if (view === "operations") {
    operationsTab =
      sub && (OPERATIONS_TABS as readonly string[]).includes(sub)
        ? sub
        : "consumption";
  } else if (view === "companies") {
    companiesTab =
      sub && (COMPANIES_TABS as readonly string[]).includes(sub)
        ? sub
        : "companies";
  }

  return { view, economyTab, operationsTab, companiesTab };
}

export function formatGameHash(
  view: GameView,
  tabs: {
    economyTab: string;
    operationsTab: string;
    companiesTab: string;
  }
): string {
  if (view === "economy") {
    return tabs.economyTab === "overview"
      ? "economy"
      : `economy/${tabs.economyTab}`;
  }
  if (view === "operations") {
    return tabs.operationsTab === "consumption"
      ? "operations"
      : `operations/${tabs.operationsTab}`;
  }
  if (view === "companies") {
    return tabs.companiesTab === "companies"
      ? "companies"
      : `companies/${tabs.companiesTab}`;
  }
  return view;
}

/** Stable #fragments for sharing links (include leading #). */
export const GAME_HASH = {
  action: "#action",
  pending: "#pending",
  chart: "#chart",
  companies: "#companies",
  companiesDerivatives: "#companies/derivatives",
  economy: "#economy",
  economyOverview: "#economy",
  economyCapitalGains: "#economy/capital-gains",
  economyDivestment: "#economy/divestment",
  economyResourceMarket: "#economy/resource-market",
  economyResearchTrack: "#economy/research-track",
  economyWorkforceTrack: "#economy/workforce-track",
  operations: "#operations",
  operationsConsumption: "#operations",
  operationsEarnings: "#operations/earnings",
  operationsMain: "#operations/operations",
  operationsResolve: "#operations/operations-resolve",
} as const;

export function sanitizeGameNavForState(
  parsed: {
    view: GameView;
    economyTab: string;
    operationsTab: string;
    companiesTab: string;
  },
  opts: { isModernOps: boolean; useOptionOrders: boolean }
) {
  let { economyTab, companiesTab } = parsed;
  if (
    !opts.isModernOps &&
    ["resource-market", "research-track", "workforce-track"].includes(
      economyTab
    )
  ) {
    economyTab = "overview";
  }
  if (!opts.useOptionOrders && companiesTab === "derivatives") {
    companiesTab = "companies";
  }
  return { ...parsed, economyTab, companiesTab };
}
