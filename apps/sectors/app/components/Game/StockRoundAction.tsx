"use client";

import { useEffect, useState } from "react";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import { Company } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { isCurrentPhaseInteractive } from "@sectors/app/helpers";

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
    <div className="flex flex-col justify-center items-center">
      <StockRoundOrderGrid handleOrder={handleOrder} />
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
    </div>
  );
};
export default StockRoundAction;
