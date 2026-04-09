import { PhaseName } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import {
  friendlyPhaseName,
  phaseTooltipDescription,
} from "@sectors/app/helpers";
import { phasesInOrder } from "@server/data/constants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";

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
      {_phasesInOrder.map((phase) => {
        const isCurrentPhase = phase === currentPhase?.name;
        return (
          <Popover key={phase} placement="left" offset={10}>
            <PopoverTrigger>
              <button
                type="button"
                className={
                  isCurrentPhase
                    ? "flex w-full items-center rounded-md border-2 border-zinc-100 bg-zinc-100 px-2 py-1.5 text-left text-sm font-semibold text-zinc-950 shadow-md cursor-pointer"
                    : "flex w-full items-center rounded-md border border-zinc-600/70 bg-zinc-950/50 px-2 py-1.5 text-left text-sm text-zinc-200 cursor-pointer hover:bg-zinc-900/80"
                }
                aria-current={isCurrentPhase ? "step" : undefined}
                aria-label={`${friendlyPhaseName(phase) || phase}: show phase description`}
              >
                {friendlyPhaseName(phase) || phase}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(100vw-1rem,22rem)] border border-zinc-600 bg-slate-900 p-3 text-sm text-zinc-100 shadow-xl">
              <p className="m-0 max-w-[24rem] leading-snug text-zinc-200">
                {phaseTooltipDescription(phase)}
              </p>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
};

export default PhaseListComponent;
