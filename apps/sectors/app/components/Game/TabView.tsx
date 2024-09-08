"use client";

import PlayersOverview from "../Player/PlayersOverview";
import { Card, Tab, Tabs } from "@nextui-org/react";
import SectorComponent from "../Sector/Sector";
import GameLog from "./GameLog";
import GameChat from "../GameChat/GameChat";
import { useGame } from "./GameContext";
import { Key, useState } from "react";

const TabView = ({
  isVertical,
  setIsVertical,
}: {
  isVertical: boolean;
  setIsVertical: (isVertical: boolean) => void;
}) => {
  const { gameState, gameId } = useGame();
  const [selectedTab, setSelectedTab] = useState("chat");
  if (!gameState.roomId || !gameState.name) return null;
  const tabStyle = "flex flex-col overflow-hidden";
  const handleTabChange = (key: Key) => {
    setSelectedTab(key as string);
    setIsVertical(key === "close");
  };
  return (
    <Tabs
      aria-label="Options"
      selectedKey={selectedTab}
      onSelectionChange={handleTabChange}
      isVertical={isVertical}
      className="w-full"
    >
      <Tab key="chat" title="Chat">
        <GameChat roomId={gameState.roomId} gameName={gameState.name} />
      </Tab>
      <Tab key="players" title="Players" className={tabStyle}>
        <Card className="h-[calc(100vh-288px)] overflow-y-auto scrollbar">
          <PlayersOverview gameId={gameId} />
        </Card>
      </Tab>
      <Tab key="sectors" title="Sectors" className={tabStyle}>
        <Card className="h-[calc(100vh-288px)] overflow-y-auto scrollbar">
          <SectorComponent />
        </Card>
      </Tab>
      <Tab key="game-log" title="GameLog" className={tabStyle}>
        <Card className="h-[calc(100vh-288px)] overflow-y-auto scrollbar">
          <GameLog />
        </Card>
      </Tab>
      <Tab key="close" title="Close"></Tab>
    </Tabs>
  );
};

export default TabView;
