import { ButtonGroup, Button as NavButton, Spinner } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { isActivePhase } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { RiClockwiseFill, RiTextWrap } from "@remixicon/react";
import PlayerPriorities from "./PlayerPriorities";
import { trpc } from "@sectors/app/trpc";
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
  const { currentPhase, gameState, authPlayer } = useGame();

  // Get pending orders count for badge
  const { data: playerOrders } =
    trpc.playerOrder.listPlayerOrdersWithCompany.useQuery(
      {
        where: {
          stockRoundId: currentPhase?.stockRoundId,
          playerId: authPlayer?.id,
        },
      },
      {
        enabled: !!currentPhase?.stockRoundId && !!authPlayer?.id,
        // Optimize: Only refetch when needed, cache for 5 seconds
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 5000,
      }
    );

  const pendingOrdersCount = playerOrders?.length || 0;

  const getButtonClass = (view: string) =>
    currentView === view
      ? "bg-blue-500 text-white"
      : "bg-slate-700 text-stone-100";

  const showPassivePhaseAdvance =
    Boolean(currentPhase?.name && !isActivePhase(currentPhase.name));

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-black">
      <div className="flex my-3 justify-center items-center flex-wrap gap-4 px-2 w-full max-w-full text-2xl font-bold">
        {showPassivePhaseAdvance && (
          <div
            className={`flex flex-row items-center justify-center gap-1.5 shrink-0 h-8 min-h-8 max-h-8 rounded-md border border-violet-500/40 bg-violet-950/40 px-2 shadow-[0_0_16px_-4px_rgba(139,92,246,0.4)] transition-opacity duration-200 overflow-hidden ${
              isTimerAtZero ? "opacity-100 z-20" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-live={isTimerAtZero ? "polite" : "off"}
            aria-hidden={!isTimerAtZero}
          >
            <Spinner color="secondary" size="sm" className="scale-75" />
            <span className="text-[9px] font-bold text-violet-200 uppercase tracking-wide leading-none whitespace-nowrap">
              Next phase loading
            </span>
          </div>
        )}
        <ButtonGroup className="flex flex-wrap">
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
      <div className="flex justify-between items-center gap-1 p-2 flex-wrap">
        <PlayerPriorities />
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
          className="border border-zinc-400 bg-zinc-200 font-bold text-zinc-900 px-4 py-2 shadow-lg transition-colors hover:bg-zinc-100"
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
  );
};

export default GameTopBar;
