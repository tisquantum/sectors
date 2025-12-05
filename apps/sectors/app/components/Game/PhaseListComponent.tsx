import { PhaseName } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { getPhaseColor } from "@sectors/app/helpers/phaseColors";
import { phasesInOrder } from "@server/data/constants";
import _ from "lodash";

const PhaseListComponent = () => {
  const { currentPhase, gameState, currentTurn } = useGame();
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
          {(() => {
            const phaseColors = getPhaseColor(phase);
            const isCurrentPhase = phase === currentPhase?.name;
            return (
              <div
                className={`flex items-center p-1 border-3 ${
                  isCurrentPhase
                    ? `border-pink-500 bg-pink-500/20 ${phaseColors.bg}/20`
                    : `${phaseColors.border} ${phaseColors.bg}/10`
                }`}
              >
                <div className={isCurrentPhase ? phaseColors.text : "text-gray-300"}>
                  {friendlyPhaseName(phase) || phase}
                  {/* Removed sub-round display - stock rounds no longer use sub-rounds */}
                </div>
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
};

export default PhaseListComponent;
