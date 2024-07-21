import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { OrderType } from "@server/prisma/prisma.client";
import PlayerAvatar from "../Player/PlayerAvatar";

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
  return (
    <div>
      <h1 className="text-2xl">Stock Round Results</h1>
      <div className="flex gap-3">
        {stockRound.playerOrders.map((playerOrder) => (
          <div
            key={playerOrder.id}
            className="flex flex-col bg-slate-700 p-4 rounded-md"
          >
            <PlayerAvatar player={playerOrder.Player} showNameLabel />
            <span>Company: {playerOrder.Company.name}</span>
            <span>
              Type: {playerOrder.orderType}{" "}
              {(playerOrder.orderType == OrderType.MARKET ||
                playerOrder.orderType == OrderType.LIMIT) &&
                (playerOrder.isSell ? "SELL" : "BUY")}
            </span>
            <span>Order Status: {playerOrder.orderStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockRoundResults;
