import React from "react";
import { Avatar, AvatarGroup, Badge } from "@nextui-org/react";
import { PlayerWithShares } from "@server/prisma/prisma.types";
import { StockAggregation } from "./PlayersOverview";
import ShareComponent from "../Company/Share";
import { trpc } from "@sectors/app/trpc";
import { OrderStatus } from "@server/prisma/prisma.client";
import { OptionContractMinimal } from "../Game/OptionContractMinimal";

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
  withAdvancedOrderTypes = true,
}: {
  playerWithShares: PlayerWithShares;
  withAdvancedOrderTypes?: boolean;
}) => {
  const {
    data: optionsOrders,
    isLoading,
    isError,
  } = trpc.playerOrder.listPlayerOrdersAllRelations.useQuery({
    where: {
      playerId: playerWithShares.id,
      optionContractId: { not: null },
      orderStatus: OrderStatus.OPEN,
    },
  });
  const {
    data: companies,
    isLoading: isLoadingCompanies,
    isError: isErrorCompanies,
  } = trpc.company.listCompanies.useQuery({
    where: {
      id: { in: playerWithShares.Share.map((share) => share.companyId) },
    },
  });
  if (isLoadingCompanies) return <div>Loading...</div>;
  if (isErrorCompanies) return <div>Error...</div>;
  if (!companies) return <div>No companies found</div>;
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
      if (!shortOrderId) {
        return acc;
      }
      if (!acc[shortOrderId]) {
        acc[shortOrderId] = {
          totalShares: 0,
          totalValue: 0,
          company: companies.find(
            (company) => company.id == playerShare.Company.id
          ),
        };
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
      acc[companyId].company = companies.find(
        (company) => company.id == playerShare.Company.id
      );
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
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
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
              price={company.company?.currentStockPrice || 0}
            />
            <div className="text-sm mt-1">
              ${(company.company?.currentStockPrice || 0) * company.shareTotal}
            </div>
          </div>
        ))
      ) : (
        <div>No shares owned.</div>
      )}
      {withAdvancedOrderTypes && (
        <>
          <div className="w-full border-t border-gray-300 my-4"></div>
          <div className="flex flex-col gap-2">
            <div className="text-lg">Short Orders</div>
            {shortSharesAggregation &&
              Object.entries(shortSharesAggregation).map(
                ([shortOrderId, aggregation]) => (
                  <div key={shortOrderId} className="flex flex-col gap-2">
                    <ShareComponent
                      name={aggregation.company?.stockSymbol || ""}
                      quantity={aggregation.totalShares}
                      price={aggregation.totalValue / aggregation.totalShares}
                    />
                  </div>
                )
              )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-lg">Options Orders</div>
            {optionsOrders &&
              optionsOrders.map((order) => {
                console.log("order", order);
                return (
                  <div key={order.id} className="flex flex-col gap-2">
                    {order.OptionContract && order.Company && (
                      <OptionContractMinimal
                        contract={{
                          ...order.OptionContract,
                          Company: order.Company,
                        }}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerShares;
