import { trpc } from "@sectors/app/trpc";
import TabView from "./TabView";
import { useGame } from "./GameContext";
import { useEffect, useState } from "react";
import { EVENT_PLAYER_READINESS_CHANGED } from "@server/pusher/pusher.types";
import { PlayerReadiness } from "@server/data/constants";

const GameSidebar = () => {
  const { gameState } = useGame();

  const [isVertical, setIsVertical] = useState(false);

  return (
    <div className="w-auto max-w-full lg:max-w-md relative flex flex-col md:h-[calc(100vh-64px)]">
      <div className="text-white p-4">
        <h1 className="text-xl font-bold">{gameState.name}</h1>
      </div>
      <TabView isVertical={isVertical} setIsVertical={setIsVertical} />
    </div>
  );
};

export default GameSidebar;
