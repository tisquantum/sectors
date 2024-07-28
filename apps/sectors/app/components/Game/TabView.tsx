"use client";

import PlayersOverview from "../Player/PlayersOverview";
import { Accordion, Card, CardBody, Tab, Tabs } from "@nextui-org/react";
import SectorComponent from "../Sector/Sector";
import GameLog from "./GameLog";
import GameChat from "../GameChat/GameChat";
import { useGame } from "./GameContext";

const TabView = () => {
  const { gameState, gameId } = useGame();
  if (!gameState.roomId || !gameState.name) return null;

  return (
    <Tabs aria-label="Options">
      <Tab key="chat" title="Chat">
        <GameChat roomId={gameState.roomId} gameName={gameState.name} />
      </Tab>
      <Tab key="players" title="Players">
        <Card>
          <PlayersOverview gameId={gameId} />
        </Card>
      </Tab>
      <Tab key="sectors" title="Sectors">
        <Card>
          <SectorComponent />
        </Card>
      </Tab>
      <Tab key="game-log" title="GameLog">
        <Card>
          <GameLog />
        </Card>
      </Tab>
      <Tab key="close" title="Close"></Tab>
    </Tabs>
  );
};

export default TabView;
