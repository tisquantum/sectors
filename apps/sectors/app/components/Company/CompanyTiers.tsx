import {
  RiBox2Fill,
  RiExpandUpDownFill,
  RiGovernmentFill,
} from "@remixicon/react";
import { CompanyTierData } from "@server/data/constants";
import { Company, CompanyTier } from "@server/prisma/prisma.client";

const CompanyTiers = ({ company }: { company?: Company }) => {
  const companyTiers = CompanyTierData;

  return (
    <div className="p-4 rounded-lg shadow-md max-w-full">
      <table className="rounded-lg">
        <thead>
          <tr className="text-gray-200">
            <th className="py-2 px-4 border-b">Tier</th>
            <th className="py-2 px-4 border-b">Operating Costs</th>
            <th className="py-2 px-4 border-b">Supply Max</th>
            <th className="py-2 px-4 border-b">Company Actions/OR</th>
            <th className="py-2 px-4 border-b">Insolvency Shortfall</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(companyTiers).map(([tier, data], index) => (
            <tr
              key={tier}
              className={`text-center ${
                index % 2 === 0 ? "bg-black" : "bg-grey-800"
              }`}
            >
              <td>{tier}</td>
              <td>
                <div className="py-2 px-4 flex justify-center items-center">
                  <RiExpandUpDownFill className="text-gray-500 mr-2" />
                  <span>${data.operatingCosts}</span>
                </div>
              </td>
              <td>
                <div className="py-2 px-4 flex justify-center items-center">
                  <RiBox2Fill className="text-gray-500 mr-2" />
                  <span>{data.supplyMax}</span>
                </div>
              </td>
              <td>
                <div className="py-2 px-4 flex justify-center items-center">
                  <RiGovernmentFill className="text-gray-500 mr-2" />
                  <span>{data.companyActions}</span>
                </div>
              </td>
              <td>
                <div className="py-2 px-4 flex justify-center items-center">
                  <span>${data.insolvencyShortFall}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyTiers;
