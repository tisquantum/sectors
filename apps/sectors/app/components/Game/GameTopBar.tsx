import { Button, ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { useGame } from "./GameContext";

const GameTopBar = ({
  gameId,
  handleCurrentView,
}: {
  gameId: string;
  handleCurrentView: (view: string) => void;
}) => {
  const { currentPhase } = useGame();
  console.log('currentPhase', currentPhase);
  return (
    <div className="flex justify-between py-2">
      <ButtonGroup>
        <Button onClick={() => handleCurrentView("action")}>Action</Button>
        <Button onClick={() => handleCurrentView("pending-orders")}>
          Pending Orders
        </Button>
        <Button onClick={() => handleCurrentView("stock-chart")}>
          Stock Chart
        </Button>
        <Button onClick={() => handleCurrentView("company")}>Company</Button>
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
      <GameGeneralInfo gameId={gameId} />
    </div>
  );
};

export default GameTopBar;
