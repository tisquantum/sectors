import { Button, ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { useState } from "react";

const GameTopBar = ({
  gameId,
  handleCurrentView,
}: {
  gameId: string;
  handleCurrentView: (view: string) => void;
}) => {
  const [currentView, setCurrentView] = useState<string>("action");
  const { currentPhase } = useGame();
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    handleCurrentView(view);
  };
  const getButtonClass = (view: string) =>
    currentView === view ? "bg-blue-500 text-white" : "bg-slate-700 text-stone-100";
  console.log('currentPhase', currentPhase);
  return (
    <div className="flex justify-between p-2">
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
          className={getButtonClass("company")}
          onClick={() => handleViewChange("company")}
        >
          Company
        </Button>
      </ButtonGroup>
      {currentPhase && (
        <Timer
          countdownTime={currentPhase.phaseTime / 1000} //convert from seconds to milliseconds
          startDate={new Date(currentPhase.createdAt)} // attempt to cast to Date
          size={16}
          textSize={1}
          onEnd={() => {}}
        />
      )}
      <GameGeneralInfo />
    </div>
  );
};

export default GameTopBar;
