import { Button, ButtonGroup } from "@nextui-org/react";
import GameGeneralInfo from "./GameGeneralInfo";
import Timer from "./Timer";
import { notFound } from "next/navigation";
import { trpc } from "@sectors/app/trpc";

const GameTopBar = ({
  gameId,
  handleCurrentView,
}: {
  gameId: string;
  handleCurrentView: (view: string) => void;
}) => {
  const { data: gameData, isLoading } = trpc.game.getGame.useQuery({ id: gameId });
  const { data: phaseData, isLoading: phaseIsLoading } = trpc.phase.getPhase.useQuery({ where: { id: gameData?.currentPhaseId ?? '' } });
  if(isLoading) return <div>Loading...</div>;
  if(gameData === undefined) return notFound();
  return (
    <div className="flex justify-between py-2">
      <ButtonGroup>
        <Button onClick={() => handleCurrentView('action')}>Action</Button>
        <Button onClick={() => handleCurrentView('pending-orders')}>Pending Orders</Button>
        <Button onClick={() => handleCurrentView('stock-chart')}>Stock Chart</Button>
        <Button onClick={() => handleCurrentView('company')}>Company</Button>
      </ButtonGroup>
      {phaseData &&
      <Timer countdownTime={phaseData.phaseTime} startDate={phaseData.createdAt} size={16} textSize={1} onEnd={() =>{}} />
      }
      <GameGeneralInfo gameId={gameId} />
    </div>
  );
};

export default GameTopBar;
