"use client";
import { CeoInfluence } from "./CeoInfluence";
import { Deck } from "./Deck";
import { useExecutiveGame } from "./GameContext";
import { PlayerTableau } from "./PlayerTableau";
import { TrumpCard } from "./TrumpCard";

const GameBoard = ({ gameId }: { gameId: string }) => {
  const { gameState, authPlayer } = useExecutiveGame();
  const players = gameState.players;

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
    <div className="grid grid-rows-3 h-full">
      {/* Top row */}
      <div className="flex items-center justify-center gap-4">
        {sortedPlayers.length === 5 && (
          <>
            {renderPlayerTableau(sortedPlayers[2].id)}
            {renderPlayerTableau(sortedPlayers[3].id)}
          </>
        )}
        {sortedPlayers.length === 4 && renderPlayerTableau(sortedPlayers[2].id)}
        {sortedPlayers.length === 2 && renderPlayerTableau(sortedPlayers[1].id)}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-3">
        <div className="flex items-center justify-center">
          {sortedPlayers.length >= 3 &&
            renderPlayerTableau(sortedPlayers[1].id)}
        </div>
        <div className="flex flex-row gap-2 items-center justify-center">
          <Deck />
          {authPlayer.isGeneralCounsel && <TrumpCard />}
          <CeoInfluence />
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
  );
};

export default GameBoard;
