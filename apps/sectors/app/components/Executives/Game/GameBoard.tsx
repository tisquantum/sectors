import { Deck } from "./Deck";
import { PlayerTableau } from "./PlayerTableau";

const GameBoard = ({ gameId }: { gameId: string }) => {
  return (
    <div className="grid grid-rows-3 h-full">
      <div className="flex items-center justify-center">
        <PlayerTableau />
      </div>
      <div className="grid grid-cols-3">
        <PlayerTableau />
        <div className="flex items-center justify-center">
          <Deck />
        </div>
        <PlayerTableau />
      </div>

      <div className="flex items-center justify-center">
        <PlayerTableau />
      </div>
    </div>
  );
};

export default GameBoard;
