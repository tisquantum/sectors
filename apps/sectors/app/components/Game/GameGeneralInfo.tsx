import { friendlyPhaseName } from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { notFound } from "next/navigation";
import React from "react";
import { useGame } from "./GameContext";
import {
  CircleStackIcon,
  CurrencyDollarIcon,
  SquaresPlusIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import {
  RiWalletFill,
  RiFunctionAddFill,
  RiTeamFill,
  RiBankFill,
  RiTicket2Fill,
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
import { EntityType, OrderType, PhaseName } from "@server/prisma/prisma.client";
import { DEFAULT_SHARE_LIMIT } from "@server/data/constants";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";
import {
  MoneyTransactionByEntityType,
  MoneyTransactionHistoryByPlayer,
} from "./MoneyTransactionHistory";
import WalletInfo from "./WalletInfo";

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
                className={tooltipStyle}
                content={
                  <p>
                    The potential maximum amount of money you&apos;ve queued for
                    orders this stock round.
                  </p>
                }
              >
                {"($" + pseudoSpend + ")"}
              </Tooltip>
            )}
          </div>
          <Tooltip
            className={tooltipStyle}
            content={
              <p>
                The remaining actions you have for order types in a stock round.
                Limit Order and Short Order actions only replenish as existing
                orders are filled or rejected. Market Orders replenish each
                stock round.
              </p>
            }
          >
            <div className="flex items-center text-md">
              <RiFunctionAddFill size={24} /> LO {authPlayer.limitOrderActions}{" "}
              MO {authPlayer.marketOrderActions} SO{" "}
              {authPlayer.shortOrderActions}
            </div>
          </Tooltip>
        </div>
      </div>
      <div>
        <Tooltip
          className={tooltipStyle}
          content={<p>The global consumer pool.</p>}
        >
          <div className="flex items-center gap-2">
            <RiTeamFill size={18} />
            {gameState.consumerPoolNumber}
          </div>
        </Tooltip>
      </div>
      <div>
        <Tooltip
          className={tooltipStyle}
          content={
            <p>
              The bank pool. Once the bank pool is exhausted, the game ends.
            </p>
          }
        >
          <BankInfo />
        </Tooltip>
      </div>
      <div>
        <Tooltip
          className={tooltipStyle}
          content={
            <p>
              The share limit. If a player exceeds this limit, they must divest
              down to the limit.
            </p>
          }
        >
          <div className="flex gap-1 items-center">
            <RiTicket2Fill size={18} /> {DEFAULT_SHARE_LIMIT}
          </div>
        </Tooltip>
      </div>
      <div>
        <div className="text-lg font-bold">Round</div>
        <div>{gameState.currentRound ?? "0"}</div>
      </div>
      <Tooltip
        className={tooltipStyle}
        content={
          <p>
            The current turn out of the maximum turns in the game. The game ends
            in one of two ways, either the bank pool is exhausted or the maximum
            turns are reached.
          </p>
        }
      >
        <div>
          <div className="text-lg font-bold">Turn</div>
          <div>
            {currentTurn.turn ?? "0"} of {gameState.gameMaxTurns}
          </div>
        </div>
      </Tooltip>
    </div>
  );
};

export default GameGeneralInfo;
