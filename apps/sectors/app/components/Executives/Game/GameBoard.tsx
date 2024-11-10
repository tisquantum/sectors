"use client";
import { Toaster } from "sonner";
import { CeoInfluence } from "./CeoInfluence";
import { Deck } from "./Deck";
import { useExecutiveGame } from "./GameContext";
import { PlayerTableau } from "./PlayerTableau";
import { TrumpCard } from "./TrumpCard";
import { turnPhaseDisplayTrump } from "../helpers";
import { Tricks } from "./Tricks";
import { TrickHistory } from "./TrickHistory";
import { ExecutivePhaseName } from "@server/prisma/prisma.client";
import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";

const GameBoard = ({ gameId }: { gameId: string }) => {
  const { gameState, authPlayer, currentPhase, currentTurn } =
    useExecutiveGame();
  const players = gameState.players;
  if (!currentTurn) {
    return <div>Current turn not found</div>;
  }
  if (!currentPhase) {
    return <div>Current phase not found</div>;
  }
  if (!players) {
    return <div>Players not found</div>;
  }

  if (!authPlayer) {
    return <div>Auth player not found</div>;
  }
  console.log("authPlayer", authPlayer);
  // Determine player seating order based on seatIndex
  const authPlayerId = authPlayer.id;
  let sortedPlayers = players.sort((a, b) => a.seatIndex - b.seatIndex);
  //sort players anchored from authplayerid
  const authPlayerIndex = sortedPlayers.findIndex(
    (player) => player.id === authPlayerId
  );
  if (authPlayerIndex === -1) {
    return <div>Auth player not found</div>;
  }
  sortedPlayers = [
    ...sortedPlayers.slice(authPlayerIndex),
    ...sortedPlayers.slice(0, authPlayerIndex),
  ];
  // Helper function to get PlayerTableau with playerId
  const renderPlayerTableau = (playerId: string) => (
    <PlayerTableau key={playerId} playerId={playerId} />
  );

  return (
    <>
      <div className="grid grid-rows-3 h-full gap-2">
        {/* Top row */}
        <div className="flex items-center justify-center gap-4">
          {sortedPlayers.length === 5 && (
            <>
              {renderPlayerTableau(sortedPlayers[2].id)}
              {renderPlayerTableau(sortedPlayers[3].id)}
            </>
          )}
          {sortedPlayers.length === 4 &&
            renderPlayerTableau(sortedPlayers[2].id)}
          {sortedPlayers.length === 2 &&
            renderPlayerTableau(sortedPlayers[1].id)}
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-3">
          <div className="flex items-center justify-center">
            {sortedPlayers.length >= 3 &&
              renderPlayerTableau(sortedPlayers[1].id)}
          </div>
          <div className="flex flex-row gap-2 items-center justify-center">
            <Deck />
            {(authPlayer.isGeneralCounsel ||
              turnPhaseDisplayTrump(currentPhase.phaseName)) && <TrumpCard />}
            <CeoInfluence />
            <div className="flex flex-col gap-1 items-center justify-center">
              {turnPhaseDisplayTrump(currentPhase.phaseName) && (
                <div
                  className={`relative border-2 border-dotted  ${
                    currentPhase?.phaseName == ExecutivePhaseName.SELECT_TRICK
                      ? "border-success-500"
                      : "border-gray-600"
                  } rounded-lg p-4`}
                >
                  <div className="absolute -top-3 left-3 bg-white px-2 font-bold text-gray-800 rounded-md">
                    TRICKS
                  </div>
                  <Tricks gameTurn={currentTurn} />
                </div>
              )}
              <Popover>
                <PopoverTrigger>
                  <div className="bg-primary p-1 font-bold text-gray-200 rounded-md cursor-pointer">
                    Trick History
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <TrickHistory gameId={gameId} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center justify-center">
            {sortedPlayers.length >= 4 &&
              renderPlayerTableau(
                sortedPlayers[sortedPlayers.length == 5 ? 4 : 3].id
              )}
          </div>
        </div>

        {/* Bottom row (auth player centered) */}
        <div className="flex items-center justify-center">
          {renderPlayerTableau(authPlayerId)}
        </div>
      </div>
      <Toaster />
    </>
  );
};

export default GameBoard;
