import { Company, OrderType, PhaseName, Sector } from "@server/prisma/prisma.client";
import { CompanyWithSector } from "@server/prisma/prisma.types";

type CompaniesBySector = Record<
  string,
  {
    sector: Sector;
    companies: CompanyWithSector[];
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
    case PhaseName.STOCK_RESOLVE_OPTION_ORDER:
      return "Purchase Option Contracts";
    case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
      return "Open Pending Limit Orders";
    case PhaseName.STOCK_RESULTS_OVERVIEW:
      return "Stock Round Results";
    case PhaseName.STOCK_MEET:
      return "Stock Round Meeting";
    case PhaseName.OPERATING_PRODUCTION:
      return "Operating Round Production";
    case PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT:
      return "Stock Price Adjustment";
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE:
      return "Company Vote";
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT:
      return "Company Vote Result";
    case PhaseName.OPERATING_COMPANY_VOTE_RESOLVE:
      return "Resolve Company Action";
    case PhaseName.CAPITAL_GAINS:
      return "Capital Gains";
    case PhaseName.DIVESTMENT:
      return "Divestment";
    case PhaseName.START_TURN:
      return "Start Turn";
    case PhaseName.END_TURN:
      return "End Turn";
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

export const determineColorByOrderType = (orderType: OrderType, isSell: boolean | null) => {
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
