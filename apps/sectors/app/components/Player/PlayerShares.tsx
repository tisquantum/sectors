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

const PlayerShares = ({
  playerWithShares,
}: {
  playerWithShares: PlayerWithShares;
}) => {
  //get all shares that don't have shortOrderId
  const marketShares = playerWithShares.Share.filter(
    (share) => !share.shortOrderId
  );
  //get all shares that have shortOrderId
  const shortShares = playerWithShares.Share.filter(
    (share) => share.shortOrderId
  );
  //aggregate shortShares by shortOrderId and company
  const shortSharesAggregation = shortShares.reduce(
    (acc: Record<string, StockAggregation>, playerShare) => {
      const { shortOrderId, price } = playerShare;
      if(!shortOrderId) {
        return acc;
      }
      if (!acc[shortOrderId]) {
        acc[shortOrderId] = { totalShares: 0, totalValue: 0, company: playerShare.Company };
      }
      acc[shortOrderId].totalShares += 1;
      acc[shortOrderId].totalValue += price;
      return acc;
    },
    {}
  );
  // Aggregate total value and total shares owned for each company
  const stockAggregation = marketShares.reduce(
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
  const playerCompanies = Object.entries(stockAggregation).map(
    ([companyId, aggregation]) => ({
      companyId,
      shareTotal: aggregation.totalShares,
      pricePerShare: aggregation.totalValue / aggregation.totalShares,
      totalValue: aggregation.totalValue,
      company: aggregation.company,
    })
  );

  return (
    <div className="flex flex-wrap gap-4">
      {playerCompanies.length > 0 ? (
        playerCompanies.map((company) => (
          <div
            key={company.companyId}
            className="flex flex-col justify-center items-center"
          >
            <ShareComponent
              name={company.company?.stockSymbol || ""}
              quantity={company.shareTotal}
              price={company.pricePerShare}
            />
            <div className="text-sm mt-1">${company.totalValue.toFixed(2)}</div>
          </div>
        ))
      ) : (
        <div>No shares owned.</div>
      )}
      <div className="w-full border-t border-gray-300 my-4"></div>
      <div className="flex flex-col gap-2">
        <div className="text-lg">Short Orders</div>
        {shortSharesAggregation &&
          Object.entries(shortSharesAggregation).map(
            ([shortOrderId, aggregation]) => (
              <div key={shortOrderId} className="flex flex-col gap-2">
                <ShareComponent name={aggregation.company?.stockSymbol || ""} quantity={aggregation.totalShares} price={aggregation.totalValue / aggregation.totalShares} />
              </div>
            )
          )}
      </div>
    </div>
  );
};

export default PlayerShares;
