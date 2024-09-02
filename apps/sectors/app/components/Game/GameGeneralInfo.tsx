import { friendlyDistributionStrategyName } from "@sectors/app/helpers";
import { notFound } from "next/navigation";
import React from "react";
import { useGame } from "./GameContext";
import {
  RiFunctionAddFill,
  RiTeamFill,
  RiBankFill,
  RiTicket2Fill,
  RiDiscountPercentFill,
} from "@remixicon/react";
import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  DistributionStrategy,
  EntityType,
  OrderType,
  PhaseName,
} from "@server/prisma/prisma.client";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { MoneyTransactionByEntityType } from "./MoneyTransactionHistory";
import WalletInfo from "./WalletInfo";
import { MAX_SHARE_PERCENTAGE } from "@server/data/constants";

const BankInfo = () => {
  const { gameState, gameId } = useGame();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <>
      <div className="flex gap-1 items-center cursor-pointer" onClick={onOpen}>
        <RiBankFill size={18} /> ${gameState.bankPoolNumber}
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="h-full">
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
  const { gameState, currentTurn, authPlayer, currentPhase } = useGame();
  if (!gameState) return notFound();
  const pseudoSpend = authPlayer.PlayerOrder?.filter(
    (order) =>
      order.stockRoundId === gameState.currentStockRoundId &&
      order.orderType == OrderType.MARKET
  ).reduce((acc, order) => {
    const orderValue = (order.value || 0) * (order.quantity || 0);
    return order.isSell ? acc - orderValue : acc + orderValue;
  }, 0);
  return (
    <div className="flex space-x-4 items-center">
      <div className="flex items-center gap-2">
        <PlayerAvatar player={authPlayer} />
        <div className="flex flex-col">
          <div className="flex items-center text-md font-bold">
            <WalletInfo player={authPlayer} />{" "}
            {(currentPhase?.name == PhaseName.STOCK_ACTION_ORDER ||
              currentPhase?.name == PhaseName.STOCK_ACTION_RESULT) && (
              <Tooltip
                classNames={{ base: baseToolTipStyle }}
                className={tooltipStyle}
                content={
                  <div>
                    <p className={tooltipParagraphStyle}>
                      The potential maximum amount of money you&apos;ve queued
                      for orders this stock round.
                    </p>
                  </div>
                }
              >
                {"($" + pseudoSpend + ")"}
              </Tooltip>
            )}
          </div>
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <div>
                <p className={tooltipParagraphStyle}>
                  The remaining actions you have for order types in a stock
                  round. Limit Order and Short Order actions only replenish as
                  existing orders are filled or rejected. Market Orders
                  replenish each stock round.
                </p>
              </div>
            }
          >
            <div className="flex items-center text-md">
              <RiFunctionAddFill size={24} /> LO {authPlayer.limitOrderActions}{" "}
              SO {authPlayer.shortOrderActions}
            </div>
          </Tooltip>
        </div>
      </div>
      <div>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>The global consumer pool.</p>
          }
        >
          <div className="flex items-center gap-2">
            <RiTeamFill size={18} />
            {gameState.consumerPoolNumber}
          </div>
        </Tooltip>
      </div>
      <div>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <div>
              <p className={tooltipParagraphStyle}>
                The bank pool. Once the bank pool is exhausted, the game ends.
              </p>
            </div>
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
              <div>
                <p className={tooltipParagraphStyle}>
                  The share limit. If a player exceeds this limit, they must
                  divest down to the limit.
                </p>
              </div>
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
              <div>
                <p className={tooltipParagraphStyle}>
                  The company ownership limit percentage. A player may never own
                  more shares than this percentage of a company unless they
                  incidentally fall above this percentage due to company share
                  issues or share buybacks.
                </p>
              </div>
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
          <div>
            <p className={tooltipParagraphStyle}>
              The current turn out of the maximum turns in the game. The game
              ends in one of two ways, either the bank pool is exhausted or the
              maximum turns are reached.
            </p>
          </div>
        }
      >
        <div>
          <div className="text-lg font-bold">Turn</div>
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
              <p>
                Bids are placed in priority according to the highest ask price
                of the market order. This ask price is quoted per share. If
                there are not enough shares to resolve the order, it is
                rejected.
              </p>
              <p>
                If shares are still contested (ie: a tie-breaker for players who
                purchase the same amount of shares), they are resolved by
                priority where the player with the lowest player priority takes
                precedence.
              </p>
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
        <div>
          <div className="text-lg font-bold">Distribution</div>
          <div>
            {friendlyDistributionStrategyName(gameState.distributionStrategy)}
          </div>
        </div>
      </Tooltip>
    </div>
  );
};

export default GameGeneralInfo;
