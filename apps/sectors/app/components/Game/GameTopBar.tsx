import { ButtonGroup, Navbar, Spinner } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { useState } from "react";
import { isActivePhase } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";
import { friendlyPhaseName } from "@sectors/app/helpers";
import { RiClockwiseFill, RiTextWrap } from "@remixicon/react";
import PlayerPriorities from "./PlayerPriorities";

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
  const { currentPhase, gameState } = useGame();

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
          >
            Action
          </Button>
          <Button
            className={getButtonClass("pending")}
            onClick={() => handleViewChange("pending")}
            size="sm"
          >
            Orders
          </Button>
          <Button
            className={getButtonClass("chart")}
            onClick={() => handleViewChange("chart")}
            size="sm"
          >
            Chart
          </Button>
          <Button
            className={getButtonClass("markets")}
            onClick={() => handleViewChange("markets")}
            size="sm"
          >
            Markets
          </Button>
          <Button
            className={getButtonClass("economy")}
            onClick={() => handleViewChange("economy")}
            size="sm"
          >
            Economy
          </Button>
          <Button
            className={getButtonClass("companies")}
            onClick={() => handleViewChange("companies")}
            size="sm"
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
            <Timer
              countdownTime={currentPhase.phaseTime / 1000} //convert from seconds to milliseconds
              startDate={new Date(currentPhase.phaseStartTime)} // attempt to cast to Date
              size={16}
              textSize={1}
              onEnd={() => {}}
            />
          )}
        {gameState.isTimerless && (
          <div className="flex flex-col items-center">
            <RiClockwiseFill className="text-yellow-400" />
            <span>No Timer</span>
          </div>
        )}
        <GameGeneralInfo />
        <Button onClick={handleTogglePhaseList}>
          <div className="flex items-center gap-1">
            <RiTextWrap className="text-yellow-400" />
            {friendlyPhaseName(currentPhase?.name)}
          </div>
        </Button>
      </div>
    </div>
  );
};

export default GameTopBar;
