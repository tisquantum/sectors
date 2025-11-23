"use client";

import PlayersOverview from "../Player/PlayersOverview";
import { Card, Tab, Tabs } from "@nextui-org/react";
import SectorComponent from "../Sector/Sector";
import GameLog from "./GameLog";
import GameChat from "../GameChat/GameChat";
import { useGame } from "./GameContext";
import { Key, useState, useRef, useEffect } from "react";
import { RiShapesFill, RiUserFill } from "@remixicon/react";

const TabView = ({
  isVertical,
  setIsVertical,
}: {
  isVertical: boolean;
  setIsVertical: (isVertical: boolean) => void;
}) => {
  const { gameState, gameId } = useGame();
  const [selectedTab, setSelectedTab] = useState("chat");
  
  // Track renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current % 10 === 0) {
    console.log(`[TabView] Render count: ${renderCountRef.current}`);
  }
  
  // Track tab changes
  const tabChangeCountRef = useRef(0);
  const handleTabChange = (key: Key) => {
    tabChangeCountRef.current += 1;
    console.log(`[TabView] Tab changed to: ${key} (change #${tabChangeCountRef.current})`);
    setSelectedTab(key as string);
    setIsVertical(key === "close");
  };
  
  // Log when gameState changes
  useEffect(() => {
    console.log(`[TabView] gameState changed`, {
      roomId: gameState?.roomId,
      name: gameState?.name,
      currentPhaseId: gameState?.currentPhaseId,
    });
  }, [gameState?.roomId, gameState?.name, gameState?.currentPhaseId]);
  
  if (!gameState.roomId || !gameState.name) {
    console.log(`[TabView] Returning null - missing roomId or name`);
    return null;
  }
  const tabStyle = "flex flex-col overflow-hidden";
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
      <Tab
        key="players"
        title={
          <div className="flex gap-1 items-center">
            <RiUserFill size={16} /> <span>Players</span>
          </div>
        }
        className={tabStyle}
      >
        <Card className="h-[calc(100vh-288px)] overflow-y-auto scrollbar">
          <PlayersOverview gameId={gameId} />
        </Card>
      </Tab>
      <Tab
        key="sectors"
        title={
          <div className="flex gap-1 items-center">
            <RiShapesFill size={16} /> <span>Sectors</span>
          </div>
        }
        className={tabStyle}
      >
        <Card className="h-[calc(100vh-288px)] overflow-y-auto scrollbar">
          <SectorComponent />
        </Card>
      </Tab>
      <Tab key="game-log" title="GameLog" className={tabStyle}>
        <Card className="h-[calc(100vh-288px)] overflow-y-auto scrollbar">
          <GameLog />
        </Card>
      </Tab>
      <Tab key="close" title="Close" className="hidden lg:block"></Tab>
    </Tabs>
  );
};

export default TabView;
