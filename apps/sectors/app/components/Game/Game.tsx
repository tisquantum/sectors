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
import {
  OperatingRound,
  Phase,
  PhaseName,
  Game as PrismaGame,
  StockRound,
} from "@server/prisma/prisma.client";
import Meeting from "../Meeting/Meeting";
import { GameState } from "@server/prisma/prisma.types";
import { useGame } from "./GameContext";

const determineGameRound = (
  game: GameState
):
  | { operatingRound: OperatingRound; phase: Phase }
  | { stockRound: StockRound; phase: Phase }
  | undefined => {
  const phase = game.Phase.find((phase) => phase.id === game.currentPhaseId);
  if(!phase) return undefined;
  if (game.currentRound === "OPERATING") {
    //find the current operating round
    const operatingRound = game.OperatingRound.find(
      (round) => round.id === game.currentOperatingRoundId
    );
    if (!operatingRound) {
      return undefined;
    }
    return { operatingRound, phase };
  } else {
    //find the current stock round
    const stockRound = game.StockRound.find(
      (round) => round.id === game.currentStockRoundId
    );
    if (!stockRound) {
      return undefined;
    }
    return { stockRound, phase };
  }
};
const Game = ({ gameId }: { gameId: string }) => {
  const { gameState } = useGame();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [currentView, setCurrentView] = useState<string>("action");
  const constraintsRef = useRef(null);

  const handleOrder = (order: any) => {
    setCurrentOrder(order);
  };
  const handleCurrentView = (view: string) => {
    setCurrentView(view);
  };
  const currentRoundData = determineGameRound(gameState);
  const renderCurrentPhase = currentRoundData?.phase.name === PhaseName.STOCK_MEET ? (
    <Meeting />
  ) : null;

  return (
    <div className="relative flex flex-grow overflow-hidden">
      {/* <GameSidebar /> */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        ref={constraintsRef}
      >
        <motion.div
          drag
          dragConstraints={constraintsRef}
          className="absolute pointer-events-auto"
        >
          <TabView gameId={gameId} />
        </motion.div>
      </motion.div>
      <div className="flex flex-col w-full">
        <GameTopBar gameId={gameId} handleCurrentView={handleCurrentView} />
        <div className="active-panel flex flex-col overflow-hidden h-full">
          {renderCurrentPhase}
        </div>
      </div>
    </div>
  );
};

export default Game;
