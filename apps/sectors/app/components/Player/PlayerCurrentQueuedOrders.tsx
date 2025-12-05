import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { Card, CardBody, CardHeader, Spinner } from "@nextui-org/react";
import { OrderType, ShareLocation } from "@server/prisma/prisma.client";
import { PlayerOrderWithCompany } from "@server/prisma/prisma.types";
import { useEffect, useRef } from "react";
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
  } = trpc.playerOrder.listPlayerOrdersWithCompany.useQuery(
    {
      where: {
        stockRoundId: currentPhase?.stockRoundId,
        playerId: authPlayer?.id,
      },
    },
    {
      enabled: !!currentPhase?.stockRoundId && !!authPlayer?.id,
      // Prevent excessive refetching
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5000, // 5 seconds - orders change more frequently
    }
  );
  
  // Only refetch when phase actually changes (not on every render)
  const lastPhaseIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const currentStockRoundId = currentPhase?.stockRoundId ?? null;
    if (currentStockRoundId !== lastPhaseIdRef.current) {
      lastPhaseIdRef.current = currentStockRoundId;
      refetch();
    }
  }, [currentPhase?.stockRoundId, refetch]);
  
  // Debounce newOrderCount refetches
  const lastOrderCountRef = useRef(0);
  useEffect(() => {
    if (newOrderCount > lastOrderCountRef.current) {
      lastOrderCountRef.current = newOrderCount;
      // Small delay to batch multiple order updates
      const timeoutId = setTimeout(() => {
        refetch();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [newOrderCount, refetch]);
  if (isLoading) return (
    <div className="flex items-center justify-center gap-2 p-4">
      <Spinner size="sm" color="primary" />
      <span className="text-sm text-gray-400">Loading orders...</span>
    </div>
  );
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
