import { trpc } from "@sectors/app/trpc";
import {
  CompanyWithSector,
  InsolvencyContributionWithRelations,
} from "@server/prisma/prisma.types";
import PlayerAvatar from "../Player/PlayerAvatar";
import { RiMoneyDollarBoxFill, RiTicket2Fill } from "@remixicon/react";
import { Input, Progress } from "@nextui-org/react";
import DebounceButton from "../General/DebounceButton";
import { useEffect, useState } from "react";
import { useGame } from "../Game/GameContext";
import { EVENT_NEW_INVOLVENCY_CONTRIBUTION } from "@server/pusher/pusher.types";
import { InsolvencyContribution } from "@server/prisma/prisma.client";

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
    <Progress
      aria-label="Insolvency Contributions"
      size="md"
      value={totalValue}
      color="success"
      showValueLabel={true}
      className="max-w-md"
    />
  );
};

const InsolvencyContributionComponent = ({
  company,
}: {
  company: CompanyWithSector;
}) => {
  const { gameId, authPlayer, currentTurn, socketChannel: channel } = useGame();
  const utils = trpc.useUtils();
  const {
    data: insolvencyContributions,
    isLoading,
    isError,
  } = trpc.insolvencyContributions.listInsolvencyContributions.useQuery({
    where: { companyId: company.id },
  });
  const useInsolvencyContributionMutation =
    trpc.insolvencyContributions.createInsolvencyContribution.useMutation();
  const [shareContribution, setShareContribution] = useState(0);
  const [cashContribution, setCashContribution] = useState(0);
  const [isShareContributionSubmitted, setIsShareContributionSubmitted] =
    useState(false);
  const [isCashContributionSubmitted, setIsCashContributionSubmitted] =
    useState(false);
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

  return (
    <div className="flex flex-col">
      <h2>Insolvency Contributions</h2>
      <div>
        <p>
          Players can make cash or share contributions to help the company avoid
          bankruptcy. All contributions are handed over to the company for
          liquidity. All shares handed over are traded in at market rates which
          will drop the share price by the equivalent of shares sold after the
          contributions are concluded. All profits generated from these sales
          are given to the company.
        </p>
        <p>
          In order for the company to become active again, the sum of all this
          liquidity must be greater or equal to the company tiers shortfall.
        </p>
        <p>
          Should the company fail to meet it's shortfall, the company will be
          liquidated the next turn if it cannot pay its debts. All players with
          shares in the company will receive 20% of the market value from these
          shares should the company go bankrupt. The company will no longer be
          traded on the stock market and be removed from any considerations made
          in the stock sector.
        </p>
        <p>
          During insolvency contributions, contributions are public the moment
          they are made.
        </p>
      </div>
      <InsolvencyGauge
        insolvencyContributions={insolvencyContributions}
        company={company}
      />
      <div className="flex flex-wrap gap-2">
        {!insolvencyContributions?.length ? (
          <div>No insolvency contributions</div>
        ) : (
          insolvencyContributions.map((insolvencyContribution) => (
            <div
              key={insolvencyContribution.id}
              className="p-2 bg-gray-100 rounded"
            >
              <div>
                <PlayerAvatar player={insolvencyContribution.Player} />
              </div>
              <div className="flex gap-1">
                <RiMoneyDollarBoxFill /> $
                {insolvencyContribution.cashContribution}
              </div>
              <div className="flex gap-1">
                <RiTicket2Fill /> {insolvencyContribution.shareContribution}{" "}
                shares
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <h2>Make a Contribution</h2>
        <div className="flex gap-1">
          {isShareContributionSubmitted ? (
            <div>Cash Contribution Submitted</div>
          ) : (
            <>
              <Input
                label="Cash Contribution"
                type="number"
                onChange={(e) => {
                  setCashContribution(parseInt(e.target.value));
                }}
                value={cashContribution.toString()}
                min={0}
                max={authPlayer.cashOnHand}
              />
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
                  setIsCashContributionSubmitted(true);
                }}
              >
                Submit Cash Contribution
              </DebounceButton>
            </>
          )}
        </div>
        <div className="flex gap-1">
          {isCashContributionSubmitted ? (
            <div>Share Contribution Submitted</div>
          ) : (
            <>
              <Input
                label="Share Contribution"
                type="number"
                onChange={(e) => {
                  setShareContribution(parseInt(e.target.value));
                }}
                value={shareContribution.toString()}
                min={0}
                max={
                  company.Share.filter((s) => s.playerId === authPlayer.id)
                    .length
                }
              />
              <DebounceButton
                onClick={() => {
                  useInsolvencyContributionMutation.mutate({
                    gameId: gameId,
                    playerId: authPlayer.id,
                    companyId: company.id,
                    gameTurnId: currentTurn.id,
                    cashContribution,
                    shareContribution,
                  });
                  setIsShareContributionSubmitted(true);
                }}
              >
                Submit Share Contribution
              </DebounceButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsolvencyContributionComponent;
