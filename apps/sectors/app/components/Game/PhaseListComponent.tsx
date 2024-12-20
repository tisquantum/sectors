import { PhaseName } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { phasesInOrder } from "@server/data/constants";
import _ from "lodash";

const PhaseListComponent = () => {
  const { currentPhase, gameState, currentTurn } = useGame();
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
  if (currentTurn.turn % 3 !== 0) {
    _phasesInOrder = _phasesInOrder.filter(
      (phase) =>
        phase !== PhaseName.PRIZE_VOTE_ACTION &&
        phase !== PhaseName.PRIZE_VOTE_RESOLVE &&
        phase !== PhaseName.PRIZE_DISTRIBUTE_ACTION &&
        phase !== PhaseName.PRIZE_DISTRIBUTE_RESOLVE
    );
  }
  if (!gameState.useLimitOrders) {
    _phasesInOrder = _phasesInOrder.filter(
      (phase) =>
        phase !== PhaseName.STOCK_OPEN_LIMIT_ORDERS &&
        phase !== PhaseName.STOCK_RESOLVE_LIMIT_ORDER
    );
  }
  if (!gameState.useOptionOrders) {
    _phasesInOrder = _phasesInOrder.filter(
      (phase) =>
        phase !== PhaseName.STOCK_ACTION_OPTION_ORDER &&
        phase !== PhaseName.STOCK_RESOLVE_OPTION_ORDER &&
        phase !== PhaseName.STOCK_RESOLVE_PENDING_OPTION_ORDER
    );
  }
  if (!gameState.useShortOrders) {
    _phasesInOrder = _phasesInOrder.filter(
      (phase) =>
        phase !== PhaseName.STOCK_ACTION_SHORT_ORDER &&
        phase !== PhaseName.STOCK_SHORT_ORDER_INTEREST &&
        phase !== PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER
    );
  }
  return (
    <div className="flex flex-col gap-2 max-w-[150px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[450px]">
      {_phasesInOrder.map((phase) => (
        <div key={phase}>
          <div
            className={`flex items-center p-1 border-3 ${
              phase === currentPhase?.name
                ? "border-pink-500/100"
                : getPhaseBorderColor(phase)
            }`}
          >
            <div>
              {friendlyPhaseName(phase) || phase}{" "}
              {phase == PhaseName.STOCK_ACTION_ORDER &&
                currentPhase?.StockSubRound?.roundNumber &&
                `(${currentPhase?.StockSubRound?.roundNumber})`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhaseListComponent;
