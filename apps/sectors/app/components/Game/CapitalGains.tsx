import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";

const CapitalGains = () => {
  const { currentTurn } = useGame();
  const { data: capitalGains, isLoading, error } =
    trpc.capitalGains.listCapitalGains.useQuery({
      where: {
        gameTurnId: currentTurn.id,
      },
    });
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error...</div>;
  if (!capitalGains) return null;
  return <div>
    <h1 className="text-2xl">Capital Gains</h1>
    <div className="flex flex-col gap-2">
        {capitalGains.map((capitalGain) => (
        <div key={capitalGain.id} className="flex gap-2">
            <PlayerAvatar player={capitalGain.Player} showNameLabel/>
            <div>Capital Gains Payment: {capitalGain.capitalGains}</div>
            <div>Capital Gains Tax Percentage: {capitalGain.taxPercentage}</div>
        </div>
        ))}
    </div>
  </div>;
};

export default CapitalGains;
