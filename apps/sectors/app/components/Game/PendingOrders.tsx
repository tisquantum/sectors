import {
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { Avatar, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import "./PendingOrders.css";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  ContractState,
  DistributionStrategy,
  OrderStatus,
  OrderType,
  PhaseName,
  Prisma,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerCompanySectorShortOrder,
  PlayerOrderAllRelations,
} from "@server/prisma/prisma.types";
import { BORROW_RATE, interestRatesByTerm } from "@server/data/constants";
import { create } from "domain";
import { sectorColors } from "@server/data/gameData";
import { motion, AnimatePresence } from "framer-motion";
import OrderChipWithPlayer from "./OrderChipWithPlayer";
import { RiCloseCircleFill } from "@remixicon/react";
import { flushAllTraces } from "next/dist/trace";
import PlayerAvatar from "../Player/PlayerAvatar";
import OptionContract from "./OptionContract";
import { useEffect } from "react";
interface GroupedOrders {
  [key: string]: PlayerOrderAllRelations[];
}

const OpenOptionContracts = () => {
  const { gameId, currentPhase } = useGame();
  const {
    data: openOptionContracts,
    isLoading,
    refetch,
  } = trpc.optionContract.listOptionContracts.useQuery({
    where: {
      Game: {
        id: gameId,
      },
      contractState: ContractState.FOR_SALE,
    },
  });
  useEffect(() => {
    refetch();
  }, [currentPhase?.name]);
  if (isLoading) return <div>Loading...</div>;
  if (!openOptionContracts) return <div>No open option contracts.</div>;
  return (
    <div className="space-y-4">
      {openOptionContracts.map((contract, index) => (
        <div key={index}>
          <OptionContract contract={contract} />
        </div>
      ))}
    </div>
  );
};

const PendingMarketOrders = ({
  marketOrders,
  isResolving,
}: {
  marketOrders: PlayerOrderAllRelations[];
  isResolving?: boolean;
}) => {
  const { currentPhase } = useGame();
  const { data: phasesOfStockRound, isLoading: isLoadingPhases } =
    trpc.phase.listPhases.useQuery({
      where: {
        stockRoundId: currentPhase?.stockRoundId,
        name: PhaseName.STOCK_ACTION_ORDER,
      },
      orderBy: { createdAt: "asc" },
    });
  if (isLoadingPhases) return <div>Loading...</div>;
  if (!phasesOfStockRound) return <div>No phases found.</div>;
  const mapPhaseIdToSubRound = (phaseId: string) => {
    return phasesOfStockRound.findIndex((phase) => phase.id === phaseId) + 1;
  };
  // Assuming marketOrders is an array of objects with name, companyName, orderType (buy/sell), and shares
  const groupedOrders = marketOrders.reduce(
    (acc: GroupedOrders, order: PlayerOrderAllRelations) => {
      const key = order.Company.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(order);
      return acc;
    },
    {} as GroupedOrders
  );
  const checkmarkVariants = {
    hidden: { scale: 0 },
    visible: { scale: 1, transition: { duration: 0.5 } },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.5 } },
  };

  return (
    <div className="space-y-2">
      {Object.entries(groupedOrders).map(([company, orders]) => {
        let netDifference: string | number = orders.reduce((acc, order) => {
          //if order is IPO, skip it
          if (order.location === ShareLocation.IPO) {
            return acc;
          }
          return (
            acc + (!order.isSell ? order.quantity || 0 : -(order.quantity || 0))
          );
        }, 0);
        netDifference = netDifference > 0 ? `+${netDifference}` : netDifference;
        if (netDifference === 0) {
          netDifference = "+0";
        }
        //group orders by phaseId
        const groupedOrdersByPhase = orders.reduce((acc, order) => {
          const phaseId = order.phaseId;
          if (!phaseId) return acc;
          if (acc[phaseId]) {
            acc[phaseId].orders.push(order);
          } else {
            acc[phaseId] = {
              orders: [order],
              subRound: mapPhaseIdToSubRound(order.phaseId),
            };
          }
          return acc;
        }, {} as { [key: string]: { orders: PlayerOrderAllRelations[]; subRound: number } });
        return (
          <div
            key={company}
            className="flex flex-col p-2 rounded gap-2"
            style={{ backgroundColor: sectorColors[orders[0].Sector.name] }}
          >
            <div className="text-lg font-bold flex gap-2 bg-stone-600 p-2 content-center items-center">
              {/* We need to animate the change in stock price or at least show the previous price and the current price.*/}
              <ArrowTrendingUpIcon className="size-4" /> $
              {orders[0].Company.currentStockPrice}
              <span>
                {company} {netDifference}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(groupedOrdersByPhase).map(
                ([phaseId, orders], index) => {
                  return (
                    <div className="flex flex-col" key={index}>
                      <div>
                        <span> Stock Round {orders.subRound} </span>
                      </div>
                      <div>
                        {orders.orders.map((order, index) =>
                          isResolving ? (
                            <>
                              <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={containerVariants}
                                className="flex"
                              >
                                <OrderChipWithPlayer
                                  order={order}
                                  status={order.orderStatus}
                                  endContent={
                                    order.orderStatus == OrderStatus.FILLED ? (
                                      <CheckCircleIcon className="size-5 text-green-500" />
                                    ) : OrderStatus.REJECTED ? (
                                      <RiCloseCircleFill className="size-5 text-red-500" />
                                    ) : (
                                      <ClockIcon className="size-5 text-yellow-500" />
                                    )
                                  }
                                />
                              </motion.div>
                            </>
                          ) : (
                            <OrderChipWithPlayer
                              order={order}
                              status={order.orderStatus}
                              key={index}
                            />
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PendingLimitOrders = ({
  limitOrders,
  isResolving,
}: {
  limitOrders: PlayerOrderAllRelations[];
  isResolving?: boolean;
}) => {
  // Group orders by company
  const groupedOrders = limitOrders.reduce(
    (acc: GroupedOrders, order: PlayerOrderAllRelations) => {
      const key = order.Company.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(order);
      return acc;
    },
    {} as GroupedOrders
  );

  // Sort each group's orders by amount in descending order
  const sortedGroupedOrders = Object.entries(groupedOrders).map(
    ([company, orders]) => {
      const sortedOrders = [...orders].sort(
        (a, b) => (b.value || 0) - (a.value || 0)
      );
      return { company, orders: sortedOrders };
    }
  );

  // Sort groups by the highest order amount within each group in descending order
  sortedGroupedOrders.sort(
    (a, b) => (b.orders[0].value || 0) - (a.orders[0].value || 0)
  );

  return (
    <div className="space-y-4">
      {sortedGroupedOrders.map(({ company, orders }) => (
        <div key={company}>
          <div className="text-lg font-bold mb-2">{company}</div>
          <div className="space-y-2">
            {orders.map((order, index) => (
              <div
                key={index}
                className="p-2 rounded flex items-center gap-2"
                style={{ backgroundColor: sectorColors[order.Sector.name] }}
              >
                <PlayerAvatar player={order.Player} />
                <div>{order.Company.name}</div>
                <div>
                  {String(order.orderType).toUpperCase()} @ {order.value}
                </div>
                {order.orderStatus == OrderStatus.OPEN ? (
                  <ClockIcon className="size-5 text-yellow-500" />
                ) : order.orderStatus ==
                  OrderStatus.FILLED_PENDING_SETTLEMENT ? (
                  <ClockIcon className="size-5 text-green-500" />
                ) : order.orderStatus == OrderStatus.FILLED ? (
                  <CheckCircleIcon className="size-5 text-green-500" />
                ) : (
                  <ClockIcon className="size-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PendingShortOrders = ({
  shortOrders,
}: {
  shortOrders: PlayerOrderAllRelations[];
}) => {
  return (
    <div className="space-y-2">
      {shortOrders.map((order, index) => (
        <div
          key={index}
          className="bg-gray-500 p-2 rounded flex items-center gap-2"
        >
          <PlayerAvatar player={order.Player} />
          <div>{order.Company.name}</div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <span>
                $
                {order.ShortOrder?.shortStockPriceAtPurchase ??
                  order.Company.currentStockPrice}
              </span>
              <span>
                {order.quantity} SHARES @ {BORROW_RATE}%
              </span>
              <span>{order.orderStatus}</span>
            </div>
            <span>
              Margin Account Minimum $
              {order.ShortOrder?.marginAccountMinimum ??
                Math.floor(
                  ((order.Company.currentStockPrice || 0) *
                    (order.quantity || 0)) /
                    2
                )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const PendingOrders = ({ isResolving }: { isResolving?: boolean }) => {
  const { gameId, currentPhase, gameState } = useGame();
  const {
    data: playerOrders,
    isLoading,
    refetch: refetchPlayerOrders,
  } = trpc.playerOrder.listPlayerOrdersAllRelations.useQuery({
    orderBy: {
      createdAt: Prisma.SortOrder.asc,
    },
    where: {
      isConcealed: false,
      Game: {
        id: gameId,
      },
    },
  });
  const { data: openOptionContracts, isLoading: isLoadingOpenOptionContracts } =
    trpc.optionContract.listOptionContracts.useQuery({
      where: {
        Game: {
          id: gameId,
        },
        contractState: ContractState.PURCHASED,
      },
    });
  useEffect(() => {
    refetchPlayerOrders();
  }, [currentPhase?.name]);
  if (isLoading) return <div>Loading...</div>;
  if (!playerOrders) return <div>No pending orders.</div>;

  const limitOrdersPendingSettlement = playerOrders.filter(
    (order) =>
      order.orderType === OrderType.LIMIT &&
      order.orderStatus === OrderStatus.FILLED_PENDING_SETTLEMENT
  );

  const limitOrdersPendingToOpen = playerOrders.filter(
    (order) =>
      (order.orderType === OrderType.LIMIT &&
        order.orderStatus === OrderStatus.PENDING) ||
      (order.orderType === OrderType.LIMIT &&
        order.orderStatus === OrderStatus.OPEN)
  );

  let marketOrders = playerOrders.filter(
    (order) => order.orderType === OrderType.MARKET
  );
  //filter out any market orders that are not from the current stock round and are filled
  const marketOrdersToFilterOut = marketOrders.filter(
    (order) => order.stockRoundId !== currentPhase?.stockRoundId
  );
  marketOrders = marketOrders.filter(
    (order) => !marketOrdersToFilterOut.includes(order)
  );
  const shortOrders = playerOrders.filter(
    (order) => order.orderType === OrderType.SHORT
  );
  return (
    <div className="flex flex-col">
      <div className="flex justify-center flex-wrap gap-3 z-0">
        <Card
          className={`flex ${
            currentPhase?.name === PhaseName.STOCK_RESOLVE_LIMIT_ORDER &&
            "ring-2 ring-blue-500"
          }`}
        >
          <CardHeader className="z-0">
            Limit Orders Pending Settlement
          </CardHeader>
          <CardBody>
            <PendingLimitOrders
              limitOrders={limitOrdersPendingSettlement}
              isResolving={isResolving}
            />
          </CardBody>
        </Card>
        <div className="flex gap-4 items-center">
          <div className="flex items-center">
            <ArrowRightIcon className="size-5" />
          </div>
          <div className="flex items-center">
            <div className="vertical-text">
              <span>S</span>
              <span>T</span>
              <span>O</span>
              <span>C</span>
              <span>K</span>
              <span> </span>
              <span>R</span>
              <span>O</span>
              <span>U</span>
              <span>N</span>
              <span>D</span>
            </div>
          </div>
          <div className="flex items-center">
            <ArrowRightIcon className="size-5" />
          </div>
        </div>
        <Card
          className={`flex ${
            currentPhase?.name === PhaseName.STOCK_RESOLVE_MARKET_ORDER &&
            "ring-2 ring-blue-500"
          }`}
        >
          <CardHeader>Market Orders</CardHeader>
          <CardBody>
            <PendingMarketOrders
              marketOrders={marketOrders}
              isResolving={isResolving}
            />
          </CardBody>
        </Card>
        <Card
          className={`flex ${
            (currentPhase?.name ===
              PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER ||
              currentPhase?.name === PhaseName.STOCK_SHORT_ORDER_INTEREST) &&
            "ring-2 ring-blue-500"
          }`}
        >
          <CardHeader>Short Orders</CardHeader>
          <CardBody>
            <PendingShortOrders shortOrders={shortOrders} />
          </CardBody>
        </Card>
        <Card
          className={`flex ${
            currentPhase?.name === PhaseName.STOCK_RESOLVE_OPTION_ORDER &&
            "ring-2 ring-blue-500"
          }`}
        >
          <CardHeader className="z-0">Options Contracts</CardHeader>
          <CardBody>
            <OpenOptionContracts />
          </CardBody>
        </Card>
        <Card
          className={`flex ${
            currentPhase?.name === PhaseName.STOCK_OPEN_LIMIT_ORDERS &&
            "ring-2 ring-blue-500"
          }`}
        >
          <CardHeader className="z-0">Limit Orders</CardHeader>
          <CardBody>
            <PendingLimitOrders limitOrders={limitOrdersPendingToOpen} />
          </CardBody>
        </Card>
      </div>
      <div className="mt-4">
        <Card>
          <CardHeader>Purchased and Open Options Contracts</CardHeader>
          <CardBody>
            {openOptionContracts?.map((contract, index) => (
              <OptionContract contract={contract} key={index} />
            ))}
          </CardBody>
        </Card>
      </div>
      <div className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col justify-start gap-2">
              <h3>Distribution Strategy</h3>
              <p>
                When shares are contested in a stock round, they are resolved
                according to the distribution strategy.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {gameState?.distributionStrategy ==
            DistributionStrategy.BID_PRIORITY ? (
              <div className="flex flex-col gap-2">
                <span>Bid Priority</span>
                <p>
                  Bids are placed in priority according to the highest ask price
                  of the market order. This ask price is quoted per share. If
                  there are not enough shares to resolve the order, it is
                  rejected.
                </p>
                <p>
                  If shares are still contested (ie: a tie-breaker for players
                  who purchase the same amount of shares), they are resolved by
                  priority where the player with the lowest player priority
                  takes precedence.
                </p>
              </div>
            ) : gameState?.distributionStrategy ==
              DistributionStrategy.FAIR_SPLIT ? (
              <div className="flex flex-col gap-2">
                <span>Fair Split</span>
                <p>
                  When there is not enough shares to distribute, orders are
                  split evenly amongst the remaining orders. Any remaining
                  shares are distributed on a lottery to a random player who has
                  placed an order for this company in that stock round.
                </p>
              </div>
            ) : gameState?.distributionStrategy ==
              DistributionStrategy.PRIORITY ? (
              <div className="flex flex-col gap-2">
                <span>Priority</span>
                <p>
                  Orders are filled in priority. If there are not enough shares
                  to resolve the order, the order is rejected.
                </p>
              </div>
            ) : (
              <div>
                <p>No distribution strategy found.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PendingOrders;
