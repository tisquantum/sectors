import { Company, PhaseName, Sector } from "@server/prisma/prisma.client";
import { CompanyWithSector } from "@server/prisma/prisma.types";

type CompaniesBySector = Record<
  string,
  {
    sector: Sector;
    companies: Company[];
  }
>;

export function organizeCompaniesBySector(companies: CompanyWithSector[]): CompaniesBySector {
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
  if(name == undefined) {
    return "Unknown Phase";
  }
  switch (name) {
    case PhaseName.OR_1:
      return "Operating Round 1";
    case PhaseName.OR_2:
      return "Operating Round 2";
    case PhaseName.OR_3:
      return "Operating Round 3";
    case PhaseName.STOCK_1:
      return "Stock Round 1";
    case PhaseName.STOCK_2:
      return "Stock Round 2";
    case PhaseName.STOCK_3:
      return "Stock Round 3";
    case PhaseName.STOCK_4:
      return "Stock Round 4";
    case PhaseName.STOCK_5:
      return "Stock Round 5";
    case PhaseName.OR_MEET_1:
      return "Operating Round Meeting 1";
    case PhaseName.OR_MEET_2:
      return "Operating Round Meeting 2";
    case PhaseName.OR_MEET_3:
      return "Operating Round Meeting 3";
    case PhaseName.STOCK_MEET:
      return "Stock Round Meeting";
    default:
      return "Unknown Phase";
  }
}