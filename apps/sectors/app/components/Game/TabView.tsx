"use client";

import PlayersOverview from "../Player/PlayersOverview";
import { Card, Tab, Tabs } from "@nextui-org/react";
import SectorComponent from "../Sector/Sector";
import GameLog from "./GameLog";
import GameChat from "../GameChat/GameChat";
import { useGame } from "./GameContext";
import { Key, useState, useRef, useEffect } from "react";
import { RiFundsLine, RiShapesFill, RiUserFill } from "@remixicon/react";
import { OperationMechanicsVersion } from "@server/prisma/prisma.client";
import { SidebarEconomyMiniView } from "./SidebarEconomyMiniView";
import { cn } from "@/lib/utils";

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
      classNames={{
        base: "w-full flex flex-col gap-0",
        tabList: cn(
          "w-full p-1 gap-1 rounded-lg border border-zinc-700/40 bg-zinc-950/50",
          isVertical
            ? "flex flex-col"
            : "!flex-none !grid grid-cols-3 auto-rows-fr"
        ),
        tab: cn(
          "max-w-full w-full justify-center px-1 py-2 h-auto min-h-[2.75rem]",
          "text-[11px] leading-tight text-center whitespace-normal"
        ),
        panel: "w-full flex-1 min-h-0 pt-2",
      }}
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
      {gameState.operationMechanicsVersion ===
        OperationMechanicsVersion.MODERN && (
        <Tab
          key="economy"
          title={
            <div className="flex gap-1 items-center">
              <RiFundsLine size={16} /> <span>Economy</span>
            </div>
          }
          className={tabStyle}
        >
          <Card className="h-[calc(100vh-288px)] overflow-y-auto scrollbar border border-zinc-800/60 bg-zinc-950/40">
            <SidebarEconomyMiniView />
          </Card>
        </Tab>
      )}
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
