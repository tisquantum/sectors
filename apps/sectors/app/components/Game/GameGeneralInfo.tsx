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
import { Avatar, Tooltip } from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";
import { OrderType, PhaseName } from "@server/prisma/prisma.client";

const GameGeneralInfo = () => {
  const { gameState, currentTurn, authPlayer, currentPhase } = useGame();
  if (!gameState) return notFound();
  console.log("authPlayer", authPlayer);
  const pseudoSpend = authPlayer.PlayerOrder?.filter(
    (order) =>
      order.stockRoundId === gameState.currentStockRoundId &&
      order.orderType == OrderType.MARKET
  ).reduce((acc, order) => acc + (order.value || 0) * (order.quantity || 0), 0);
  return (
    <div className="flex space-x-4 items-center">
      <div className="flex items-center gap-2">
        <PlayerAvatar player={authPlayer} />
        <div className="flex flex-col">
          <div className="flex items-center text-md font-bold">
            <RiWalletFill size={18} /> ${authPlayer.cashOnHand}{" "}
            {(currentPhase?.name == PhaseName.STOCK_ACTION_ORDER ||
              currentPhase?.name == PhaseName.STOCK_ACTION_RESULT) &&
              pseudoSpend > 0 && (
                <Tooltip content="The potential maximum amount of money you've queued for orders this stock round.">
                  {"($" + pseudoSpend + ")"}
                </Tooltip>
              )}
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
        <div>{currentTurn.turn ?? "0"}</div>
      </div>
    </div>
  );
};

export default GameGeneralInfo;
