import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import { CapitalGainsTiers } from "@server/data/constants";

const CapitalGains = () => {
  const { gameId, currentTurn } = useGame();
  const {
    data: capitalGains,
    isLoading,
    error,
  } = trpc.capitalGains.listCapitalGains.useQuery(
    {
      where: {
        gameTurnId: currentTurn.id,
      },
    },
    {
      staleTime: Infinity, // Data never goes stale - it's historical turn data
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
    }
  );
  const { data: playersIncome, isLoading: isLoadingPlayersIncome } =
    trpc.game.getTurnIncome.useQuery(
      {
        gameId: gameId,
        gameTurnId: currentTurn.id,
      },
      {
        staleTime: Infinity, // Data never goes stale - it's historical turn data
        refetchOnMount: false, // Don't refetch when component mounts
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnReconnect: false, // Don't refetch on reconnect
      }
    );
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error...</div>;
  if (!capitalGains) return null;
  if (isLoadingPlayersIncome) return <div>Loading players income...</div>;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Capital Gains</h1>
      <p className="text-lg">
        Capital Gains is taxation based on your income per turn. This tax is
        paid out from your cash on hand.
      </p>
      <div className="flex flex-wrap gap-4">
        {CapitalGainsTiers.map((tier, index) => (
          <div key={index} className="p-4 border rounded-lg shadow-md">
            <div className="font-semibold">Min Income: ${tier.minNetWorth}</div>
            <div className="font-semibold">
              Max Income: $
              {tier.maxNetWorth == Number.MAX_SAFE_INTEGER
                ? "∞"
                : tier.maxNetWorth}
            </div>
            <div className="font-semibold">
              Tax Percentage: {tier.taxPercentage}%
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 justify-center items-center">
        {capitalGains.map((capitalGain) => {
          const playerIncome = playersIncome?.find(
            (playerIncome) => playerIncome.playerId === capitalGain.playerId
          );
          return (
            <div
              key={capitalGain.id}
              className="p-4 border rounded-lg shadow-md w-full max-w-xl"
            >
              {capitalGain.Player && (
                <div className="flex items-center gap-4">
                  <PlayerAvatar player={capitalGain.Player} showNameLabel />
                  <div className="text-xl font-semibold">
                    Turn Income: ${playerIncome?.totalIncome}
                  </div>
                  <div className="text-xl font-semibold">
                    Cash on Hand: ${capitalGain.Player.cashOnHand}
                  </div>
                  <div className="text-xl font-semibold">
                    Tax Tier:{" "}
                    {
                      CapitalGainsTiers.find(
                        (tier) =>
                          (playerIncome?.totalIncome || 0) >=
                            tier.minNetWorth &&
                          (playerIncome?.totalIncome || 0) <= tier.maxNetWorth
                      )?.taxPercentage
                    }
                    %
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-xl p-2 bg-slate-500 rounded-md">
                  Capital Gains Payment:{" "}
                  <span className="font-bold">${capitalGain.capitalGains}</span>
                </div>
                <div className="text-lg">
                  Capital Gains Tax Percentage: {capitalGain.taxPercentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CapitalGains;
