"use client";

import { useEffect, useState } from "react";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import { Company } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { isCurrentPhaseInteractive } from "@sectors/app/helpers";
import PlayerCurrentQueuedOrders from "../Player/PlayerCurrentQueuedOrders";

const StockRoundAction = () => {
  const { currentPhase } = useGame();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isIpo, setIsIpo] = useState<boolean>(false);
  const handleOrder = (order: Company, isIpo?: boolean) => {
    console.log("handleOrder", order, isIpo);
    setCurrentOrder(order);
    setIsIpo(isIpo || false);
  };
  useEffect(() => {
    setCurrentOrder(null);
  }, [currentPhase?.name]);
  return (
    <div className="flex flex-col items-center h-full">
      <div className="basis-3/4 justify-center items-center content-center">
        <StockRoundOrderGrid handleOrder={handleOrder} />
      </div>
      <div className="flex justify-center items-center gap-10 basis-1/4">
        {isCurrentPhaseInteractive(currentPhase?.name) ? (
          currentOrder ? (
            <PlayerOrderInput
              currentOrder={currentOrder}
              handleCancel={() => {}}
              isIpo={isIpo}
            />
          ) : (
            <div>Place an Order With A Company to Start.</div>
          )
        ) : (
          <div>Viewing results.</div>
        )}
        <PlayerCurrentQueuedOrders />
      </div>
    </div>
  );
};
export default StockRoundAction;
