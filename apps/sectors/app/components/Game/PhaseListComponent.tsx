import { PhaseName } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { STOCK_ACTION_SUB_ROUND_MAX } from "@server/data/constants";

const phasesInOrder = [
  PhaseName.INFLUENCE_BID_ACTION,
  PhaseName.INFLUENCE_BID_RESOLVE,
  PhaseName.START_TURN,
  PhaseName.STOCK_MEET,
  PhaseName.STOCK_RESOLVE_LIMIT_ORDER,
  PhaseName.STOCK_ACTION_ORDER,
  PhaseName.STOCK_ACTION_RESULT,
  PhaseName.STOCK_ACTION_REVEAL,
  PhaseName.STOCK_RESOLVE_MARKET_ORDER,
  PhaseName.STOCK_SHORT_ORDER_INTEREST,
  PhaseName.STOCK_ACTION_SHORT_ORDER,
  PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER,
  PhaseName.STOCK_RESOLVE_OPTION_ORDER,
  PhaseName.STOCK_OPEN_LIMIT_ORDERS,
  PhaseName.STOCK_RESULTS_OVERVIEW,
  PhaseName.OPERATING_MEET,
  PhaseName.OPERATING_PRODUCTION,
  PhaseName.OPERATING_PRODUCTION_VOTE,
  PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE,
  PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT,
  PhaseName.OPERATING_ACTION_COMPANY_VOTE,
  PhaseName.OPERATING_ACTION_COMPANY_VOTE_RESULT,
  PhaseName.OPERATING_COMPANY_VOTE_RESOLVE,
  PhaseName.CAPITAL_GAINS,
  PhaseName.DIVESTMENT,
  PhaseName.END_TURN,
];

const StockActionSubRoundIndicator = ({
  current,
  max,
}: {
  current: number;
  max: number;
}) => {
  const circles = [];

  for (let i = 0; i <= max; i++) {
    circles.push(
      <div
        key={i}
        className={`items-center justify-center content-center w-4 h-4 rounded-full mr-1 ${
          i <= current ? "bg-yellow-500" : "bg-slate-400"
        }`}
      ></div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center content-center p-2">
      <span>STOCK ACTION ROUND </span>
      <div className="flex items-center justify-center content-center">
        {circles}
      </div>
    </div>
  );
};

const PhaseListComponent = () => {
  const { currentPhase, gameState, currentTurn } = useGame();
  const currentStockActionSubRound = gameState?.StockRound.find(
    (round) => round.id == currentPhase?.stockRoundId
  )?.stockActionSubRound;
  const maxStockActionSubRound = STOCK_ACTION_SUB_ROUND_MAX;
  const getPhaseBorderColor = (phaseName: PhaseName) => {
    switch (phaseName) {
      case PhaseName.STOCK_ACTION_ORDER:
        return "border-yellow-500";
      case PhaseName.STOCK_ACTION_RESULT:
        return "border-yellow-500";
      default:
        return "border-slate-400";
    }
  };
  let _phasesInOrder = [...phasesInOrder];
  if (currentTurn.turn > 1) {
    _phasesInOrder = phasesInOrder.filter(
      (phase) =>
        phase !== PhaseName.INFLUENCE_BID_ACTION &&
        phase !== PhaseName.INFLUENCE_BID_RESOLVE
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {_phasesInOrder.map((phase) => (
        <div key={phase}>
          {phase === PhaseName.STOCK_ACTION_ORDER && (
            <div
              className={`flex items-center bg-slate-900 p-1 border-3 mb-2 justify-center content-center`}
            >
              <StockActionSubRoundIndicator
                current={currentStockActionSubRound ?? 0}
                max={maxStockActionSubRound}
              />
            </div>
          )}
          <div
            className={`flex items-center p-1 border-3 ${
              phase === currentPhase?.name
                ? "border-pink-500/100"
                : getPhaseBorderColor(phase)
            }`}
          >
            <div>{friendlyPhaseName(phase) || phase}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhaseListComponent;
