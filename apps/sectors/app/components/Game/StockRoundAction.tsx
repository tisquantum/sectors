"use client";

import { useState } from "react";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import { Company } from "@server/prisma/prisma.client";

const StockRoundAction = () => {
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isIpo, setIsIpo] = useState<boolean>(false);
  const handleOrder = (order: Company, isIpo?: boolean) => {
    console.log('handleOrder', order);
    setCurrentOrder(order);
    setIsIpo(isIpo || false);
  };
  return (
    <div className="flex flex-col justify-center items-center">
      <StockRoundOrderGrid handleOrder={handleOrder} />
      <PlayerOrderInput currentOrder={currentOrder} handleCancel={() => {}} isIpo={isIpo} />
    </div>
  );
};
export default StockRoundAction;
