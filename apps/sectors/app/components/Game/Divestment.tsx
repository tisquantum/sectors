import { DEFAULT_SHARE_LIMIT } from "@server/data/constants";
import PlayerAvatar from "../Player/PlayerAvatar";
import PlayerShares from "../Player/PlayerShares";
import { useGame } from "./GameContext";

const Divestment = () => {
  const { playersWithShares } = useGame();
  return (
    <div>
      <h1 className="text-2xl">Divestment</h1>
      <p>
        Any player who exceeds the share limit must divest down to the limit.
        The share limit is {DEFAULT_SHARE_LIMIT}. This process is conducted at
        random and players have no agency in which shares will be divested.
      </p>
      <div className="flex flex-wrap gap-4 p-4">
        {playersWithShares.map((player) => (
          <div
            key={player.id}
            className="p-4 border rounded-lg shadow-md w-full max-w-sm"
          >
            <div className="flex flex-col items-center gap-2">
              <PlayerAvatar player={player} showNameLabel />
              <PlayerShares playerWithShares={player} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Divestment;
