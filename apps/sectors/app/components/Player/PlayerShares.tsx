import React from "react";
import { Avatar, AvatarGroup, Badge } from "@nextui-org/react";

const playerCompanies = [
  {
    companyName: "Company A",
    shareTotal: 10,
    pricePerShare: 150.75,
  },
  {
    companyName: "Company B",
    shareTotal: 5,
    pricePerShare: 200.0,
  },
  {
    companyName: "Company C",
    shareTotal: 20,
    pricePerShare: 100.0,
  },
  {
    companyName: "Company D",
    shareTotal: 15,
    pricePerShare: 175.5,
  },
  {
    companyName: "Company E",
    shareTotal: 8,
    pricePerShare: 250.0,
  },
];

const PlayerShares = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {playerCompanies.map((company) => {
        const totalValue = company.shareTotal * company.pricePerShare;

        return (
          <div
            key={company.companyName}
            className="flex flex-col justify-center items-center"
          >
            <Badge content={company.shareTotal} color="default">
              <Avatar name={company.companyName} />
            </Badge>
            <div className="text-sm mt-1">${totalValue.toFixed(2)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerShares;
