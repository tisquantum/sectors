import { Button, ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";

const GameTopBar = ({
  gameId,
  handleCurrentView,
}: {
  gameId: string;
  handleCurrentView: (view: string) => void;
}) => {
  return (
    <div className="flex justify-between">
      <ButtonGroup>
        <Button onClick={() => handleCurrentView('action')}>Action</Button>
        <Button onClick={() => handleCurrentView('pending-orders')}>Pending Orders</Button>
        <Button onClick={() => handleCurrentView('stock-chart')}>Stock Chart</Button>
        <Button onClick={() => handleCurrentView('company')}>Company</Button>
      </ButtonGroup>
      <GameGeneralInfo gameId={gameId} />
    </div>
  );
};

export default GameTopBar;
