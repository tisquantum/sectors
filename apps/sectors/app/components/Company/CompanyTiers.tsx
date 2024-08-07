import { RiBox2Fill, RiExpandUpDownFill } from "@remixicon/react";
import { CompanyTierData } from "@server/data/constants";
import { Company, CompanyTier } from "@server/prisma/prisma.client";

const CompanyTiers = ({ company }: { company: Company }) => {
  const companyTiers = CompanyTierData;

  return (
    <div className="p-4 rounded-lg shadow-md">
      {Object.entries(companyTiers).map(([tier, data]) => (
        <div
          key={tier}
          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg shadow mb-4"
        >
          <div className="flex items-center mb-2 md:mb-0">
            <span className="font-bold text-lg mr-2">{tier}</span>
          </div>
          <div className="flex items-center mb-2 md:mb-0">
            <RiExpandUpDownFill className="text-gray-500 mr-2" />
            <span>${data.operatingCosts}</span>
          </div>
          <div className="flex items-center">
            <RiBox2Fill className="text-gray-500 mr-2" />
            <span>{data.supplyMax}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompanyTiers;
