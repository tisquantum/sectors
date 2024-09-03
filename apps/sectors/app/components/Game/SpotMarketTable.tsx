import React from "react";
import {
  CompanyWithRelations,
  CompanyWithSector,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerRevealed,
} from "@server/prisma/prisma.types";
import CompanyInfoTable from "../Company/CompanyInfoTable";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { sectorColors } from "@server/data/gameData";
import ShareOwnershipTable from "../Company/ShareOwnershipTable";

const SpotMarketTable = ({
  companies,
  ordersConcealed,
  ordersRevealed,
  handleDisplayOrderInput,
  handleButtonSelect,
  handleCompanySelect,
  isInteractive,
  isRevealRound,
}: {
  companies: CompanyWithRelations[];
  ordersConcealed?: PlayerOrderConcealedWithPlayer[] | undefined;
  ordersRevealed?: PlayerOrderWithPlayerRevealed[] | undefined;
  handleDisplayOrderInput: (
    company: CompanyWithSector,
    isIpo?: boolean
  ) => void;
  handleButtonSelect: () => void;
  handleCompanySelect: (company: CompanyWithRelations, isIpo: boolean) => void;
  isInteractive: boolean;
  isRevealRound: boolean;
}) => {
  const columns = [
    "Company Name",
    "Ownership",
    "Stock Symbol",
    "Stock Price",
    "OM Shares",
    "IPO Price",
    "IPO Shares",
    "Orders",
    "Unit Price",
    "Cash on Hand",
    "Company Status",
    "Company Tier",
    "Operational Cost",
    "Actions / OR",
    "Float %",
    "Prestige",
    "Demand",
    "Sector",
    "Sector Demand",
    "Has Economies of Scale",
    "Loan",
  ];

  return (
    <Table>
      <TableHeader>
        {columns.map((column, index) => (
          <TableColumn
            key={column}
            className={`${index === 0 ? "sticky left-0" : "min-w-auto"}`}
          >
            {column}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {companies.map((company) => (
          <TableRow key={company.id}>
            {columns.map((column, colIndex) => (
              <TableCell
                key={column}
                className={`${
                  colIndex === 0 ? `sticky left-0 z-10 bg-gray-900` : ""
                }`}
                style={colIndex === 0 ? { zIndex: 99 } : {}}
              >
                <div
                  className={`flex items-center gap-2 ${
                    colIndex === 0 &&
                    `p-2 rounded-md bg-[${sectorColors[company.Sector.name]}]`
                  }`}
                >
                  <CompanyInfoTable
                    companyId={company.id}
                    ordersConcealed={ordersConcealed?.filter(
                      (order) => order.companyId === company.id
                    )}
                    ordersRevealed={ordersRevealed?.filter(
                      (order) => order.companyId === company.id
                    )}
                    column={column}
                    handleDisplayOrderInput={handleDisplayOrderInput}
                    handleButtonSelect={handleButtonSelect}
                    handleCompanySelect={handleCompanySelect}
                    isInteractive={isInteractive}
                    isRevealRound={isRevealRound}
                  />
                </div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SpotMarketTable;
