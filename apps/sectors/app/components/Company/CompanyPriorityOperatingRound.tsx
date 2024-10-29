import React, { useMemo } from "react";
import {
  calculateDemand,
  companyPriorityOrderOperations,
} from "@server/data/helpers";
import { SectorName } from "@server/prisma/prisma.client";
import {
  CompanyWithSector,
  CompanyWithSectorPartial,
} from "@server/prisma/prisma.types";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { RiHandCoinFill, RiSparkling2Fill } from "@remixicon/react";

const exampleCompanyData: CompanyWithSectorPartial[] = [
  {
    id: "1",
    name: "QuantumNet",
    unitPrice: 55.32,
    prestigeTokens: 10,
    demandScore: 85,
    baseDemand: 60,
    hasEconomiesOfScale: true,
    Sector: {
      name: "Technology",
    },
  },
  {
    id: "2",
    name: "Green Energy Solutions",
    unitPrice: 42.5,
    prestigeTokens: 7,
    demandScore: 78,
    baseDemand: 55,
    hasEconomiesOfScale: false,
    Sector: {
      name: "Energy",
    },
  },
  {
    id: "3",
    name: "EcoMaterials Corp",
    unitPrice: 60.75,
    prestigeTokens: 5,
    demandScore: 92,
    baseDemand: 70,
    hasEconomiesOfScale: false,
    Sector: {
      name: "Materials",
    },
  },
];

const CompanyPriorityList = ({
  companies,
  isRuleExplanation,
}: {
  companies?: CompanyWithSector[];
  isRuleExplanation?: boolean;
}) => {
  let companyData: CompanyWithSectorPartial[] = exampleCompanyData;
  if (companies) {
    //use example company data
    companyData = companies;
  }
  const sortedCompanies = useMemo(
    () => companyPriorityOrderOperations(companyData),
    [companyData]
  );
  // Create a new sorted array of companyData based on the sortedCompanies order
  const sortedCompanyData = sortedCompanies.map((sortedCompany) => {
    return companyData.find((company) => company.id === sortedCompany.id)!;
  });
  return (
    <div className="container mx-auto px-4 flex flex-col">
      {!isRuleExplanation && (
        <>
          <h2 className="text-2xl font-bold mb-4">Company Priority List</h2>
          <Table>
            <TableHeader>
              <TableColumn>Rank</TableColumn>
              <TableColumn>Company Name</TableColumn>
              <TableColumn>Sector</TableColumn>
              <TableColumn>Unit Price</TableColumn>
              <TableColumn>Prestige Tokens</TableColumn>
              <TableColumn>Demand Score</TableColumn>
              <TableColumn>Has Economies of Scale</TableColumn>
            </TableHeader>
            <TableBody>
              {sortedCompanyData.map(
                (company: CompanyWithSectorPartial, index) => (
                  <TableRow key={company.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.Sector.name}</TableCell>
                    <TableCell>${company.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="flex items-center content-center justify-center gap-1">
                        <RiSparkling2Fill
                          size={18}
                          className="text-yellow-500"
                        />
                        {company.prestigeTokens}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center content-center justify-center gap-1">
                        <RiHandCoinFill size={18} />
                        {calculateDemand(
                          company.demandScore,
                          company.baseDemand
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {company.hasEconomiesOfScale ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </>
      )}
      <div className="mt-6 p-4 border-t">
        <h4 className="text-lg lg text-xl font-semibold mb-2">
          Priority Sorting Explanation:
        </h4>
        <ul className="text-sm lg:text-base list-disc list-inside">
          <li>
            0: If a company has Economies of Scale, it is considered to be the
            cheapest company regardless of its unit price.
          </li>
          <li>
            1: Companies are sorted by unit price in ascending order (cheapest
            first).
          </li>
          <li>
            2: Companies are sorted by prestige tokens in descending order.
          </li>
          <li>3: Companies are sorted by demand score in descending order.</li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyPriorityList;
