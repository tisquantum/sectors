import { ButtonGroup, Button as NavButton, Spinner } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { isActivePhase } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { RiClockwiseFill, RiTextWrap } from "@remixicon/react";
import PlayerPriorities from "./PlayerPriorities";
import { GAME_HASH } from "./gameHashNavigation";

const GameTopBar = ({
  currentView,
  handleTogglePhaseList,
  isTimerAtZero,
}: {
  currentView: string;
  handleTogglePhaseList: () => void;
  isTimerAtZero?: boolean;
}) => {
  const { currentPhase, gameState } = useGame();

  const getButtonClass = (view: string) =>
    currentView === view
      ? "bg-blue-500 text-white"
      : "bg-slate-700 text-stone-100";

  const showPassivePhaseAdvance =
    Boolean(currentPhase?.name && !isActivePhase(currentPhase.name));

  return (
    <div className="flex shrink-0 flex-col bg-gradient-to-b from-slate-950 to-black">
      <div className="flex w-full min-w-0 items-start gap-2 px-2 py-2 sm:my-3 sm:items-center">
        {showPassivePhaseAdvance && (
          <div
            className={`flex h-8 min-h-8 max-h-8 shrink-0 flex-row items-center justify-center gap-1.5 overflow-hidden rounded-md border border-violet-500/40 bg-violet-950/40 px-2 shadow-[0_0_16px_-4px_rgba(139,92,246,0.4)] transition-opacity duration-200 ${
              isTimerAtZero
                ? "z-20 opacity-100"
                : "pointer-events-none z-0 opacity-0"
            }`}
            aria-live={isTimerAtZero ? "polite" : "off"}
            aria-hidden={!isTimerAtZero}
          >
            <Spinner color="secondary" size="sm" className="scale-75" />
            <span className="text-[9px] font-bold uppercase leading-none tracking-wide text-violet-200 whitespace-nowrap">
              Next phase loading
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1 touch-pan-x overflow-x-auto scrollbar">
          <ButtonGroup className="inline-flex flex-nowrap shadow-sm">
            <NavButton
              as="a"
              href={GAME_HASH.action}
              className={getButtonClass("action")}
              size="sm"
              title="Switch to Action view (Press 1)"
            >
              Action
            </NavButton>
            <NavButton
              as="a"
              href={GAME_HASH.pending}
              className={getButtonClass("pending")}
              size="sm"
              title="View pending orders (Press 2)"
            >
              Orders
            </NavButton>
            <NavButton
              as="a"
              href={GAME_HASH.chart}
              className={getButtonClass("chart")}
              size="sm"
              title="View stock chart (Press 3)"
            >
              Chart
            </NavButton>
            <NavButton
              as="a"
              href={GAME_HASH.companies}
              className={getButtonClass("companies")}
              size="sm"
              title="View companies (Press 4)"
            >
              Companies
            </NavButton>
            <NavButton
              as="a"
              href={GAME_HASH.economy}
              className={getButtonClass("economy")}
              size="sm"
              title="View economy (Press 5)"
            >
              Economy
            </NavButton>
            <NavButton
              as="a"
              href={GAME_HASH.operations}
              className={getButtonClass("operations")}
              size="sm"
              title="View operations (Press 6)"
            >
              Operations
            </NavButton>
          </ButtonGroup>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 p-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
        <div className="min-w-0 w-full sm:flex-1 sm:w-auto">
          <PlayerPriorities />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {currentPhase &&
            currentPhase.phaseStartTime &&
            !gameState.isTimerless && (
              <div className="flex flex-col items-center gap-1">
                <Timer
                  countdownTime={currentPhase.phaseTime / 1000} //convert from seconds to milliseconds
                  startDate={new Date(currentPhase.phaseStartTime)} // attempt to cast to Date
                  size={24}
                  textSize={2}
                  onEnd={() => {}}
                />
                <span className="text-xs text-gray-400">Time Remaining</span>
              </div>
            )}
          {gameState.isTimerless && (
            <div className="flex flex-col items-center">
              <RiClockwiseFill className="text-yellow-400" />
              <span>No Timer</span>
            </div>
          )}
          <GameGeneralInfo />
          <Button
            onClick={handleTogglePhaseList}
            className="border border-zinc-400 bg-zinc-200 px-4 py-2 font-bold text-zinc-900 shadow-lg transition-colors hover:bg-zinc-100 sm:shrink-0"
            title="Toggle phase list (Press Ctrl+K or Cmd+K)"
          >
            <div className="flex items-center gap-2">
              <RiTextWrap className="text-zinc-900" size={20} />
              <span className="font-extrabold">
                {friendlyPhaseName(currentPhase?.name)}
              </span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameTopBar;
