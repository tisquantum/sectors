import React from "react";
import {
  CompanyWithRelations,
  CompanyWithSector,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerCompany,
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

const SpotMarketTable = ({
  companies,
  orders,
  handleDisplayOrderInput,
  handleButtonSelect,
  handleCompanySelect,
  isInteractive
}: {
  companies: CompanyWithRelations[];
  orders: PlayerOrderConcealedWithPlayer[] | undefined;
  handleDisplayOrderInput: (
    company: CompanyWithSector,
    isIpo?: boolean
  ) => void;
  handleButtonSelect: () => void;
  handleCompanySelect: (company: CompanyWithRelations, isIpo: boolean) => void;
  isInteractive: boolean;
}) => {
  const columns = [
    "Company Name",
    "Stock Symbol",
    "Stock Price",
    "Your Shares",
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
            className={`${index === 0 ? "sticky left-0 z-10" : ""}`}
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
              >
                <div
                  className={`flex items-center gap-2 ${
                    colIndex === 0  && `p-2 rounded-md bg-[${
                    sectorColors[company.Sector.name]
                  }]`}`}
                >
                  <CompanyInfoTable
                    company={company}
                    orders={orders?.filter(
                      (order) => order.companyId === company.id
                    )}
                    column={column}
                    handleDisplayOrderInput={handleDisplayOrderInput}
                    handleButtonSelect={handleButtonSelect}
                    handleCompanySelect={handleCompanySelect}
                    isInteractive={isInteractive}
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
