"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GameSidebar from "./GameSidebar";
import GameTopBar from "./GameTopBar";
import { MarketsView } from "./MarketsView";
import { OperationsView } from "./OperationsView";
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
  OperationMechanicsVersion,
} from "@server/prisma/prisma.client";
import Meeting from "../Meeting/Meeting";
import {
  GameState,
  InfluenceRoundWithVotes,
} from "@server/prisma/prisma.types";
import { useGame } from "./GameContext";
import StockRoundAction from "./StockRoundAction";
import StockRoundOrderGrid from "./StockRoundOrderGrid";
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
import { useKeyboardShortcuts } from "@sectors/app/hooks/useKeyboardShortcuts";
import PrizeRound from "./PrizeVote";
import DistributePrizes from "./DistributePrize";
import StartTurnUpdates from "./StartTurnUpdates";
import GamePlayersRecap from "./GamePlayerRecap";
import { toast } from "sonner";
import { friendlyPhaseName } from "@sectors/app/helpers";
import Headlines from "./Headlines";
import IpoVotes from "./IpoVote";
import { ConsumptionPhase } from "./ConsumptionPhase";
import { OperatingRoundRevenueVoteV2, OperatingRoundRevenueVoteResolveV2 } from "./OperatingRoundRevenueV2";
import FactoryConstructionPhase from "./FactoryConstructionPhase";
import { ResolveFactoryConstructionPhase } from "../Factory/ResolveFactoryConstruction";
import MarketingAndResearchAction from "./MarketingAndResearchAction";
import MarketingAndResearchActionResolve from "./MarketingAndResearchActionResolve";
import { EarningsCall } from "./EarningsCall";
import {
  ConsumptionPhase as ModernConsumptionPhase,
  FactoryConstructionPhase as ModernFactoryConstructionPhase,
  FactoryConstructionResolvePhase as ModernFactoryConstructionResolvePhase,
  EarningsCallPhase as ModernEarningsCallPhase,
  MarketingAndResearchPhase as ModernMarketingAndResearchPhase,
  MarketingAndResearchResolvePhase as ModernMarketingAndResearchResolvePhase,
  ModernOperations as ModernOperationsPhase,
  ModernOperationsResolve as ModernOperationsResolvePhase,
  RustedFactoryUpgradePhase,
} from "./ModernOperations/phases";
import InsolvencyContributionComponent from "../Company/InsolvencyContribution";
import { CompanyStatus } from "@server/prisma/prisma.client";

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
  
  // Phase transition tracking
  const previousPhaseRef = useRef<PhaseName | undefined>(undefined);
  
  // Track renders and view changes
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current % 10 === 0) {
    console.log(`[Game] Render count: ${renderCountRef.current}, currentView: ${currentView}`);
  }
  
  // Track view changes
  const viewChangeCountRef = useRef(0);
  useEffect(() => {
    viewChangeCountRef.current += 1;
    console.log(`[Game] View changed to: ${currentView} (change #${viewChangeCountRef.current})`);
  }, [currentView]);
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
  // Track phase changes for transitions
  useEffect(() => {
    if (currentPhase?.name && currentPhase.name !== previousPhaseRef.current) {
      // Phase changed - show toast notification
      if (previousPhaseRef.current) {
        toast.success(`Phase transition: ${friendlyPhaseName(currentPhase.name)}`, {
          duration: 2000,
        });
      }
      previousPhaseRef.current = currentPhase.name;
    }
  }, [currentPhase?.name]);

  // Calculate time remaining for timer
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
  }, [currentPhase?.name, currentPhase?.phaseStartTime, currentPhase?.phaseTime]);
  const handleCurrentView = (view: string) => {
    console.log(`[Game] handleCurrentView called with: ${view}`);
    setCurrentView(view);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: () => {
      if (drawerIsOpen) {
        closeDrawer();
      }
      if (isSidebarModalOpen) {
        closeSidebarModal();
      }
    },
    onViewChange: handleCurrentView,
    onTogglePhaseList: () => setShowPhaseList((prev) => !prev),
    enabled: true,
  });
  const currentRoundData = determineGameRound(gameState);
  const renderCurrentPhase =
    currentRoundData?.phase.name === PhaseName.STOCK_MEET ? (
      <Meeting />
    ) : currentRoundData?.phase.name === PhaseName.START_TURN ? (
      <div className="flex flex-col items-center justify-between h-full w-full gap-2">
        <StartTurnUpdates />
        {/* <Headlines /> */}
        <div className="flex flex-col gap-2 items-center">
          <h2 className="text-xl">Players Overview</h2>
          <GamePlayersRecap />
        </div>
      </div>
    ) : currentRoundData?.phase.name === PhaseName.HEADLINE_RESOLVE ? (
      <Headlines />
    ) : currentRoundData?.phase.name === PhaseName.SET_COMPANY_IPO_PRICES ? (
      <IpoVotes isInteractive />
    ) : currentRoundData?.phase.name === PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES ? (
      <IpoVotes />
    ) :
    currentRoundData?.phase.name === PhaseName.PRIZE_VOTE_ACTION ? (
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
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <OperatingRoundRevenueVoteV2 />
      ) : (
        <OperatingRoundRevenueVote />
      )
    ) : currentRoundData?.phase.name ===
      PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT ? (
      <OperatingRoundStockPriceAdjustment />
    ) : currentRoundData?.phase.name ===
      PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE ? (
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <OperatingRoundRevenueVoteResolveV2 />
      ) : (
        <OperatingRoundRevenueVoteResolve />
      )
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
    ) : currentRoundData?.phase.name === PhaseName.CONSUMPTION_PHASE ? (
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <ModernConsumptionPhase />
      ) : (
        <ConsumptionPhase />
      )
    ) : currentRoundData?.phase.name === PhaseName.EARNINGS_CALL ? (
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <ModernEarningsCallPhase />
      ) : (
        <EarningsCall />
      )
    ) : currentRoundData?.phase.name === PhaseName.FACTORY_CONSTRUCTION ? (
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <ModernMarketingAndResearchPhase /> // Use combined phase for modern operations
      ) : (
        <FactoryConstructionPhase />
      )
    ) : currentRoundData?.phase.name === PhaseName.FACTORY_CONSTRUCTION_RESOLVE ? (
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <ModernMarketingAndResearchResolvePhase /> // Use combined resolve for modern operations
      ) : (
        <ResolveFactoryConstructionPhase />
      )
    ) : currentRoundData?.phase.name === PhaseName.MARKETING_AND_RESEARCH_ACTION ? (
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <ModernMarketingAndResearchPhase /> // Combined: Factory + Marketing + Research
      ) : (
        <MarketingAndResearchAction />
      )
    ) : currentRoundData?.phase.name === PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE ? (
      gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
        <ModernMarketingAndResearchResolvePhase /> // Combined resolve
      ) : (
        <MarketingAndResearchActionResolve />
      )
    ) : currentRoundData?.phase.name === PhaseName.MODERN_OPERATIONS ? (
      // New combined phase: Factory Construction + Marketing + Research
      <ModernOperationsPhase />
    ) : currentRoundData?.phase.name === PhaseName.RESOLVE_MODERN_OPERATIONS ? (
      // New combined resolve phase
      <ModernOperationsResolvePhase />
    ) : currentRoundData?.phase.name === PhaseName.RUSTED_FACTORY_UPGRADE ? (
      // Rusted factory upgrade phase
      <RustedFactoryUpgradePhase />
    ) : currentRoundData?.phase.name === PhaseName.RESOLVE_INSOLVENCY ? (
      <div className="flex flex-col gap-4 p-4 w-full">
        <h2 className="text-2xl font-bold">Resolve Insolvency</h2>
        {gameState.Company.filter(c => c.status === CompanyStatus.INSOLVENT).length === 0 ? (
          <div className="text-center p-4">
            <p>No insolvent companies found. All companies are solvent.</p>
          </div>
        ) : (
          gameState.Company.filter(c => c.status === CompanyStatus.INSOLVENT).map((company) => (
            <div key={company.id} className="border rounded-lg p-4">
              <InsolvencyContributionComponent company={company as any} />
            </div>
          ))
        )}
      </div>
    )
    : null;

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
                <AnimatePresence mode="wait">
                  {currentView === "action" && renderCurrentPhase && (
                    <motion.div
                      key={`action-${currentRoundData?.phase.name || 'default'}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      {renderCurrentPhase}
                    </motion.div>
                  )}
                  {currentView === "chart" && (
                    <motion.div
                      key="chart"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      <StockChart />
                    </motion.div>
                  )}
                  {currentView === "pending" && (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      <PendingOrders />
                    </motion.div>
                  )}
                  {currentView == "economy" && (
                    <motion.div
                      key="economy"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      <EndTurnEconomy />
                    </motion.div>
                  )}
                  {currentView == "markets" && (
                    <motion.div
                      key="markets"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      <MarketsView />
                    </motion.div>
                  )}
                  {currentView == "companies" && (
                    <motion.div
                      key="companies"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      <OperationsView />
                    </motion.div>
                  )}
                </AnimatePresence>
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
