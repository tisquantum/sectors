import React from "react";
import { Chip, Avatar, Badge } from "@nextui-org/react";
import { PlayerOrderConcealedWithPlayer } from "@server/prisma/prisma.types";
import { Player } from "@server/prisma/prisma.client";
import { group } from "console";
import PlayerAvatar from "./PlayerAvatar";

const PlayerOrderConcealed: React.FC<{
  orders?: PlayerOrderConcealedWithPlayer[];
}> = ({ orders }) => {
  //group orders by player id and count for badge
  const grouped = orders?.reduce((acc, order) => {
    const playerId = order.Player?.id;
    if (!playerId) return acc;
    if (acc[playerId]) {
      acc[playerId].count++;
    } else {
      acc[playerId] = { Player: order.Player, count: 1 };
    }
    return acc;
  }, {} as { [key: string]: { Player: Player; count: number } });

  if (!grouped) return null;
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {Object.keys(grouped).map((index) => (
        <div className="flex items-center justify-center" key={index}>
          <PlayerAvatar
            player={grouped[index].Player}
            badgeContent={grouped[index].count}
            showNameLabel
          />
        </div>
      ))}
    </div>
  );
};

export default PlayerOrderConcealed;
