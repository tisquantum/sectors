import { trpc } from "@sectors/app/trpc";
import {
  CompanyWithSector,
  InsolvencyContributionWithRelations,
} from "@server/prisma/prisma.types";
import PlayerAvatar from "../Player/PlayerAvatar";
import { RiMoneyDollarBoxFill, RiTicket2Fill } from "@remixicon/react";
import { Button, Input, Progress } from "@nextui-org/react";
import DebounceButton from "../General/DebounceButton";
import { useEffect, useState } from "react";
import { useGame } from "../Game/GameContext";
import { EVENT_NEW_INVOLVENCY_CONTRIBUTION } from "@server/pusher/pusher.types";
import { InsolvencyContribution } from "@server/prisma/prisma.client";
import { CompanyTierData } from "@server/data/constants";
import ShareComponent from "./Share";
import { insolvencyAndBankruptcy } from "../Game/Rules";

const InsolvencyGauge = ({
  insolvencyContributions,
  company,
}: {
  insolvencyContributions: InsolvencyContributionWithRelations[] | undefined;
  company: CompanyWithSector;
}) => {
  const totalCash =
    insolvencyContributions?.reduce(
      (acc, curr) => acc + curr.cashContribution,
      0
    ) || 0;
  const totalShares =
    insolvencyContributions?.reduce(
      (acc, curr) => acc + curr.shareContribution,
      0
    ) || 0;
  const totalShareValue = totalShares * company.currentStockPrice;
  const totalValue = totalCash + totalShareValue;
  return (
    <div className="flex flex-col gap-2">
      <span>
        ${totalValue} of $
        {CompanyTierData[company.companyTier].insolvencyShortFall}
      </span>
      <Progress
        aria-label="Insolvency Contributions"
        size="md"
        value={totalValue}
        color="success"
        className="max-w-md"
      />
    </div>
  );
};

const InsolvencyContributionComponent = ({
  company,
}: {
  company: CompanyWithSector;
}) => {
  const {
    gameId,
    authPlayer,
    currentTurn,
    socketChannel: channel,
    refetchAuthPlayer,
  } = useGame();
  const utils = trpc.useUtils();
  const {
    data: playerWithShares,
    isLoading: isLoadingPlayerWithShares,
    refetch: refetchPlayerWithShares,
  } = trpc.player.playerWithShares.useQuery({
    where: { id: authPlayer.id },
  });
  const {
    data: insolvencyContributions,
    isLoading,
    isError,
  } = trpc.insolvencyContributions.listInsolvencyContributions.useQuery({
    where: { companyId: company.id, gameTurnId: currentTurn.id },
  });
  const useInsolvencyContributionMutation =
    trpc.insolvencyContributions.createInsolvencyContribution.useMutation();
  const [shareContribution, setShareContribution] = useState(0);
  const [cashContribution, setCashContribution] = useState(0);
  useEffect(() => {
    if (!channel) return;
    channel.bind(
      EVENT_NEW_INVOLVENCY_CONTRIBUTION,
      (data: InsolvencyContributionWithRelations) => {
        utils.insolvencyContributions.listInsolvencyContributions.setData(
          { where: { companyId: company.id } },
          (oldData: InsolvencyContributionWithRelations[] | undefined) => [
            ...(oldData || []),
            data,
          ]
        );
        refetchAuthPlayer();
        refetchPlayerWithShares();
      }
    );

    return () => {
      channel.unbind(EVENT_NEW_INVOLVENCY_CONTRIBUTION);
    };
  }, [channel, isLoading]);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading insolvency contributions</div>;
  }

  if (isLoadingPlayerWithShares) {
    return <div>Loading...</div>;
  }
  if (!playerWithShares) {
    return <div>Player not found</div>;
  }
  console.log("insolvency contributions", insolvencyContributions);
  return (
    <div className="flex flex-col justify-center items-center">
      <h2>Insolvency Contributions</h2>
      <InsolvencyGauge
        insolvencyContributions={insolvencyContributions}
        company={company}
      />
      <div className="flex flex-wrap gap-2">
        {!insolvencyContributions?.length ? (
          <div>No insolvency contributions</div>
        ) : (
          insolvencyContributions.map((insolvencyContribution) => (
            <>
              {insolvencyContribution.Player ? (
                <div key={insolvencyContribution.id} className="p-2 rounded">
                  <div>
                    <PlayerAvatar player={insolvencyContribution.Player} />
                  </div>
                  {insolvencyContribution.cashContribution > 0 && (
                    <div className="flex gap-1">
                      <RiMoneyDollarBoxFill /> $
                      {insolvencyContribution.cashContribution}
                    </div>
                  )}
                  {insolvencyContribution.shareContribution > 0 && (
                    <div className="flex gap-1">
                      <RiTicket2Fill />{" "}
                      {insolvencyContribution.shareContribution} shares
                    </div>
                  )}
                </div>
              ) : (
                <div>Player not found</div>
              )}
            </>
          ))
        )}
      </div>
      <div className="flex justify-center items-center flex-col gap-2">
        <h2>Make a Contribution</h2>
        <div className="flex justify-center gap-1">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 flex-wrap">
              {/* Denomination Buttons */}
              {[25, 50, 75, 100, 150, 200, 300, 500].map((amount) =>
                amount > authPlayer.cashOnHand ? null : (
                  <Button
                    key={amount}
                    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                      cashContribution === amount ? "bg-green-700" : ""
                    }`}
                    onClick={() => setCashContribution(amount)}
                    disabled={amount > authPlayer.cashOnHand} // Disable button if the denomination exceeds the player's cash on hand
                  >
                    ${amount}
                  </Button>
                )
              )}

              {/* All in Button */}
              <Button
                className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${
                  cashContribution === authPlayer.cashOnHand ? "bg-red-700" : ""
                }`}
                onClick={() => setCashContribution(authPlayer.cashOnHand)}
              >
                All In ($
                {Math.max(
                  authPlayer.cashOnHand,
                  CompanyTierData[company.companyTier].insolvencyShortFall
                )}
                )
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <ShareComponent
              name={company.stockSymbol}
              quantity={playerWithShares.Share.length}
            />
            <Input
              label="Share Contribution"
              type="number"
              onChange={(e) => {
                setShareContribution(parseInt(e.target.value));
              }}
              value={shareContribution.toString()}
              min={0}
              max={
                company.Share.filter((s) => s.playerId === authPlayer.id).length
              }
            />
          </div>
        </div>
        {/* Submit Button */}
        <DebounceButton
          onClick={() => {
            useInsolvencyContributionMutation.mutate({
              gameId,
              playerId: authPlayer.id,
              companyId: company.id,
              gameTurnId: currentTurn.id,
              cashContribution,
              shareContribution,
            });
            setCashContribution(0);
            setShareContribution(0);
          }}
          disabled={
            cashContribution <= 0 || cashContribution > authPlayer.cashOnHand
          } // Ensure valid contribution
        >
          Submit Contributions
        </DebounceButton>
      </div>
      <div className="text-base space-y-4">{insolvencyAndBankruptcy}</div>
    </div>
  );
};

export default InsolvencyContributionComponent;
