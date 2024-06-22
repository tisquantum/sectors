import { friendlyPhaseName } from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { notFound } from "next/navigation";
import React from "react";
import { useGame } from "./GameContext";

const GameGeneralInfo = ({ gameId }: { gameId: string }) => {
  const { currentPhase, gameState } = useGame();
  if (!gameState) return notFound();
  return (
    <div className="flex space-x-4">
      <div>
        <div className="text-lg font-bold">Bank Total</div>
        <div>${gameState.bankPoolNumber}</div>
      </div>
      <div>
        <div className="text-lg font-bold">Current Round</div>
        <div>{gameState.currentRound ?? "0"}</div>
      </div>
      {currentPhase && (
        <div>
          <div className="text-lg font-bold">Current Phase</div>
          <div>{friendlyPhaseName(currentPhase?.name)}</div>
        </div>
      )}
      <div>
        <div className="text-lg font-bold">Current Turn</div>
        <div>{gameState.currentTurn ?? "0"}</div>
      </div>
    </div>
  );
};

export default GameGeneralInfo;
