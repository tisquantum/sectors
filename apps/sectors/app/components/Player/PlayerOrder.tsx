import React from "react";
import OrderChipWithPlayer from "../Game/OrderChipWithPlayer";
import { PlayerOrderWithPlayerCompany } from "@server/prisma/prisma.types";

type OrderType = "LO" | "MO" | "SO";

interface PlayerOrderProps {
  orderType: string;
  orderAmount?: number; // Only required for LO
  isSell?: boolean; // Only required for MO or LO
  term?: number; // Only required for SO
  playerName: string;
}

const PlayerOrder = ({
  orders,
}: {
  orders: PlayerOrderWithPlayerCompany[];
}) => (
  <div className="flex flex-wrap gap-2">
    {orders.map((order, index) => (
      <OrderChipWithPlayer order={order} key={index} />
    ))}
  </div>
);

export default PlayerOrder;
