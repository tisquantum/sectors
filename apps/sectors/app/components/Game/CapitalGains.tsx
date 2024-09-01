import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import { CapitalGainsTiers } from "@server/data/constants";
import { calculateNetWorth } from "@server/data/helpers";

const CapitalGains = () => {
  const { currentTurn } = useGame();
  const {
    data: capitalGains,
    isLoading,
    error,
  } = trpc.capitalGains.listCapitalGains.useQuery({
    where: {
      gameTurnId: currentTurn.id,
    },
  });
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error...</div>;
  if (!capitalGains) return null;
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Capital Gains</h1>
      <p className="text-lg">
        Capital Gains is taxation based on your net worth. This tax is paid out
        from your cash on hand.
      </p>
      <div className="flex flex-wrap gap-4">
        {CapitalGainsTiers.map((tier, index) => (
          <div key={index} className="p-4 border rounded-lg shadow-md">
            <div className="font-semibold">
              Min Net Worth: ${tier.minNetWorth}
            </div>
            <div className="font-semibold">
              Max Net Worth: $
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
          const netWorth = calculateNetWorth(
            capitalGain.Player?.cashOnHand || 0,
            capitalGain.Player?.Share || []
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
                    Net Worth: ${netWorth}
                  </div>
                  <div className="text-xl font-semibold">
                    Cash on Hand: ${capitalGain.Player.cashOnHand}
                  </div>
                  <div className="text-xl font-semibold">
                    Tax Tier:{" "}
                    {
                      CapitalGainsTiers.find(
                        (tier) =>
                          netWorth >= tier.minNetWorth &&
                          netWorth <= tier.maxNetWorth
                      )?.taxPercentage
                    }
                    %
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-xl">
                  Capital Gains Payment: ${capitalGain.capitalGains}
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
