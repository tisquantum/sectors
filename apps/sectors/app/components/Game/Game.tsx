"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import GameSidebar from "./GameSidebar";
import GameTopBar from "./GameTopBar";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import TabView from "./TabView";
import PendingOrders from "./PendingOrders";
import StockChart from "./StockChart";
import CompanyActionSlider from "@sectors/app/components/Company/CompanyActionSelectionVote";
import {
  InfluenceRound,
  OperatingRound,
  Phase,
  PhaseName,
  RoundType,
  StockRound,
} from "@server/prisma/prisma.client";
import Meeting from "../Meeting/Meeting";
import {
  GameState,
  InfluenceRoundWithVotes,
} from "@server/prisma/prisma.types";
import { useGame } from "./GameContext";
import StockRoundAction from "./StockRoundAction";
import OperatingRoundProduction from "./OperatingRoundProduction";
import StockRoundResults from "./StockRoundResults";
import OperatingRoundRevenueVote from "./OperatingRoundRevenueVote";
import OperatingRoundRevenueVoteResolve from "./OperatingRoundRevenueVoteResolve";
import OperatingRoundStockPriceAdjustment from "./OperatingRoundStockPriceAdjustment";
import CompanyVoteResolve from "../Company/CompanyVoteResolve";
import EndTurnEconomy from "./EndTurnEconomy";
import PhaseListComponent from "./PhaseListComponent";
import CapitalGains from "./CapitalGains";
import Divestment from "./Divestment";
import InfluenceBid from "./InfluenceBid";
import ExerciseOptionOrders from "./ExerciseOptionOrders";
import CoverShortOrders from "./CoverShortOrders";
import { Spinner } from "@nextui-org/react";
import { isActivePhase } from "@server/data/helpers";

const determineGameRound = (
  game: GameState
):
  | { operatingRound: OperatingRound; phase: Phase }
  | { stockRound: StockRound; phase: Phase }
  | { influenceRound: InfluenceRound; phase: Phase }
  | { phase: Phase }
  | undefined => {
  const phase = game.Phase.find((phase) => phase.id === game.currentPhaseId);
  if (!phase) return undefined;
  if (game.currentRound === RoundType.OPERATING) {
    //find the current operating round
    const operatingRound = game.OperatingRound.find(
      (round) => round.id === game.currentOperatingRoundId
    );
    if (!operatingRound) {
      return undefined;
    }
    return { operatingRound, phase };
  } else if (game.currentRound === RoundType.STOCK) {
    //find the current stock round
    const stockRound = game.StockRound.find(
      (round) => round.id === game.currentStockRoundId
    );
    if (!stockRound) {
      return undefined;
    }
    return { stockRound, phase };
  } else if (game.currentRound === RoundType.GAME_UPKEEP) {
    return {
      phase,
    };
  } else if (game.currentRound === RoundType.INFLUENCE) {
    const influenceRound = game.InfluenceRound?.[0];
    if (!influenceRound) {
      return undefined;
    }
    return { influenceRound, phase };
  }
};

const TimesUp = () => (
  <div className="flex justify-center items-center relative">
    <motion.div
      className="absolute bg-slate-600 p-4 rounded-lg h-48 w-48"
      animate={{
        scale: [1, 1.5, 1.5, 1, 1],
        rotate: [0, 0, 180, 180, 0],
        borderRadius: ["0%", "0%", "50%", "50%", "0%"],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 1,
      }}
    />
    <div className="flex flex-col">
      <h1 className="text-slate-100 text-center font-bold	text-2xl z-10">
        TIME&apos;S UP!
      </h1>
      <span className="text-lg z-10 max-w-40 text-center">
        Gathering Data For Next Phase
      </span>
    </div>
  </div>
);

const Game = ({ gameId }: { gameId: string }) => {
  const { gameState, currentPhase } = useGame();

  const [currentView, setCurrentView] = useState<string>("action");
  const constraintsRef = useRef(null);
  const [isTimerAtZero, setIsTimerAtZero] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentPhase) {
        const now = Date.now();
        const phaseStart = new Date(currentPhase.createdAt).getTime();
        const phaseDuration = currentPhase.phaseTime;
        const timeLeft = phaseStart + phaseDuration - now;
        setIsTimerAtZero(timeLeft <= 0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentPhase?.name]);
  const handleCurrentView = (view: string) => {
    setCurrentView(view);
  };
  const currentRoundData = determineGameRound(gameState);
  const renderCurrentPhase =
    currentRoundData?.phase.name === PhaseName.STOCK_MEET ? (
      <Meeting />
    ) : currentRoundData?.phase.name === PhaseName.START_TURN ? (
      <Meeting />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_RESOLVE_LIMIT_ORDER ? (
      <PendingOrders />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_ORDER ? (
      <StockRoundAction />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_RESULT ? (
      <StockRoundAction />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_REVEAL ? (
      <StockRoundOrderGrid />
    ) : currentRoundData?.phase.name ===
      PhaseName.STOCK_RESOLVE_MARKET_ORDER ? (
      <PendingOrders isResolving={true} />
    ) : currentRoundData?.phase.name ===
      PhaseName.STOCK_SHORT_ORDER_INTEREST ? (
      <PendingOrders isResolving={true} />
    ) : currentRoundData?.phase.name ===
      PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER ? (
      <PendingOrders isResolving={true} />
    ) : currentRoundData?.phase.name ===
      PhaseName.STOCK_RESOLVE_OPTION_ORDER ? (
      <PendingOrders isResolving={true} />
    ) : currentRoundData?.phase.name ===
      PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER ? (
      <PendingOrders isResolving={true} />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_OPTION_ORDER ? (
      <ExerciseOptionOrders />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_OPEN_LIMIT_ORDERS ? (
      <PendingOrders isResolving={true} />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_RESULTS_OVERVIEW ? (
      <StockRoundResults />
    ) : currentRoundData?.phase.name === PhaseName.OPERATING_PRODUCTION ? (
      <OperatingRoundProduction />
    ) : currentRoundData?.phase.name === PhaseName.OPERATING_PRODUCTION_VOTE ? (
      <OperatingRoundRevenueVote />
    ) : currentRoundData?.phase.name ===
      PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT ? (
      <OperatingRoundStockPriceAdjustment />
    ) : currentRoundData?.phase.name ===
      PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE ? (
      <OperatingRoundRevenueVoteResolve />
    ) : currentRoundData?.phase.name ===
      PhaseName.OPERATING_ACTION_COMPANY_VOTE ? (
      <CompanyActionSlider />
    ) : currentRoundData?.phase.name ===
      PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT ? (
      <CompanyActionSlider withResult />
    ) : currentRoundData?.phase.name ===
      PhaseName.OPERATING_COMPANY_VOTE_RESOLVE ? (
      <CompanyVoteResolve />
    ) : currentRoundData?.phase.name === PhaseName.CAPITAL_GAINS ? (
      <CapitalGains />
    ) : currentRoundData?.phase.name === PhaseName.DIVESTMENT ? (
      <Divestment />
    ) : currentRoundData?.phase.name === PhaseName.END_TURN ? (
      <EndTurnEconomy />
    ) : currentRoundData?.phase.name === PhaseName.INFLUENCE_BID_ACTION ? (
      <InfluenceBid />
    ) : currentRoundData?.phase.name === PhaseName.INFLUENCE_BID_RESOLVE ? (
      <InfluenceBid isRevealRound />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_SHORT_ORDER ? (
      <CoverShortOrders />
    ) : null;

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
          <TabView gameId={gameId} />
        </motion.div>
      </motion.div>
      <div className="flex flex-col w-full">
        <GameTopBar
          gameId={gameId}
          handleCurrentView={handleCurrentView}
          isTimerAtZero={isTimerAtZero}
        />
        <div className="relative flex justify-between overflow-y-auto">
          {currentPhase?.name && isActivePhase(currentPhase.name) && (
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                isTimerAtZero
                  ? "opacity-100 z-20 bg-black bg-opacity-50"
                  : "opacity-0 z-0"
              }`}
            >
              <TimesUp />
            </div>
          )}
          <div className="basis-10/12	active-panel flex flex-col h-full p-4">
            {currentView === "action" && renderCurrentPhase}
            {currentView === "chart" && <StockChart />}
            {currentView === "pending" && <PendingOrders />}
            {currentView == "economy" && <EndTurnEconomy />}
          </div>
          <PhaseListComponent />
        </div>
      </div>
    </div>
  );
};

export default Game;
