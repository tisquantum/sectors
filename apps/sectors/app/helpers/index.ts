import { Company, Sector } from "@server/prisma/prisma.client";
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
