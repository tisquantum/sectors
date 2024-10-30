import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  RiBox2Fill,
  RiExpandUpDownFill,
  RiGovernmentFill,
} from "@remixicon/react";
import { CompanyTierData } from "@server/data/constants";
import { Company, CompanyTier } from "@server/prisma/prisma.client";
import { TableHeaderCell } from "@tremor/react";

const CompanyTiers = ({ company }: { company?: Company }) => {
  const companyTiers = CompanyTierData;

  return (
    <div className="p-4 rounded-lg shadow-md max-w-full">
      <Table className="rounded-lg overflow-x-auto">
        <TableHeader>
          <TableColumn>Tier</TableColumn>
          <TableColumn>Operating Costs</TableColumn>
          <TableColumn>Supply Max</TableColumn>
          <TableColumn>Company Actions/OR</TableColumn>
          <TableColumn>Insolvency Shortfall</TableColumn>
        </TableHeader>
        <TableBody>
          {Object.entries(companyTiers).map(([tier, data], index) => (
            <TableRow
              key={tier}
              className={`text-center ${
                index % 2 === 0 ? "bg-black" : "bg-grey-800"
              }`}
            >
              <TableCell>{tier}</TableCell>
              <TableCell>
                <div className="py-2 px-4 flex justify-center items-center">
                  <RiExpandUpDownFill className="text-gray-500 mr-2" />
                  <span>${data.operatingCosts}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-2 px-4 flex justify-center items-center">
                  <RiBox2Fill className="text-gray-500 mr-2" />
                  <span>{data.supplyMax}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-2 px-4 flex justify-center items-center">
                  <RiGovernmentFill className="text-gray-500 mr-2" />
                  <span>{data.companyActions}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="py-2 px-4 flex justify-center items-center">
                  <span>${data.insolvencyShortFall}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompanyTiers;
