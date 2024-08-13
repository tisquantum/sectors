import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { OrderType, ShareLocation } from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  PlayerOrderAllRelations,
  PlayerOrderWithPlayerCompany,
} from "@server/prisma/prisma.types";

const StockRoundResults = () => {
  const { currentPhase } = useGame();
  const { data: stockRound, isLoading } =
    trpc.stockRound.getStockRoundWithPlayerOrders.useQuery({
      where: {
        id: currentPhase?.stockRoundId,
      },
    });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!stockRound) {
    return <div>No stock round found</div>;
  }

  // Get all market orders that are filled
  const filledMarketOrders = stockRound.playerOrders.filter(
    (order) =>
      order.orderType === OrderType.MARKET &&
      order.orderStatus === "FILLED" &&
      order.location == ShareLocation.OPEN_MARKET
  );

  type CompanyOrders = {
    [companyName: string]: PlayerOrderWithPlayerCompany[];
  };

  // Group by company
  const companyOrders: CompanyOrders = filledMarketOrders.reduce(
    (acc: CompanyOrders, order: PlayerOrderWithPlayerCompany) => {
      if (!acc[order.Company.name]) {
        acc[order.Company.name] = [];
      }
      acc[order.Company.name].push(order);
      return acc;
    },
    {} as CompanyOrders
  );

  // Get the net difference for each company
  const companyNetDifference = Object.entries(companyOrders).map(
    ([companyName, orders]) => {
      const netDifference = orders.reduce((acc, order) => {
        return (
          acc + (order.isSell ? -(order.quantity || 0) : order.quantity || 0)
        );
      }, 0);
      return {
        companyName,
        netDifference,
      };
    }
  );

  return (
    <div>
      <h1 className="text-2xl">Stock Round Results</h1>
      <div className="flex flex-wrap gap-2">
        {stockRound.playerOrders.map((playerOrder) => (
          <div
            key={playerOrder.id}
            className="flex flex-col bg-slate-700 p-4 rounded-md min-w-64"
          >
            <PlayerAvatar player={playerOrder.Player} showNameLabel />
            <span>Company: {playerOrder.Company.name}</span>
            <span>
              Type: {playerOrder.orderType}{" "}
              {(playerOrder.orderType === OrderType.MARKET ||
                playerOrder.orderType === OrderType.LIMIT) &&
                (playerOrder.isSell ? "SELL" : "BUY")}
            </span>
            <span>Order Status: {playerOrder.orderStatus}</span>
            <span>Quantity: {playerOrder.quantity}</span>
            <span>Bid Price: ${playerOrder.value}</span>
            <span>Location: {playerOrder.location}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold">Company Net Differences</h2>
        {companyNetDifference.map(({ companyName, netDifference }) => (
          <div
            key={companyName}
            className="flex justify-between p-2 rounded-md mt-2"
          >
            <span>{companyName}</span>
            <span>
              {netDifference > 0 ? `+${netDifference}` : netDifference}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockRoundResults;
