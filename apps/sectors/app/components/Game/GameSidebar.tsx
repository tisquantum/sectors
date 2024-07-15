import GameChat from "../GameChat/GameChat";
import { useGame } from "./GameContext";

const GameSidebar = () => {
  const { gameState } = useGame();
  if (!gameState.roomId || !gameState.name) return null;
  return (
    <div className="w-1/4 bg-background text-white flex flex-col">
      <GameChat roomId={gameState.roomId} gameName={gameState.name} />
    </div>
  );
};

export default GameSidebar;
