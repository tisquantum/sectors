import React from "react";
import { Chip, Avatar, Badge } from "@nextui-org/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { determineColorByOrderType } from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "../Game/GameContext";
import { OrderType } from "@server/prisma/prisma.client";
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
  <div className="grid grid-cols-3 gap-4 w-full">
    {orders.map((order, index) => (
      <OrderChipWithPlayer order={order} key={index} />
    ))}
  </div>
);

export default PlayerOrder;
