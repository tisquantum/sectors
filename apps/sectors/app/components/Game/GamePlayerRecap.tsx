import PlayerOverview from "../Player/PlayerOverview";
import { useGame } from "./GameContext";

const GamePlayersRecap = () => {
  const { playersWithShares } = useGame();

  return (
    <div className="flex flex-wrap justify-center items-center">
      {playersWithShares.map((playerWithShares) => {
        return (
          <div
            key={playerWithShares.id}
            className="flex flex-col justify-center items-center"
          >
            <PlayerOverview playerWithShares={playerWithShares} />
          </div>
        );
      })}
    </div>
  );
};
export default GamePlayersRecap;
