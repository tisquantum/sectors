import { Button, ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";

const GameTopBar = ({
  gameId,
  handleCurrentView,
}: {
  gameId: string;
  handleCurrentView: (view: string) => void;
}) => {
  return (
    <div className="flex justify-between py-2">
      <ButtonGroup>
        <Button onClick={() => handleCurrentView('action')}>Action</Button>
        <Button onClick={() => handleCurrentView('pending-orders')}>Pending Orders</Button>
        <Button onClick={() => handleCurrentView('stock-chart')}>Stock Chart</Button>
        <Button onClick={() => handleCurrentView('company')}>Company</Button>
      </ButtonGroup>
      <Timer countdownTime={100} size={16} textSize={1} onEnd={() =>{}} />
      <GameGeneralInfo gameId={gameId} />
    </div>
  );
};

export default GameTopBar;
