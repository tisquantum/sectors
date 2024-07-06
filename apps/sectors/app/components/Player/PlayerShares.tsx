import React from "react";
import { Avatar, AvatarGroup, Badge } from "@nextui-org/react";
import { PlayerWithShares } from "@server/prisma/prisma.types";
import { StockAggregation } from "./PlayersOverview";
import ShareComponent from "../Company/Share";

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

const PlayerShares = ({ playerWithShares }: { playerWithShares: PlayerWithShares }) => {
  // Aggregate total value and total shares owned for each company
  const stockAggregation = playerWithShares.Share.reduce(
    (acc: Record<string, StockAggregation>, playerShare) => {
      const { companyId, price } = playerShare;
      if (!acc[companyId]) {
        acc[companyId] = { totalShares: 0, totalValue: 0 };
      }
      acc[companyId].totalShares += 1;
      acc[companyId].totalValue += price;
      acc[companyId].company = playerShare.Company;
      return acc;
    },
    {}
  );

  // Extract and map the companies from the aggregation
  const playerCompanies = Object.entries(stockAggregation).map(([companyId, aggregation]) => ({
    companyId,
    shareTotal: aggregation.totalShares,
    pricePerShare: aggregation.totalValue / aggregation.totalShares,
    totalValue: aggregation.totalValue,
    company: aggregation.company
  }));

  return (
    <div className="grid grid-cols-4 gap-4">
      {playerCompanies.length > 0 ? playerCompanies.map((company) => (
        <div
          key={company.companyId}
          className="flex flex-col justify-center items-center"
        >
          <ShareComponent name={company.company?.stockSymbol || ""} quantity={company.shareTotal} />
          <div className="text-sm mt-1">${company.totalValue.toFixed(2)}</div>
        </div>
      )) : <div>No shares owned.</div>}
    </div>
  );
};

export default PlayerShares;
