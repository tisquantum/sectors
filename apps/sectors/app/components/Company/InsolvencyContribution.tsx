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
import {
  BANKRUPTCY_SHARE_PERCENTAGE_RETAINED,
  CompanyTierData,
} from "@server/data/constants";
import ShareComponent from "./Share";

const insolvencyAndBankruptcy = (
  <>
    <h3 className="font-semibold">Insolvency and Bankruptcy</h3>
    <h4 className="font-semibold">Insolvency Contributions</h4>
    <p>
      Should the company fall to 0 dollars due to company actions or operational
      fees, the company will become INSOLVENT. The next time that company would
      operate, instead of the typical ACTIVE operating round actions, the
      company enters an INSOLVENCY action phase. All shareholders of the company
      can then contribute <strong>cash</strong> or <strong>shares</strong> to
      help the company avoid bankruptcy.
    </p>
    <ul className="list-disc pl-5">
      <li>
        All cash contributions are immediately given directly to the company
        treasury. All share contributions are immediately sold, and the cash
        profit is transferred to the company treasury.
      </li>
      <li>
        Shares handed over are sold at market rates. The share price of the
        company will move share price steps down equal to the net negative of
        all shares sold <strong>after</strong> the contribution action phase is
        completed. Therefore, every share sold during the insolvency phase will
        be equivalent to the share price of the company entering that phase.
      </li>
    </ul>
    <h4 className="font-semibold">Reactivating the Company</h4>
    <p>
      For the company to become <strong>active</strong> again, the total
      liquidity generated from contributions must meet or exceed the
      company&apos;s <strong>shortfall</strong> cash value for its tier.
    </p>
    <h4 className="font-semibold">Transparency of Contributions</h4>
    <p>
      All contributions made during insolvency are <strong>public</strong> and
      take effect <strong>immediately</strong> as soon as they are made.
    </p>
    <h4 className="font-semibold">
      If the Company Fails to Meet Its Shortfall
    </h4>
    <ul className="list-disc pl-5">
      <li>
        Following the opportunity for insolvency actions, the company will{" "}
        <strong>permanently close</strong> if it cannot meet or exceed its
        shortfall cash value.
        <ul className="list-disc pl-5">
          <li>
            Players holding shares will receive{" "}
            <strong>{BANKRUPTCY_SHARE_PERCENTAGE_RETAINED}%</strong> of the
            market value for their shares.
          </li>
          <li>
            The company will be <strong>delisted</strong> from the stock market.
          </li>
          <li>The company will no longer be able to perform actions.</li>
          <li>
            The company will be removed from any considerations made in the
            stock sector.
          </li>
        </ul>
      </li>
    </ul>
  </>
);

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
        maxValue={CompanyTierData[company.companyTier].insolvencyShortFall}
        color="success"
        className="max-w-md"
        label="Shortfall Progress"
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
    refetchPlayersWithShares,
  } = useGame();
  const [isLoadingInsolvencyContribution, setIsLoadingInsolvencyContribution] =
    useState(false);
  const {
    data: playerWithShares,
    isLoading: isLoadingPlayerWithShares,
    refetch: refetchPlayerWithShares,
  } = trpc.player.playerWithShares.useQuery({
    where: { id: authPlayer?.id },
  });
  const {
    data: insolvencyContributions,
    isLoading,
    isError,
    refetch: refetchInsolvencyContributions,
  } = trpc.insolvencyContributions.listInsolvencyContributions.useQuery({
    where: { companyId: company.id, gameTurnId: currentTurn.id },
  });
  const useInsolvencyContributionMutation =
    trpc.insolvencyContributions.createInsolvencyContribution.useMutation({
      onSettled: () => {
        setIsLoadingInsolvencyContribution(false);
      },
    });
  const [shareContribution, setShareContribution] = useState(0);
  const [cashContribution, setCashContribution] = useState(0);
  useEffect(() => {
    if (!channel) return;

    channel.bind(
      EVENT_NEW_INVOLVENCY_CONTRIBUTION,
      (data: InsolvencyContributionWithRelations) => {
        refetchInsolvencyContributions();
        refetchAuthPlayer();
        refetchPlayerWithShares();
        refetchPlayersWithShares();
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
      {authPlayer && (
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
                    cashContribution === authPlayer.cashOnHand
                      ? "bg-red-700"
                      : ""
                  }`}
                  onClick={() => setCashContribution(authPlayer.cashOnHand)}
                >
                  All In ($
                  {Math.min(
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
                quantity={
                  playerWithShares.Share.filter(
                    (share) => share.companyId === company.id
                  ).length
                }
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
                  company.Share.filter((s) => s.playerId === authPlayer.id)
                    .length
                }
              />
            </div>
          </div>
          {/* Submit Button */}
          <DebounceButton
            onClick={() => {
              setIsLoadingInsolvencyContribution(true);
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
            isLoading={isLoadingInsolvencyContribution}
          >
            Submit Contributions
          </DebounceButton>
        </div>
      )}
      <div className="text-base space-y-4">{insolvencyAndBankruptcy}</div>
    </div>
  );
};

export default InsolvencyContributionComponent;
