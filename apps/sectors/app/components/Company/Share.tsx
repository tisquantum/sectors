import { Divider } from "@nextui-org/react";
import { Player, Share } from "@server/prisma/prisma.client";
import React from "react";
import PlayerAvatar from "../Player/PlayerAvatar";

const ShareComponent = ({
  name,
  quantity,
  icon,
  price,
  player,
}: {
  name: string;
  quantity: number;
  icon?: React.ReactNode;
  price?: number;
  player?: Player;
}) => {
  return (
    <div className="flex items-center justify-between bg-slate-200 shadow-lg rounded-lg px-1.5 py-0.5 max-w-sm mx-auto">
      {icon ? (
        icon
      ) : (
        <>
          {player && (
            <div className="mr-1">
              <PlayerAvatar player={player} size="sm" />
            </div>
          )}
          <div className="text-md font-semibold text-slate-900">{name}</div>
        </>
      )}
      {price && (
        <div className="text-md font-semibold text-slate-900">
          &nbsp;${price}
        </div>
      )}
      <div className="border-l border-slate-900 mx-1 h-4"></div>
      <div className="text-md font-bold text-violet-800">{quantity}</div>
    </div>
  );
};

export default ShareComponent;
