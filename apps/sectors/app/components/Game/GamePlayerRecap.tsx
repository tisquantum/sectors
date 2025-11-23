import PlayerOverview from "../Player/PlayerOverview";
import { useGame } from "./GameContext";

const GamePlayersRecap = () => {
  const { playersWithShares } = useGame();

  return (
    <div className="flex flex-wrap gap-2">
      {playersWithShares.map((playerWithShares) => {
        return (
          <PlayerOverview
            key={playerWithShares.id}
            playerWithShares={playerWithShares}
          />
        );
      })}
    </div>
  );
};
export default GamePlayersRecap;
