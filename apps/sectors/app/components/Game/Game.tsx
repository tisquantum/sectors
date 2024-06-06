"use client";

import { useState } from "react";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import ReadyUp from "../Player/PlayerReadyUp";
import GameSidebar from "./GameSidebar";
import GameTopBar from "./GameTopBar";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import TabView, { companies } from "./TabView";
import PendingOrders from "./PendingOrders";
import StockChart from "./StockChart";

const Game = () => {
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [currentView, setCurrentView] = useState<string>("action");
  const handleOrder = (order: any) => {
    setCurrentOrder(order);
  };
  const handleCurrentView = (view: string) => {
    setCurrentView(view);
  }
  return (
    <div className="flex flex-grow overflow-hidden">
      <GameSidebar />
      <div className="absolute z-10">
        <TabView />
      </div>
      <div className="flex flex-col w-full">
        <GameTopBar handleCurrentView={handleCurrentView}/>
        <ReadyUp />
        <div className="active-panel flex flex-col overflow-hidden">
          {currentView === "action" && (
            <>
          <div className="overflow-y-auto basis-3/4">
            <StockRoundOrderGrid
              companies={companies}
              handleOrder={handleOrder}
            />
          </div>
          <div className="overflow-y-auto basis-1/4 flex justify-center aligns-center">
            <PlayerOrderInput
              currentOrder={currentOrder}
              handleCancel={() => undefined}
            />
          </div>
          </>
          )}
          {currentView === "pending-orders" && (
            <div className="overflow-y-auto">
              <PendingOrders />
            </div>
          )}
          {currentView === "stock-chart" && (
            <StockChart />
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
