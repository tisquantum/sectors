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
  const tabStyle = "flex flex-col overflow-hidden";
  return (
    <Tabs aria-label="Options">
      <Tab key="chat" title="Chat" className={tabStyle}>
        <GameChat roomId={gameState.roomId} gameName={gameState.name} />
      </Tab>
      <Tab key="players" title="Players" className={tabStyle}>
        <Card className="overflow-y-auto scrollbar">
          <PlayersOverview gameId={gameId} />
        </Card>
      </Tab>
      <Tab key="sectors" title="Sectors" className={tabStyle}>
        <Card className="overflow-y-auto scrollbar">
          <SectorComponent />
        </Card>
      </Tab>
      <Tab key="game-log" title="GameLog" className={tabStyle}>
        <Card className="overflow-y-auto scrollbar">
          <GameLog />
        </Card>
      </Tab>
      <Tab key="close" title="Close"></Tab>
    </Tabs>
  );
};

export default TabView;
