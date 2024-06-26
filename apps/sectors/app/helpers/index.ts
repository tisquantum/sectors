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
    case PhaseName.STOCK_RESOLVE_SHORT_ORDER:
      return "Resolve Short Orders";
    case PhaseName.STOCK_MEET:
      return "Stock Round Meeting";
    case PhaseName.CAPITAL_GAINS:
      return "Capital Gains";
    case PhaseName.DIVESTMENT:
      return "Divestment";
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
