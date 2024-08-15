import React from "react";
import { ShareLocation, Phase, StockRound } from "@server/prisma/prisma.client";
import {
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerCompany,
} from "@server/prisma/prisma.types";
import { renderOrdersByPhase, groupOrdersByPhase } from "./groupOrdersHelpers";

type OrderResultsProps = {
  playerOrdersConcealed?: PlayerOrderConcealedWithPlayer[];
  playerOrdersRevealed?: PlayerOrderWithPlayerCompany[];
  currentPhase: Phase;
  phasesOfStockRound: Phase[];
  isRevealRound: boolean;
};

const OrderResults: React.FC<OrderResultsProps> = ({
  playerOrdersConcealed,
  playerOrdersRevealed,
  currentPhase,
  phasesOfStockRound,
  isRevealRound,
}) => {
  const mapPhaseToStockRound = (phaseId: string) => {
    return phasesOfStockRound.findIndex((phase) => phase.id === phaseId) + 1;
  };
  if (!playerOrdersConcealed || !playerOrdersRevealed)
    return <div>No orders yet this turn.</div>;

  const groupedIpoOrdersByPhase = groupOrdersByPhase(
    playerOrdersConcealed,
    ShareLocation.IPO,
    currentPhase.id,
    mapPhaseToStockRound
  );

  const groupedOpenMarketOrdersByPhase = groupOrdersByPhase(
    playerOrdersConcealed,
    ShareLocation.OPEN_MARKET,
    currentPhase.id,
    mapPhaseToStockRound
  );

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-bold mt-4">IPO Orders</h2>
      {!isRevealRound && (
        <div className="rounded-md p-2">
          <div className="flex flex-col gap-4 w-full">
            {renderOrdersByPhase(
              groupedIpoOrdersByPhase,
              playerOrdersConcealed,
              isRevealRound
            )}
          </div>
        </div>
      )}
      {isRevealRound && (
        <div className="rounded-md p-2">
          <div className="flex flex-col gap-4 w-full">
            {renderOrdersByPhase(
              groupedIpoOrdersByPhase,
              playerOrdersRevealed,
              isRevealRound
            )}
          </div>
        </div>
      )}
      <h2 className="text-lg font-semibold text-gray-400">
        Open Market Orders
      </h2>
      {!isRevealRound && (
        <div className="rounded-md p-2">
          <div className="flex flex-col gap-4 w-full">
            {renderOrdersByPhase(
              groupedOpenMarketOrdersByPhase,
              playerOrdersConcealed,
              isRevealRound
            )}
          </div>
        </div>
      )}
      {isRevealRound && (
        <div className="rounded-md p-2">
          <div className="flex flex-col gap-4 w-full">
            {renderOrdersByPhase(
              groupedOpenMarketOrdersByPhase,
              playerOrdersRevealed,
              isRevealRound
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderResults;
