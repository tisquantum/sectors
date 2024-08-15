import React from "react";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderConcealed from "../Player/PlayerOrderConcealed";
import { ShareLocation, Phase, StockRound } from "@server/prisma/prisma.client";
import { PlayerOrderConcealedWithPlayer, PlayerOrderWithPlayerCompany } from "@server/prisma/prisma.types";

export const groupOrdersByPhase = (
  orders: PlayerOrderConcealedWithPlayer[],
  location: ShareLocation,
  currentPhaseId: string,
  mapPhaseToStockRound: (phaseId: string) => number
): Record<
  string,
  { phaseId: string; count: number; stockRound: StockRound | null; subRound: number }
> => {
  return orders
    .filter((order) => order.location === location && order.phaseId !== currentPhaseId)
    .reduce((acc, order) => {
      const phaseId = order.phaseId;
      if (!phaseId) return acc;
      if (acc[phaseId]) {
        acc[phaseId].count++;
      } else {
        acc[phaseId] = {
          phaseId: order.phaseId,
          count: 1,
          stockRound: order.Phase.StockRound,
          subRound: mapPhaseToStockRound(order.phaseId),
        };
      }
      return acc;
    }, {} as Record<string, { phaseId: string; count: number; stockRound: StockRound | null; subRound: number }>);
};

export const renderOrdersByPhase = (
  groupedOrdersByPhase: Record<
    string,
    { phaseId: string; count: number; stockRound: StockRound | null; subRound: number }
  >,
  orders: PlayerOrderConcealedWithPlayer[] | PlayerOrderWithPlayerCompany[],
  isRevealRound: boolean
) => {
  return Object.entries(groupedOrdersByPhase)
    .sort(([, valueA], [, valueB]) => valueA.subRound - valueB.subRound)
    .map(([index, phaseData]) => (
      <div className="flex flex-col" key={index}>
        <div className="flex items-center justify-center">
          <span className="text-sm text-gray-400">{phaseData.subRound}</span>
        </div>
        <div className="flex items-center justify-center">
          {isRevealRound ? (
            <PlayerOrder
              orders={
                orders.filter(
                  (order): order is PlayerOrderWithPlayerCompany =>
                    order.phaseId === phaseData.phaseId && 'quantity' in order
                )
              }
            />
          ) : (
            <PlayerOrderConcealed
              orders={
                orders.filter(
                  (order): order is PlayerOrderConcealedWithPlayer =>
                    order.phaseId === phaseData.phaseId && 'Player' in order
                )
              }
            />
          )}
        </div>
      </div>
    ));
};
