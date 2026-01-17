import { friendlyDistributionStrategyName } from "@sectors/app/helpers";
import { notFound } from "next/navigation";
import React from "react";
import { useGame } from "./GameContext";
import { DEFAULT_WORKERS } from "@server/data/constants";
import {
  RiFunctionAddFill,
  RiTeamFill,
  RiBankFill,
  RiTicket2Fill,
  RiDiscountPercentFill,
  RiScalesFill,
  RiDiscFill,
  RiListOrdered2,
  RiCurrencyFill,
  RiTextWrap,
  RiUserFill,
} from "@remixicon/react";
import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  DistributionStrategy,
  EntityType,
  OrderType,
  PhaseName,
  OperationMechanicsVersion,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { MoneyTransactionByEntityType } from "./MoneyTransactionHistory";
import WalletInfo from "./WalletInfo";
import { MAX_SHARE_PERCENTAGE } from "@server/data/constants";
import PlayerShares from "../Player/PlayerShares";
import { calculateNetWorth } from "@server/data/helpers";
import SymbolLegend from "./SymbolLegend";

const BankInfo = () => {
  const { gameState, gameId } = useGame();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <>
      <div className="flex gap-1 items-center cursor-pointer" onClick={onOpen}>
        <RiBankFill className="text-red-400" size={18} /> $
        {gameState.bankPoolNumber}
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="dark bg-slate-900 text-foreground"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Wallet Transaction History
              </ModalHeader>
              <ModalBody className="overflow-auto">
                <MoneyTransactionByEntityType
                  entityType={EntityType.BANK}
                  gameId={gameId}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

const GameGeneralInfo = () => {
  const {
    gameState,
    currentTurn,
    authPlayer,
    currentPhase,
    playersWithShares,
  } = useGame();
  if (!gameState) return notFound();
  // Calculate net cash impact: (buy costs) - (sell profits)
  // Positive = net spending needed, Negative = net profit
  // Sell orders add money (reduce needed cash), buy orders cost money (increase needed cash)
  const marketOrders = authPlayer?.PlayerOrder?.filter(
    (order) =>
      order.stockSubRoundId === currentPhase?.stockSubRoundId &&
      order.orderType == OrderType.MARKET
  ) || [];
  
  // Calculate net cash impact: (buy costs) - (sell profits)
  // order.value should already contain the correct price (IPO or market price)
  const pseudoSpend = marketOrders.reduce((acc, order) => {
    const price = order.value ?? 0;
    const orderValue = price * (order.quantity || 0);
    // Sells add money (negative impact on needed cash), buys cost money (positive impact)
    return order.isSell ? acc - orderValue : acc + orderValue;
  }, 0);
  const authPlayerWithShares = playersWithShares.find(
    (player) => player.id === authPlayer?.id
  );
  return (
    <div className="flex flex-wrap space-x-4 items-center">
      <div className="flex flex-wrap items-center gap-2">
        {authPlayer ? (
          <>
            <PlayerAvatar player={authPlayer} />
            <div className="flex flex-col gap-1">
              <div className="flex gap-1 items-center text-md font-bold">
                <WalletInfo player={authPlayer} />{" "}
                {(currentPhase?.name === PhaseName.STOCK_ACTION_ORDER ||
                  currentPhase?.name === PhaseName.STOCK_ACTION_RESULT) && (
                  <Tooltip
                    classNames={{ base: baseToolTipStyle }}
                    className={tooltipStyle}
                    content={
                      <p className={tooltipParagraphStyle}>
                        Net cash impact of your orders: buy costs minus sell profits.
                        Positive = net spending needed, Negative = net profit from sells.
                        Sell orders are resolved first, so money from selling can be used for subsequent buy orders.
                      </p>
                    }
                  >
                    {"($" + pseudoSpend + ")"}
                  </Tooltip>
                )}
                {authPlayerWithShares && (
                  <div className="flex gap-1 items-center content-center">
                    <RiScalesFill className="h-5 w-5" /> $
                    {calculateNetWorth(
                      authPlayerWithShares.cashOnHand,
                      authPlayerWithShares.Share
                    )}
                  </div>
                )}
              </div>
              {authPlayerWithShares && (
                <div className="flex gap-1 items-center">
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center gap-1 cursor-pointer">
                        <RiTicket2Fill size={18} />
                        {authPlayerWithShares?.Share.length || 0}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="flex">
                        <PlayerShares playerWithShares={authPlayerWithShares} />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <span className="flex items-center content-center">
                    <RiCurrencyFill className="h-6 w-6" /> $
                    {calculateNetWorth(0, authPlayerWithShares.Share)}
                  </span>
                </div>
              )}
            </div>
            <Tooltip
              classNames={{ base: baseToolTipStyle }}
              className={tooltipStyle}
              content={
                <p className={tooltipParagraphStyle}>
                  The remaining actions you have for order types in a stock
                  round. Limit Order and Short Order actions only replenish as
                  existing orders are filled or rejected. Market Orders
                  replenish each stock round.
                </p>
              }
            >
              <div className="flex items-center text-md">
                {(gameState?.useLimitOrders ||
                  gameState?.useShortOrders ||
                  gameState?.useOptionOrders) && (
                  <RiFunctionAddFill size={24} />
                )}
                {gameState?.useLimitOrders && (
                  <>LO {authPlayer.limitOrderActions}</>
                )}
                {gameState?.useShortOrders && (
                  <> SO {authPlayer.shortOrderActions} </>
                )}
              </div>
            </Tooltip>
          </>
        ) : (
          <div className="flex justify-center items-center ">
            <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-lg tracking-wide">
              SPECTATOR MODE
            </span>
          </div>
        )}
      </div>
      <div>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <div>
              <p className={tooltipParagraphStyle}>The global consumer pool.</p>
              {gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN && (
                <p className={tooltipParagraphStyle}>
                  Workers remaining: Available workers for factories, marketing, and research.
                </p>
              )}
            </div>
          }
        >
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <RiTeamFill className="text-yellow-400" size={18} />
              {gameState.consumerPoolNumber}
            </div>
            {gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <RiUserFill className="text-green-400" size={14} />
                {/* If workforcePool is 0, default to DEFAULT_WORKERS (40) for new games */}
                {gameState.workforcePool > 0 ? gameState.workforcePool : DEFAULT_WORKERS}
              </div>
            )}
          </div>
        </Tooltip>
      </div>
      <div>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              The bank pool. Once the bank pool is exhausted, the game ends.
            </p>
          }
        >
          <BankInfo />
        </Tooltip>
      </div>
      <div className="flex flex-col gap-1 items-start">
        <div>
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>
                The share limit. If a player exceeds this limit, they must
                divest down to the limit.
              </p>
            }
          >
            <div className="flex gap-1 items-center">
              <RiTicket2Fill size={18} /> {gameState.certificateLimit}
            </div>
          </Tooltip>
        </div>
        <div>
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>
                The company ownership limit percentage. A player may never own
                more shares than this percentage of a company unless they
                incidentally fall above this percentage due to company share
                issues or share buybacks.
              </p>
            }
          >
            <div className="flex gap-1 items-center">
              <RiDiscountPercentFill size={18} /> {MAX_SHARE_PERCENTAGE}
            </div>
          </Tooltip>
        </div>
      </div>
      <div>
        <div className="text-lg font-bold">Round</div>
        <div>{gameState.currentRound ?? "0"}</div>
      </div>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            The current turn out of the maximum turns in the game. The game ends
            in one of two ways, either the bank pool is exhausted or the maximum
            turns are reached.
          </p>
        }
      >
        <div className="flex flex-col items-center">
          <div className="text-lg font-bold">
            <RiListOrdered2 className="text-green-400" />
          </div>
          <div>
            {currentTurn.turn ?? "0"} of {gameState.gameMaxTurns}
          </div>
        </div>
      </Tooltip>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          gameState.distributionStrategy ==
          DistributionStrategy.BID_PRIORITY ? (
            <p className={tooltipParagraphStyle}>
              Bids are placed in priority according to the highest ask price of
              the market order. This ask price is quoted per share. If there are
              not enough shares to resolve the order, it is rejected.
              <br />
              If shares are still contested (ie: a tie-breaker for players who
              purchase the same amount of shares), they are resolved by priority
              where the player with the lowest player priority takes precedence.
            </p>
          ) : gameState.distributionStrategy ==
            DistributionStrategy.PRIORITY ? (
            <p className={tooltipParagraphStyle}>
              Orders are filled in player priority. If there are not enough
              shares to resolve the order, the order is rejected.
            </p>
          ) : (
            <p className={tooltipParagraphStyle}>
              When there is not enough shares to distribute, orders are split
              evenly amongst the remaining orders. Any remaining shares are
              distributed on a lottery to a random player who has placed an
              order for this company in that stock round.
            </p>
          )
        }
      >
        <div className="flex flex-col items-center">
          <div className="text-lg font-bold">
            <RiDiscFill className="text-blue-400" />
          </div>
          <div>
            {friendlyDistributionStrategyName(gameState.distributionStrategy)}
          </div>
        </div>
      </Tooltip>
      <Popover>
        <PopoverTrigger>
          <Button>Icon Legend</Button>
        </PopoverTrigger>
        <PopoverContent>
          <SymbolLegend />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GameGeneralInfo;
