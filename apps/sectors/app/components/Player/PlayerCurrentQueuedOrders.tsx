import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { Card, CardBody, CardHeader, Spinner, Button } from "@nextui-org/react";
import { OrderType, ShareLocation, PhaseName } from "@server/prisma/prisma.client";
import { PlayerOrderWithCompany } from "@server/prisma/prisma.types";
import { useEffect, useRef, useState } from "react";
import OrderChip from "../Game/OrderChip";
import { RiDeleteBinLine } from "@remixicon/react";

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
  const utils = trpc.useUtils();
  const deleteAllOrders = trpc.playerOrder.deleteAllPlayerOrdersForPhase.useMutation({
    onSuccess: () => {
      utils.playerOrder.listPlayerOrdersWithCompany.invalidate();
      refetch();
    },
  });

  const isPlaceOrdersPhase = currentPhase?.name === PhaseName.STOCK_ACTION_ORDER;
  const hasOrders = playerOrders && playerOrders.length > 0;

  if (playerOrders == undefined) return null;

  const handleClearAll = async () => {
    if (!currentPhase?.id || !authPlayer?.id) return;
    if (!confirm('Are you sure you want to clear all your orders? This cannot be undone.')) {
      return;
    }
    try {
      await deleteAllOrders.mutateAsync({
        phaseId: currentPhase.id,
        playerId: authPlayer.id,
      });
    } catch (error) {
      console.error('Failed to clear orders:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3>Current Queued Orders</h3>
        {isPlaceOrdersPhase && hasOrders && (
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onPress={handleClearAll}
            isLoading={deleteAllOrders.isPending}
            className="text-xs"
          >
            <RiDeleteBinLine size={14} />
            Clear All
          </Button>
        )}
      </div>
      {hasOrders ? (
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
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">
          No orders placed
        </div>
      )}
    </div>
  );
};

export default PlayerCurrentQueuedOrders;
