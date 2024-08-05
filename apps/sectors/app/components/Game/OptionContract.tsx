import { OptionContractWithRelations } from "@server/prisma/prisma.types";
import DebounceButton from "../General/DebounceButton";
import CompanyInfo from "../Company/CompanyInfo";
import { trpc } from "@sectors/app/trpc";
import {
  RiArrowUpCircleFill,
  RiCalendar2Fill,
  RiCalendarEventLine,
  RiCalendarScheduleFill,
  RiPriceTag2Fill,
  RiStrikethrough,
} from "@remixicon/react";
import { Input, Tooltip } from "@nextui-org/react";
import ShareComponent from "../Company/Share";
import { ArrowUpCircleIcon } from "@heroicons/react/24/solid";
import { useGame } from "./GameContext";
import {
  ContractState,
  DistributionStrategy,
  OrderStatus,
  OrderType,
  PhaseName,
  ShareLocation,
} from "@server/prisma/prisma.client";
import { set } from "lodash";
import { useState } from "react";
import PlayerAvatar from "../Player/PlayerAvatar";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";

const OptionContract = ({
  contract,
  isInteractive,
  isExercisableByAuth,
}: {
  contract: OptionContractWithRelations;
  isInteractive?: boolean;
  isExercisableByAuth?: boolean;
}) => {
  const { gameId, gameState, authPlayer, currentPhase } = useGame();
  const { data: company, isLoading } =
    trpc.company.getCompanyWithSector.useQuery({ id: contract.companyId });
  const useCreatePlayerOrderMutation =
    trpc.playerOrder.createPlayerOrder.useMutation();
  const useExerciseContract =
    trpc.optionContract.exerciseOptionContract.useMutation();
  const { data: pendingOrders, isLoading: pendingOrdersLoading } =
    trpc.playerOrder.listPlayerOrdersWithPlayerRevealed.useQuery({
      where: {
        gameId: gameState.id,
        orderStatus: OrderStatus.PENDING,
        stockRoundId: currentPhase?.stockRoundId,
        orderType: OrderType.OPTION,
        companyId: contract.companyId,
        optionContractId: contract.id,
      },
      gameId,
    });
  const { data: playerOrderPurchased, isLoading: playerOrderPurchasedLoading } =
    trpc.player.getPlayer.useQuery(
      {
        where: {
          id: contract.PlayerOrders.filter(
            (order) => order.orderStatus == OrderStatus.OPEN
          )?.[0]?.playerId,
        },
      },
      {
        enabled: contract.contractState == ContractState.PURCHASED,
      }
    );
  const [bidAmount, setBidAmount] = useState<string>(
    contract.premium.toString()
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExercised, setIsExercised] = useState(false);
  if (isLoading) return <div>Loading...</div>;
  if (!company) return <div>No company found</div>;
  return (
    <div className="bg-black p-4 rounded-lg shadow-lg flex items-center gap-4 border-4 border-blue-500 relative">
      {contract.contractState === "FOR_SALE" && (
        <div className="absolute top-0 right-0 m-2 bg-red-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
          <span>For Sale</span>
        </div>
      )}
      {(contract.contractState === ContractState.FOR_SALE ||
        contract.contractState === ContractState.QUEUED) && (
        <span className="text-2xl">{contract.tableauSlot}</span>
      )}
      <div className="flex-1">
        <div className="text-xl font-bold">
          <CompanyInfo company={company} isMinimal />
        </div>
        <div className="border-b border-gray-200 my-2"></div>
        <div className="flex gap-3 text-gray-200 justify-between text-xl">
          <Tooltip
            className={tooltipStyle}
            content={<p>Premium: The price of the options contract.</p>}
          >
            <div className="flex gap-1 justify-center items-center">
              <RiPriceTag2Fill /> ${contract.premium}
            </div>
          </Tooltip>
          <Tooltip
            className={tooltipStyle}
            content={
              <p>
                Strike Price: The price at which the options contract can be
                exercised
              </p>
            }
          >
            <div className="flex gap-1 justify-center items-center">
              <RiStrikethrough />${contract.strikePrice}
            </div>
          </Tooltip>
          <Tooltip
            className={tooltipStyle}
            content={
              <p>Term: The number of turns the options contract is valid for</p>
            }
          >
            <div className="flex gap-1 justify-center items-center">
              <RiCalendarScheduleFill />
              {contract.term}
            </div>
          </Tooltip>
          {contract.currentTerm > 0 && (
            <Tooltip
              className={tooltipStyle}
              content={
                <p>
                  Current Term: The number of turns the options contract has
                  been active for
                </p>
              }
            >
              <div className="flex gap-1 justify-center items-center">
                <RiCalendar2Fill />
                {contract.currentTerm}
              </div>
            </Tooltip>
          )}
          <Tooltip
            className={tooltipStyle}
            content={
              <p>
                Step Bonus: The amount the stock price will increase should the
                option be exercised.
              </p>
            }
          >
            <div className="flex gap-1 justify-center items-center">
              <RiArrowUpCircleFill /> {contract.stepBonus}
            </div>
          </Tooltip>
          <Tooltip
            className={tooltipStyle}
            content={
              <p>
                Shares: The number of shares the option contract represents.
                Note that shares in the derivative market have no impact on the
                calculations made for spot market.
              </p>
            }
          >
            <div>
              <ShareComponent
                name={contract.Company.stockSymbol}
                quantity={contract.shareCount}
              />
            </div>
          </Tooltip>
        </div>
      </div>
      <div>
        {isInteractive &&
          (!isSubmitted ? (
            <div className="flex flex-col gap-2">
              {gameState.distributionStrategy ==
                DistributionStrategy.BID_PRIORITY && (
                <Input
                  type="number"
                  placeholder="Enter bid amount"
                  label="Bid"
                  min={contract.premium}
                  max={authPlayer.cashOnHand}
                  value={bidAmount}
                  onChange={(e) => {
                    setBidAmount(e.target.value);
                  }}
                />
              )}
              <DebounceButton
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={() => {
                  useCreatePlayerOrderMutation.mutate({
                    companyId: contract.companyId,
                    orderType: OrderType.OPTION,
                    quantity: contract.shareCount,
                    gameId: gameState.id,
                    value: parseInt(bidAmount),
                    stockRoundId: gameState.currentStockRoundId || 0,
                    playerId: authPlayer.id,
                    location: ShareLocation.DERIVATIVE_MARKET,
                    sectorId: company.sectorId,
                    phaseId: currentPhase?.id || "",
                    contractId: contract.id,
                  });
                  setIsSubmitted(true);
                }}
              >
                Purchase Call
              </DebounceButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2">Submitted</div>
          ))}
      </div>
      {currentPhase?.name != PhaseName.STOCK_ACTION_ORDER &&
        currentPhase?.name != PhaseName.STOCK_ACTION_RESULT &&
        contract.contractState == ContractState.FOR_SALE && (
          <div className="flex flex-col gap-2">
            <div className="text-xl font-bold">Pending Orders</div>
            <div className="flex gap-2 justify-center items-center">
              {pendingOrders?.map((playerOrder) => (
                <div key={playerOrder.id}>
                  <PlayerAvatar player={playerOrder.Player} />
                  <span>BID @ ${playerOrder.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      {isExercisableByAuth && (
        <div className="flex flex-col gap-2">
          {isExercised ? (
            <div>Option Exercised</div>
          ) : (
            <DebounceButton
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              onClick={() => {
                useExerciseContract.mutate({ contractId: contract.id, gameId });
                setIsExercised(true);
              }}
            >
              Exercise Option
            </DebounceButton>
          )}
        </div>
      )}
      {contract.contractState == ContractState.PURCHASED &&
        playerOrderPurchased && <PlayerAvatar player={playerOrderPurchased} />}
    </div>
  );
};

export default OptionContract;
