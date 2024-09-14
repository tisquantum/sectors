import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { OrderType, ShareLocation } from "@server/prisma/prisma.client";
import { PlayerOrderWithCompany } from "@server/prisma/prisma.types";
import { useEffect } from "react";
import OrderChip from "../Game/OrderChip";

const renderBasedOnOrderType = (playerOrder: PlayerOrderWithCompany) => {
  return (
    <div>
      {playerOrder.orderType === OrderType.MARKET && (
        <div className="flex flex-col gap-2 my-2">
          {playerOrder.location === ShareLocation.IPO && (
            <div>IPO ${playerOrder.Company.ipoAndFloatPrice}</div>
          )}
          {playerOrder.location === ShareLocation.OPEN_MARKET && (
            <div>Market ${playerOrder.Company.currentStockPrice}</div>
          )}
        </div>
      )}
      <OrderChip order={playerOrder} />
    </div>
  );
};

const PlayerCurrentQueuedOrders = ({
  newOrderCount,
}: {
  newOrderCount: number;
}) => {
  const { currentPhase, authPlayer } = useGame();
  const {
    data: playerOrders,
    isLoading,
    refetch,
  } = trpc.playerOrder.listPlayerOrdersWithCompany.useQuery({
    where: {
      stockRoundId: currentPhase?.stockRoundId,
      playerId: authPlayer?.id,
    },
  });
  useEffect(() => {
    refetch();
  }, [currentPhase?.name]);
  useEffect(() => {
    if (newOrderCount > 0) {
      refetch();
    }
  }, [newOrderCount]);
  if (isLoading) return <div>Loading...</div>;
  if (playerOrders == undefined) return null;

  return (
    <div>
      <h3>Current Queued Orders</h3>
      <div className="grid grid-cols-2 gap-3">
        {playerOrders.map((playerOrder) => (
          <Card
            className="flex flex-col justify-center p-2 gap-1"
            key={playerOrder.id}
          >
            <span>{playerOrder.Company.name}</span>
            {renderBasedOnOrderType(playerOrder)}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlayerCurrentQueuedOrders;
