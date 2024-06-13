"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import ReadyUp from "../Player/PlayerReadyUp";
import GameSidebar from "./GameSidebar";
import GameTopBar from "./GameTopBar";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import TabView, { companies } from "./TabView";
import PendingOrders from "./PendingOrders";
import StockChart from "./StockChart";
import CompanyActionSlider from "@sectors/app/components/Company/CompanyActionSelectionVote";
import Timer from "./Timer";
import CompanyActionVote from "../Company/CompanyActionVote";

const Game = () => {
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [currentView, setCurrentView] = useState<string>("action");
  const constraintsRef = useRef(null);

  const handleOrder = (order: any) => {
    setCurrentOrder(order);
  };
  const handleCurrentView = (view: string) => {
    setCurrentView(view);
  };
  return (
    <div className="relative flex flex-grow overflow-hidden">
      <GameSidebar />
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        ref={constraintsRef}
      >
        <motion.div
          drag
          dragConstraints={constraintsRef}
          className="absolute pointer-events-auto"
        >
          <TabView />
        </motion.div>
      </motion.div>
      <div className="flex flex-col w-full">
        <GameTopBar handleCurrentView={handleCurrentView} />
        <ReadyUp />
        <div className="active-panel flex flex-col overflow-hidden h-full">
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
                <Timer />
              </div>
            </>
          )}
          {currentView === "pending-orders" && (
            <div className="overflow-y-auto">
              <PendingOrders />
            </div>
          )}
          {currentView === "stock-chart" && <StockChart />}
          {currentView === "company" && (
            <>
              <div className="overflow-y-auto basis-3/4">
                <CompanyActionSlider />
              </div>
              <div className="overflow-y-auto basis-1/4 flex justify-center aligns-center">
                <CompanyActionVote />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
