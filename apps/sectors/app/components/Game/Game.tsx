"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GameSidebar from "./GameSidebar";
import GameTopBar from "./GameTopBar";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
import TabView from "./TabView";
import PendingOrders from "./PendingOrders";
import StockChart from "./StockChart";
import CompanyActionSlider from "@sectors/app/components/Company/CompanyActionSelectionVote";
import {
  GameStatus,
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
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  Spinner,
  useDisclosure,
} from "@nextui-org/react";
import { isActivePhase } from "@server/data/helpers";
import GameResults from "./GameResults";
import { Drawer } from "vaul";
import { useDrawer } from "../Drawer.context";
import PrizeRound from "./PrizeVote";
import DistributePrizes from "./DistributePrize";
import StartTurnUpdates from "./StartTurnUpdates";
import GamePlayersRecap from "./GamePlayerRecap";
import Headlines from "./Headlines";

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
  const {
    isOpen: drawerIsOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  } = useDrawer();
  const [currentView, setCurrentView] = useState<string>("action");
  const [showPhaseList, setShowPhaseList] = useState<boolean>(true);
  const constraintsRef = useRef(null);
  const [isTimerAtZero, setIsTimerAtZero] = useState(false);
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const {
    isOpen: isSidebarModalOpen,
    onOpen: openSidebarModal,
    onClose: closeSidebarModal,
    onOpenChange: onSidebarModalOpenChange,
  } = useDisclosure();
  const gameActionContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    onOpen();
  }, [onOpen]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentPhase && currentPhase.phaseStartTime) {
        const now = Date.now();
        const phaseStart = new Date(currentPhase.phaseStartTime).getTime();
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
      <div className="flex flex-col items-center justify-between h-full w-full gap-2">
        <StartTurnUpdates />
        <Headlines />
        <div className="flex flex-col gap-2 items-center">
          <h2 className="text-xl">Players Overview</h2>
          <GamePlayersRecap />
        </div>
      </div>
    ) : currentRoundData?.phase.name === PhaseName.HEADLINE_RESOLVE ? (
      <Headlines />
    ) : currentRoundData?.phase.name === PhaseName.PRIZE_VOTE_ACTION ? (
      <PrizeRound />
    ) : currentRoundData?.phase.name === PhaseName.PRIZE_VOTE_RESOLVE ? (
      <PrizeRound isRevealRound />
    ) : currentRoundData?.phase.name === PhaseName.PRIZE_DISTRIBUTE_ACTION ? (
      <DistributePrizes />
    ) : currentRoundData?.phase.name === PhaseName.PRIZE_DISTRIBUTE_RESOLVE ? (
      <DistributePrizes />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_RESOLVE_LIMIT_ORDER ? (
      <PendingOrders />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_ORDER ? (
      <StockRoundAction forwardedRef={gameActionContainerRef.current} />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_RESULT ? (
      <StockRoundAction forwardedRef={gameActionContainerRef.current} />
    ) : currentRoundData?.phase.name === PhaseName.STOCK_ACTION_REVEAL ? (
      <StockRoundOrderGrid forwardedRef={gameActionContainerRef.current} />
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
      <div className="flex flex-col items-center justify-between h-full w-full gap-2">
        <CompanyActionSlider withResult />
        <CompanyVoteResolve />
      </div>
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
    <>
      <Drawer.Root
        open={drawerIsOpen}
        onOpenChange={toggleDrawer}
        direction="right"
      >
        <div className="relative flex flex-col lg:flex-row flex-grow w-full overflow-y scrollbar lg:overflow-hidden bg-background">
          <div className="hidden lg:block">
            <GameSidebar />
          </div>
          {/* <motion.div
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
      </motion.div> */}
          <div className="flex flex-col relative w-full">
            {gameState.gameStatus == GameStatus.FINISHED && (
              <Button
                color="primary"
                className="h-44 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform transition-transform duration-300 hover:scale-90 hover:shadow-2xl"
                onPress={onOpen}
              >
                <div className="flex flex-col gap-2 items-center">
                  <span className="text-2xl font-bold animate-pulse">
                    Game Has Ended!
                  </span>
                  <span className="text-xl font-medium">View Game Results</span>
                </div>
              </Button>
            )}

            <GameTopBar
              handleCurrentView={handleCurrentView}
              handleTogglePhaseList={() => setShowPhaseList((prev) => !prev)}
              isTimerAtZero={isTimerAtZero}
            />
            <div
              className="relative flex justify-between overflow-y-auto scrollbar w-full"
              ref={gameActionContainerRef}
            >
              {/* {currentPhase?.name &&
                isActivePhase(currentPhase.name) &&
                isTimerAtZero && (
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-100 z-20 bg-black bg-opacity-50">
                    <TimesUp />
                  </div>
                )} */}
              <div
                className={`@container active-panel flex flex-col h-full max-h-full w-full p-4 overflow-y-auto scrollbar`}
              >
                {currentView === "action" && renderCurrentPhase}
                {currentView === "chart" && <StockChart />}
                {currentView === "pending" && <PendingOrders />}
                {currentView == "economy" && <EndTurnEconomy />}
                {currentView == "markets" && <StockRoundOrderGrid />}
                {currentView == "companies" && <CompanyActionSlider />}
                {gameState.gameStatus == GameStatus.FINISHED && (
                  <GameResults
                    isOpen={isOpen}
                    onOpen={onOpen}
                    onClose={onClose}
                    onOpenChange={onOpenChange}
                  />
                )}
              </div>
              <AnimatePresence>
                {showPhaseList && (
                  <motion.div
                    className="overflow-y-auto max-h-full scrollbar"
                    initial={{ x: 300 }}
                    animate={{ x: 0 }}
                    exit={{ x: 300 }}
                    transition={{ duration: 0.5 }}
                  >
                    <PhaseListComponent />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="z-50 fixed bottom-4 right-4 lg:hidden">
            <Button
              className="bg-blue-500 text-white p-3 rounded-full shadow-lg"
              onPress={() => openSidebarModal()}
            >
              Overview
            </Button>
          </div>
          <Modal
            isOpen={isSidebarModalOpen}
            onOpenChange={onSidebarModalOpenChange}
            size="full"
          >
            <ModalContent>
              <ModalBody className="h-full">
                <GameSidebar />
              </ModalBody>
              <ModalFooter>
                <Button onPress={() => closeSidebarModal()}>Close</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      </Drawer.Root>
    </>
  );
};

export default Game;
