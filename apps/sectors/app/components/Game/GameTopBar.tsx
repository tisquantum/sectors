import { ButtonGroup, Navbar, Spinner, Badge } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { useState } from "react";
import { isActivePhase } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { getPhaseColor } from "@sectors/app/helpers/phaseColors";
import { RiClockwiseFill, RiTextWrap, RiWallet3Fill } from "@remixicon/react";
import PlayerPriorities from "./PlayerPriorities";
import { trpc } from "@sectors/app/trpc";

const PassiveLoading = () => <Spinner color="secondary" />;

const GameTopBar = ({
  handleCurrentView,
  handleTogglePhaseList,
  isTimerAtZero,
}: {
  handleTogglePhaseList: () => void;
  handleCurrentView: (view: string) => void;
  isTimerAtZero?: boolean;
}) => {
  const [currentView, setCurrentView] = useState<string>("action");
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

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    handleCurrentView(view);
  };
  const getButtonClass = (view: string) =>
    currentView === view
      ? "bg-blue-500 text-white"
      : "bg-slate-700 text-stone-100";

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-black">
      <div className="flex my-3 justify-center items-center flex-wrap text-2xl font-bold">
        <ButtonGroup className="flex flex-wrap">
          <Button
            className={getButtonClass("action")}
            onClick={() => handleViewChange("action")}
            size="sm"
            title="Switch to Action view (Press 1)"
          >
            Action
          </Button>
          <Button
            className={getButtonClass("pending")}
            onClick={() => handleViewChange("pending")}
            size="sm"
            title="View pending orders (Press 2)"
          >
            Orders
          </Button>
          <Button
            className={getButtonClass("chart")}
            onClick={() => handleViewChange("chart")}
            size="sm"
            title="View stock chart (Press 3)"
          >
            Chart
          </Button>
          <Button
            className={getButtonClass("markets")}
            onClick={() => handleViewChange("markets")}
            size="sm"
            title="View markets (Press 4)"
          >
            Markets
          </Button>
          <Button
            className={getButtonClass("economy")}
            onClick={() => handleViewChange("economy")}
            size="sm"
            title="View economy (Press 5)"
          >
            Economy
          </Button>
          <Button
            className={getButtonClass("companies")}
            onClick={() => handleViewChange("companies")}
            size="sm"
            title="View operations (Press 6)"
          >
            Operations
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex justify-between items-center gap-1 p-2 flex-wrap">
        <PlayerPriorities />
        {currentPhase?.name && !isActivePhase(currentPhase.name) && (
          <div
            className={`flex flex-col justify-center items-center ${
              isTimerAtZero ? "opacity-100 z-20" : "opacity-0 z-0"
            }`}
          >
            <PassiveLoading />
          </div>
        )}
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
        {(() => {
          const phaseColors = getPhaseColor(currentPhase?.name);
          return (
            <Button
              onClick={handleTogglePhaseList}
              className={`bg-gradient-to-r ${phaseColors.gradient} text-white font-bold px-4 py-2 shadow-lg hover:opacity-90 transition-all`}
              title="Toggle phase list (Press Ctrl+K or Cmd+K)"
            >
              <div className="flex items-center gap-2">
                <RiTextWrap className="text-white" size={20} />
                <span className="text-lg font-extrabold">
                  {friendlyPhaseName(currentPhase?.name)}
                </span>
              </div>
            </Button>
          );
        })()}
      </div>
    </div>
  );
};

export default GameTopBar;
