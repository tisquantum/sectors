import { Button, ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";

const GameTopBar = ({
  handleCurrentView,
}: {
  handleCurrentView: (view: string) => void;
}) => {
  return (
    <div className="flex justify-between">
      <ButtonGroup>
        <Button onClick={() => handleCurrentView('action')}>Action</Button>
        <Button onClick={() => handleCurrentView('pending-orders')}>Pending Orders</Button>
        <Button onClick={() => handleCurrentView('stock-chart')}>Stock Chart</Button>
      </ButtonGroup>
      <GameGeneralInfo />
    </div>
  );
};

export default GameTopBar;
