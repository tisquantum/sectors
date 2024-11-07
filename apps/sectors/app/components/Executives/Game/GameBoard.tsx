import { PlayerTableau } from "./PlayerTableau";

const GameBoard = () => {
    
    return (
        <div className="grid grid-rows-3 grid-cols-3">
            <PlayerTableau />

            <PlayerTableau />

            <PlayerTableau />

            <PlayerTableau />
        </div>
    );
}

export default GameBoard;