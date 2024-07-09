import { friendlyPhaseName } from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { notFound } from "next/navigation";
import React from "react";
import { useGame } from "./GameContext";
import {
  CircleStackIcon,
  CurrencyDollarIcon,
  SquaresPlusIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import {
  RiWalletFill,
  RiFunctionAddFill,
  RiTeamFill,
  RiBankFill,
} from "@remixicon/react";
import { Avatar } from "@nextui-org/react";

const GameGeneralInfo = () => {
  const { currentPhase, gameState, authPlayer } = useGame();
  if (!gameState) return notFound();
  return (
    <div className="flex space-x-4 items-center">
      <div className="flex items-center">
        <Avatar name={authPlayer.nickname} size="md" className="mr-2" />
        <div className="flex flex-col">
          <div className="flex items-center text-md font-bold">
            <RiWalletFill size={18} /> ${authPlayer.cashOnHand}
          </div>
          <div className="flex items-center text-md">
            <RiFunctionAddFill size={24} /> LO {authPlayer.limitOrderActions} MO{" "}
            {authPlayer.marketOrderActions} SO {authPlayer.shortOrderActions}
          </div>
        </div>
      </div>
      <div>
        <div className="text-lg font-bold">Consumer Pool</div>
        <div className="flex items-center gap-2">
          <RiTeamFill size={18} />
          {gameState.consumerPoolNumber}
        </div>
      </div>
      <div>
        <div className="text-lg font-bold">Bank Total</div>
        <div className="flex gap-1 items-center">
          <RiBankFill size={18} /> ${gameState.bankPoolNumber}
        </div>
      </div>
      <div>
        <div className="text-lg font-bold">Round</div>
        <div>{gameState.currentRound ?? "0"}</div>
      </div>
      <div>
        <div className="text-lg font-bold">Turn</div>
        <div>{gameState.currentTurn ?? "0"}</div>
      </div>
    </div>
  );
};

export default GameGeneralInfo;
