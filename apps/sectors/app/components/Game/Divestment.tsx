import PlayerAvatar from "../Player/PlayerAvatar";
import PlayerShares from "../Player/PlayerShares";
import { useGame } from "./GameContext";

const Divestment = () => {
  const { playersWithShares } = useGame();
  return (
    <div>
      <h1 className="text-2xl">Divestment</h1>
      <div className="flex gap-2">
        {playersWithShares.map((player) => (
          <div key={player.id} className="flex flex-col gap-2">
            <PlayerAvatar player={player} showNameLabel />
            <PlayerShares playerWithShares={player} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Divestment;
