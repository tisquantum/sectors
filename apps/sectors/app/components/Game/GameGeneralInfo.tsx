import { friendlyPhaseName } from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { notFound } from "next/navigation";
import React from "react";

const GameGeneralInfo = ({ gameId }: { gameId: string }) => {
  const { data: gameData, isLoading } = trpc.game.getGame.useQuery({ id: gameId });
  const { data: phaseData, isLoading: phaseIsLoading } = trpc.phase.getPhase.useQuery({ where: { id: gameData?.currentPhaseId ?? '' } });
  if(isLoading) return <div>Loading...</div>;
  if(gameData === undefined) return notFound();
  return (
    <div className="flex space-x-4">
      <div>
        <div className="text-lg font-bold">Bank Total</div>
        <div>${gameData.bankPoolNumber}</div>
      </div>
      <div>
        <div className="text-lg font-bold">Current Round</div>
        <div>{gameData.currentRound ?? "0"}</div>
      </div>
      <div>
        <div className="text-lg font-bold">Current Phase</div>
        <div>{friendlyPhaseName(phaseData?.name)}</div>
      </div>
      <div>
        <div className="text-lg font-bold">Current Turn</div>
        <div>{gameData.currentTurn ?? "0"}</div>
      </div>
    </div>
  );
};

export default GameGeneralInfo;
