import { Button, ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";
import { useState } from "react";
import { trpc } from "@sectors/app/trpc";
import { PhaseName, RoundType } from "@server/prisma/prisma.client";
import { determineNextGamePhase } from "@server/data/helpers";

const GameTopBar = ({
  gameId,
  handleCurrentView,
}: {
  gameId: string;
  handleCurrentView: (view: string) => void;
}) => {
  const [currentView, setCurrentView] = useState<string>("action");
  const useNextPhaseMutation = trpc.game.forceNextPhase.useMutation();
  const { currentPhase } = useGame();
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    handleCurrentView(view);
  };
  const getButtonClass = (view: string) =>
    currentView === view
      ? "bg-blue-500 text-white"
      : "bg-slate-700 text-stone-100";
  console.log("currentPhase", currentPhase);
  const handleNextPhase = () => {
    const nextPhase = determineNextGamePhase(
      currentPhase?.name ?? PhaseName.STOCK_MEET
    );
    useNextPhaseMutation.mutate({
      gameId,
      phaseName: nextPhase.phaseName,
      roundType: nextPhase.roundType,
      stockRoundId: currentPhase?.stockRoundId ?? 0,
    });
  };
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
      <Button onClick={handleNextPhase}>Next Phase</Button>
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
