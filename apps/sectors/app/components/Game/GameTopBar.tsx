import {
  ButtonGroup,
  Button as NavButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { isActivePhase } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";
import { friendlyPhaseName } from "@sectors/app/helpers";
import {
  RiClockwiseFill,
  RiInformationLine,
  RiTextWrap,
} from "@remixicon/react";
import PlayerPriorities from "./PlayerPriorities";
import {
  GAME_HASH,
  normalizeGameView,
  type GameView,
} from "./gameHashNavigation";

const VIEW_OPTIONS: { id: GameView; label: string }[] = [
  { id: "action", label: "Action" },
  { id: "pending", label: "Orders" },
  { id: "chart", label: "Chart" },
  { id: "companies", label: "Companies" },
  { id: "economy", label: "Economy" },
  { id: "operations", label: "Operations" },
];

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
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const activeView = normalizeGameView(currentView);

  const getButtonClass = (view: string) =>
    activeView === view
      ? "bg-blue-500 text-white"
      : "bg-slate-700 text-stone-100";

  const showPassivePhaseAdvance =
    Boolean(currentPhase?.name && !isActivePhase(currentPhase.name));

  const onViewChange = (view: GameView) => {
    if (typeof window === "undefined") return;
    window.location.hash = view;
  };

  const statusModal = (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[85dvh]",
        body: "py-3",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-zinc-800">
          <span className="text-lg">Game status</span>
          <span className="text-sm font-normal text-zinc-400">
            Phase: {friendlyPhaseName(currentPhase?.name)}
          </span>
        </ModalHeader>
        <ModalBody className="flex min-w-0 flex-col gap-4">
          {showPassivePhaseAdvance && (
            <div
              className={`flex flex-row items-center justify-center gap-2 rounded-md border border-violet-500/40 bg-violet-950/40 px-3 py-2 ${
                isTimerAtZero ? "" : "opacity-40"
              }`}
              aria-hidden={!isTimerAtZero}
            >
              <Spinner color="secondary" size="sm" />
              <span className="text-xs font-semibold uppercase tracking-wide text-violet-200">
                Next phase loading
              </span>
            </div>
          )}
          <PlayerPriorities />
          {currentPhase &&
            currentPhase.phaseStartTime &&
            !gameState.isTimerless && (
              <div className="flex flex-col items-center gap-1 border-t border-zinc-800 pt-3">
                <Timer
                  countdownTime={currentPhase.phaseTime / 1000}
                  startDate={new Date(currentPhase.phaseStartTime)}
                  size={24}
                  textSize={2}
                  onEnd={() => {}}
                />
                <span className="text-xs text-gray-400">Time remaining</span>
              </div>
            )}
          {gameState.isTimerless && (
            <div className="flex items-center justify-center gap-2 border-t border-zinc-800 pt-3 text-sm">
              <RiClockwiseFill className="text-yellow-400" />
              <span>No timer</span>
            </div>
          )}
          <div className="min-w-0 border-t border-zinc-800 pt-2">
            <GameGeneralInfo />
          </div>
          <Button
            onClick={() => {
              handleTogglePhaseList();
              onClose();
            }}
            className="border border-zinc-400 bg-zinc-200 px-4 py-2 font-bold text-zinc-900 shadow-lg transition-colors hover:bg-zinc-100"
            title="Toggle phase list (Press Ctrl+K or Cmd+K)"
          >
            <div className="flex items-center gap-2">
              <RiTextWrap className="text-zinc-900" size={20} />
              <span className="font-extrabold">
                Phase list · {friendlyPhaseName(currentPhase?.name)}
              </span>
            </div>
          </Button>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onClose}
            className="bg-slate-700 text-white"
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <>
      {/* Mobile: compact chrome + full status in a modal; page scrolls away with content */}
      <div className="shrink-0 border-b border-zinc-800 bg-gradient-to-b from-slate-950 to-black 2xl:hidden">
        <div className="flex items-stretch gap-2 pr-14 pl-2 pt-2 pb-2">
          <label className="sr-only" htmlFor="game-view-select">
            Game view
          </label>
          <select
            id="game-view-select"
            className="min-w-0 flex-1 rounded-lg border border-zinc-600 bg-slate-900/90 px-2 py-2.5 text-sm text-zinc-100 shadow-inner outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={activeView}
            onChange={(e) => onViewChange(e.target.value as GameView)}
          >
            {VIEW_OPTIONS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-lg border border-zinc-500 bg-slate-800 px-3 py-2 text-sm font-semibold text-zinc-100 shadow-md transition-colors hover:bg-slate-700"
            title="Player readiness, timer, stats, phase list"
          >
            <span className="flex items-center gap-1.5">
              <RiInformationLine size={18} />
              Status
            </span>
          </Button>
        </div>
        {statusModal}
      </div>

      {/* Desktop / large tablets */}
      <div className="hidden shrink-0 flex-col bg-gradient-to-b from-slate-950 to-black 2xl:flex">
        <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-4 px-2 py-3 text-2xl font-bold">
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
              <span className="text-[9px] font-bold uppercase leading-none tracking-wide whitespace-nowrap text-violet-200">
                Next phase loading
              </span>
            </div>
          )}
          <ButtonGroup className="flex flex-wrap shadow-sm">
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
        <div className="flex w-full flex-col gap-3 p-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
          <div className="min-w-0 w-full sm:w-auto sm:flex-1">
            <PlayerPriorities />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {currentPhase &&
              currentPhase.phaseStartTime &&
              !gameState.isTimerless && (
                <div className="flex flex-col items-center gap-1">
                  <Timer
                    countdownTime={currentPhase.phaseTime / 1000}
                    startDate={new Date(currentPhase.phaseStartTime)}
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
    </>
  );
};

export default GameTopBar;
