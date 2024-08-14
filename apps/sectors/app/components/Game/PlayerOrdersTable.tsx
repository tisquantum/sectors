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

const PlayerOrderTable = ({
  companies,
  orders,
  handleDisplayOrderInput,
  handleButtonSelect,
  handleCompanySelect,
}: {
  companies: CompanyWithRelations[];
  orders: PlayerOrderConcealedWithPlayer[] | undefined;
  handleDisplayOrderInput: (
    company: CompanyWithSector,
    isIpo?: boolean
  ) => void;
  handleButtonSelect: () => void;
  handleCompanySelect: (company: CompanyWithRelations, isIpo: boolean) => void;
}) => {
  const columns = [
    "Company Name",
    "Stock Symbol",
    "Stock Price",
    "Open Market Shares",
    "IPO Price",
    "IPO Shares",
    "Orders",
    "Unit Price",
    "Cash on Hand",
    "Company Tier",
    "Company Status",
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
                  colIndex === 0 ? "sticky left-0 z-10 bg-slate-800" : ""
                }`}
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
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PlayerOrderTable;
