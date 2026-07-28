"use client";

import {
  CompanyStatus,
  OperationMechanicsVersion,
  PhaseName,
  RoundType,
} from "@server/prisma/prisma.client";
import type { GameState } from "@server/prisma/prisma.types";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { useGame } from "../GameContext";

import Meeting from "../../Meeting/Meeting";
import StartTurnUpdates from "../StartTurnUpdates";
import GamePlayersRecap from "../GamePlayerRecap";
import Headlines from "../Headlines";
import PrizeRound from "../PrizeVote";
import DistributePrizes from "../DistributePrize";
import PendingOrders from "../PendingOrders";
import StockRoundResults from "../StockRoundResults";
import PlayerCurrentQueuedOrders from "../../Player/PlayerCurrentQueuedOrders";
import ExerciseOptionOrders from "../ExerciseOptionOrders";
import CoverShortOrders from "../CoverShortOrders";
import OperatingRoundProduction from "../OperatingRoundProduction";
import OperatingRoundRevenueVote from "../OperatingRoundRevenueVote";
import OperatingRoundRevenueVoteResolve from "../OperatingRoundRevenueVoteResolve";
import OperatingRoundStockPriceAdjustment from "../OperatingRoundStockPriceAdjustment";
import { OperatingRoundRevenueVoteV2 } from "../OperatingRoundRevenueV2";
import CompanyActionSlider from "../../Company/CompanyActionSelectionVote";
import CompanyVoteResolve from "../../Company/CompanyVoteResolve";
import CapitalGains from "../CapitalGains";
import Divestment from "../Divestment";
import EndTurnEconomy from "../EndTurnEconomy";
import InfluenceBid from "../InfluenceBid";
import { EarningsCall } from "../EarningsCall";
import FactoryConstructionPhase from "../FactoryConstructionPhase";
import { ResolveFactoryConstructionPhase } from "../../Factory/ResolveFactoryConstruction";
import MarketingAndResearchAction from "../MarketingAndResearchAction";
import MarketingAndResearchActionResolve from "../MarketingAndResearchActionResolve";
import {
  EarningsCallPhase as ModernEarningsCallPhase,
  MarketingAndResearchPhase as ModernMarketingAndResearchPhase,
  MarketingAndResearchResolvePhase as ModernMarketingAndResearchResolvePhase,
  ModernOperationsResolve as ModernOperationsResolvePhase,
  RustedFactoryUpgradePhase,
} from "../ModernOperations/phases";
import { BoardOperationsGuide } from "./BoardOperationsGuide";
import { BoardConsumptionRecap } from "./BoardConsumptionRecap";
import { BoardRevenueRecap } from "./BoardCompanyRevenue";
import InsolvencyContributionComponent from "../../Company/InsolvencyContribution";
import ForecastPhase from "../ForecastPhase";
import ForecastResolve from "../ForecastResolve";

/** The round object backing the current phase, if the phase belongs to one. */
function currentRoundExists(game: GameState): boolean {
  const phase = game.Phase.find((p) => p.id === game.currentPhaseId);
  if (!phase) return false;
  if (game.currentRound === RoundType.OPERATING) {
    return game.OperatingRound.some((r) => r.id === game.currentOperatingRoundId);
  }
  if (game.currentRound === RoundType.STOCK) {
    return game.StockRound.some((r) => r.id === game.currentStockRoundId);
  }
  if (game.currentRound === RoundType.INFLUENCE) {
    return !!game.InfluenceRound?.[0];
  }
  return true;
}

/**
 * Orders are placed on the company tiles themselves, so the phase panel only
 * needs to show what is already queued.
 */
function StockOrderQueue() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-zinc-400">
        Place orders straight from the company tiles on the board — press
        <span className="mx-1 rounded bg-amber-500/90 px-1 text-[10px] font-bold uppercase text-amber-950">
          IPO
        </span>
        or
        <span className="mx-1 rounded bg-sky-500/90 px-1 text-[10px] font-bold uppercase text-sky-950">
          Trade
        </span>
        on any company. You may place several orders, but you cannot buy and sell
        the same company in one round.
      </p>
      <PlayerCurrentQueuedOrders newOrderCount={0} />
    </div>
  );
}

function InsolvencyResolution() {
  const { gameState } = useGame();
  const insolvent = gameState.Company.filter(
    (company) => company.status === CompanyStatus.INSOLVENT
  );
  if (insolvent.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400">
        Every company is solvent.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {insolvent.map((company) => (
        <div key={company.id} className="rounded-lg border border-zinc-800 p-4">
          <InsolvencyContributionComponent company={company as never} />
        </div>
      ))}
    </div>
  );
}

/**
 * Renders whatever the current phase asks the table to do. Extracted from the
 * old tabbed shell so the board can present it in a contextual panel.
 */
export function BoardPhaseAction() {
  const { gameState, currentPhase } = useGame();
  const phaseName =
    gameState.Phase.find((phase) => phase.id === gameState.currentPhaseId)?.name ??
    currentPhase?.name;
  const isModern =
    gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN;

  if (!phaseName || !currentRoundExists(gameState)) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-1 text-center">
        <span className="text-sm font-semibold">Preparing the next phase</span>
        <span className="text-xs text-zinc-500">
          {friendlyPhaseName(phaseName)}
        </span>
      </div>
    );
  }

  switch (phaseName) {
    case PhaseName.STOCK_MEET:
      return <Meeting />;
    case PhaseName.START_TURN:
      return (
        <div className="flex w-full flex-col items-center gap-3">
          <StartTurnUpdates />
          <h3 className="text-lg">Players overview</h3>
          <GamePlayersRecap />
        </div>
      );
    case PhaseName.HEADLINE_RESOLVE:
      return <Headlines />;
    case PhaseName.PRIZE_VOTE_ACTION:
      return <PrizeRound />;
    case PhaseName.PRIZE_VOTE_RESOLVE:
      return <PrizeRound isRevealRound />;
    case PhaseName.PRIZE_DISTRIBUTE_ACTION:
    case PhaseName.PRIZE_DISTRIBUTE_RESOLVE:
      return <DistributePrizes />;
    case PhaseName.STOCK_RESOLVE_LIMIT_ORDER:
      return <PendingOrders />;
    case PhaseName.STOCK_ACTION_ORDER:
    case PhaseName.STOCK_ACTION_RESULT:
      return <StockOrderQueue />;
    case PhaseName.STOCK_ACTION_REVEAL:
    case PhaseName.STOCK_RESOLVE_MARKET_ORDER:
    case PhaseName.STOCK_SHORT_ORDER_INTEREST:
    case PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER:
    case PhaseName.STOCK_RESOLVE_OPTION_ORDER:
    case PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER:
    case PhaseName.STOCK_OPEN_LIMIT_ORDERS:
      return <PendingOrders isResolving />;
    case PhaseName.STOCK_ACTION_OPTION_ORDER:
      return <ExerciseOptionOrders />;
    case PhaseName.STOCK_ACTION_SHORT_ORDER:
      return <CoverShortOrders />;
    case PhaseName.STOCK_RESULTS_OVERVIEW:
      return <StockRoundResults />;
    case PhaseName.OPERATING_PRODUCTION:
      return isModern ? <BoardRevenueRecap /> : <OperatingRoundProduction />;
    case PhaseName.OPERATING_PRODUCTION_VOTE:
      return isModern ? (
        <OperatingRoundRevenueVoteV2 />
      ) : (
        <OperatingRoundRevenueVote />
      );
    case PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE:
      return isModern ? (
        <BoardRevenueRecap />
      ) : (
        <OperatingRoundRevenueVoteResolve />
      );
    case PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT:
      return <OperatingRoundStockPriceAdjustment />;
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE:
      return <CompanyActionSlider />;
    case PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT:
      return <CompanyActionSlider withResult />;
    case PhaseName.OPERATING_COMPANY_VOTE_RESOLVE:
      return (
        <div className="flex w-full flex-col gap-3">
          <CompanyActionSlider withResult />
          <CompanyVoteResolve />
        </div>
      );
    case PhaseName.CAPITAL_GAINS:
      return <CapitalGains />;
    case PhaseName.DIVESTMENT:
      return <Divestment />;
    case PhaseName.END_TURN:
      return <EndTurnEconomy />;
    case PhaseName.INFLUENCE_BID_ACTION:
      return <InfluenceBid />;
    case PhaseName.INFLUENCE_BID_RESOLVE:
      return <InfluenceBid isRevealRound />;
    // Consumption is read on the board itself: each sector shows its bag, its
    // shoppers and its waiting area, and factory tiles fill as they are served.
    case PhaseName.CONSUMPTION_PHASE:
      return <BoardConsumptionRecap />;
    case PhaseName.EARNINGS_CALL:
      return isModern ? <ModernEarningsCallPhase /> : <EarningsCall />;
    case PhaseName.FACTORY_CONSTRUCTION:
      return isModern ? (
        <ModernMarketingAndResearchPhase />
      ) : (
        <FactoryConstructionPhase />
      );
    case PhaseName.FACTORY_CONSTRUCTION_RESOLVE:
      return isModern ? (
        <ModernMarketingAndResearchResolvePhase />
      ) : (
        <ResolveFactoryConstructionPhase />
      );
    case PhaseName.MARKETING_AND_RESEARCH_ACTION:
      return isModern ? (
        <ModernMarketingAndResearchPhase />
      ) : (
        <MarketingAndResearchAction />
      );
    case PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE:
      return isModern ? (
        <ModernMarketingAndResearchResolvePhase />
      ) : (
        <MarketingAndResearchActionResolve />
      );
    case PhaseName.MODERN_OPERATIONS:
      // Building, marketing and research all happen on the board itself, so the
      // panel is reference only.
      return <BoardOperationsGuide />;
    case PhaseName.RESOLVE_MODERN_OPERATIONS:
      return <ModernOperationsResolvePhase />;
    case PhaseName.RUSTED_FACTORY_UPGRADE:
      return <RustedFactoryUpgradePhase />;
    case PhaseName.RESOLVE_INSOLVENCY:
      return <InsolvencyResolution />;
    case PhaseName.FORECAST_COMMITMENT_START_TURN:
    case PhaseName.FORECAST_COMMITMENT_END_TURN:
      return <ForecastPhase />;
    case PhaseName.FORECAST_RESOLVE:
      return <ForecastResolve />;
    default:
      return (
        <div className="flex min-h-[20vh] flex-col items-center justify-center gap-1 text-center">
          <span className="text-sm font-semibold">
            {friendlyPhaseName(phaseName)}
          </span>
          <span className="text-xs text-zinc-500">
            This phase resolves without input.
          </span>
        </div>
      );
  }
}
