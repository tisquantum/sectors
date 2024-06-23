import React from "react";
import { Chip, Avatar, Badge } from "@nextui-org/react";
import { PlayerOrderConcealedWithPlayer } from "@server/prisma/prisma.types";

const PlayerOrderConcealed: React.FC<{
  orders?: PlayerOrderConcealedWithPlayer[];
}> = ({ orders }) => {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {orders?.map((order, index) => (
        <div className="flex items-center justify-center" key={index}>
          <Badge color="secondary" content={3}>
            <Avatar
              name={order.Player?.nickname ?? "Unknown"}
              size="sm"
              getInitials={(name) => name.charAt(0)}
            />
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default PlayerOrderConcealed;
