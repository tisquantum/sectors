import { ButtonGroup, Navbar, Spinner } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { useState } from "react";
import { isActivePhase } from "@server/data/helpers";
import Button from "@sectors/app/components/General/DebounceButton";
import { friendlyPhaseName } from "@sectors/app/helpers";

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
  const { currentPhase } = useGame();

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    handleCurrentView(view);
  };
  const getButtonClass = (view: string) =>
    currentView === view
      ? "bg-blue-500 text-white"
      : "bg-slate-700 text-stone-100";

  return (
    <Navbar height="100%">
      <div className="flex justify-between items-center p-2 flex-wrap">
        <ButtonGroup>
          <Button
            className={getButtonClass("action")}
            onClick={() => handleViewChange("action")}
          >
            Action
          </Button>
          <Button
            className={getButtonClass("pending")}
            onClick={() => handleViewChange("pending")}
          >
            Pending Orders
          </Button>
          <Button
            className={getButtonClass("chart")}
            onClick={() => handleViewChange("chart")}
          >
            Stock Chart
          </Button>
          <Button
            className={getButtonClass("markets")}
            onClick={() => handleViewChange("markets")}
          >
            Markets
          </Button>
          <Button
            className={getButtonClass("economy")}
            onClick={() => handleViewChange("economy")}
          >
            Economy
          </Button>
          <Button
            className={getButtonClass("companies")}
            onClick={() => handleViewChange("companies")}
          >
            Operations
          </Button>
        </ButtonGroup>
        {currentPhase?.name && !isActivePhase(currentPhase.name) && (
          <div
            className={`flex flex-col justify-center items-center ${
              isTimerAtZero ? "opacity-100 z-20" : "opacity-0 z-0"
            }`}
          >
            <PassiveLoading />
          </div>
        )}
        {currentPhase && (
          <Timer
            countdownTime={currentPhase.phaseTime / 1000} //convert from seconds to milliseconds
            startDate={new Date(currentPhase.createdAt)} // attempt to cast to Date
            size={16}
            textSize={1}
            onEnd={() => {}}
          />
        )}
        <Button onClick={handleTogglePhaseList}>
          Phases | {friendlyPhaseName(currentPhase?.name)}
        </Button>
        <GameGeneralInfo />
      </div>
    </Navbar>
  );
};

export default GameTopBar;
