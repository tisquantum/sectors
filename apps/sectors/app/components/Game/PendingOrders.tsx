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
  OrderStatus,
  OrderType,
  PhaseName,
  Prisma,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerCompanySectorShortOrder,
  PlayerOrdersAllRelations,
} from "@server/prisma/prisma.types";
import { interestRatesByTerm } from "@server/data/constants";
import { create } from "domain";
import { sectorColors } from "@server/data/gameData";
import { motion, AnimatePresence } from "framer-motion";
import OrderChipWithPlayer from "./OrderChipWithPlayer";
import { RiCloseCircleFill } from "@remixicon/react";
interface GroupedOrders {
  [key: string]: PlayerOrdersAllRelations[];
}

const PendingMarketOrders = ({
  marketOrders,
  isResolving,
}: {
  marketOrders: PlayerOrdersAllRelations[];
  isResolving?: boolean;
}) => {
  const { currentPhase } = useGame();
  // Assuming marketOrders is an array of objects with name, companyName, orderType (buy/sell), and shares
  const groupedOrders = marketOrders.reduce(
    (acc: GroupedOrders, order: PlayerOrdersAllRelations) => {
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
    hidden: { opacity: 0, y: 0 },
    visible: { opacity: 1, y: 20, transition: { delay: 0.5, duration: 0.5 } },
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
            <div className="flex flex-wrap gap-2 mb-5">
              {orders.map((order, index) =>
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
                  />
                )
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
  limitOrders: PlayerOrdersAllRelations[];
  isResolving?: boolean;
}) => {
  // Group orders by company
  const groupedOrders = limitOrders.reduce(
    (acc: GroupedOrders, order: PlayerOrdersAllRelations) => {
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
                <Avatar name={order.Player.nickname} />
                <div>{order.Company.name}</div>
                <div>
                  {String(order.orderType).toUpperCase()} @ {order.value}
                </div>
                {order.orderStatus == OrderStatus.OPEN ? (
                  <ClockIcon className="size-5 text-yellow-500" />
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
  shortOrders: PlayerOrdersAllRelations[];
}) => {
  return (
    <div className="space-y-2">
      {shortOrders.map((order, index) => (
        <div
          key={index}
          className="bg-gray-500 p-2 rounded flex items-center gap-2"
        >
          <Avatar name={order.Player.nickname} />
          <div>{order.Company.name}</div>
          <div>
            <span>${order.ShortOrder?.shortSalePrice}</span>
            <span>
              {order.quantity} SHARES @ {order.ShortOrder?.borrowRate}%
            </span>
            <span>
              Margin Account Minimum ${order.ShortOrder?.marginAccountMinimum}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const PendingOrders = ({ isResolving }: { isResolving?: boolean }) => {
  const { gameId, currentPhase } = useGame();
  const { data: playerOrders, isLoading } =
    trpc.playerOrder.listPlayerOrdersAllRelations.useQuery({
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
      where: {
        Game: {
          id: gameId,
        },
      },
    });
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
      (OrderType.LIMIT && order.orderStatus === OrderStatus.OPEN)
  );

  let marketOrders = playerOrders.filter(
    (order) => order.orderType === OrderType.MARKET
  );
  //filter out any market orders that are not from the current stock round and are filled
  const marketOrdersToFilterOut = marketOrders.filter(
    (order) =>
      order.orderStatus === OrderStatus.FILLED &&
      order.stockRoundId !== currentPhase?.stockRoundId
  );
  marketOrders = marketOrders.filter(
    (order) => !marketOrdersToFilterOut.includes(order)
  );
  const shortOrders = playerOrders.filter(
    (order) => order.orderType === OrderType.SHORT
  );
  return (
    <div className="flex space-x-4 z-0">
      <Card
        className={`flex-1 ${
          currentPhase?.name === PhaseName.STOCK_RESOLVE_LIMIT_ORDER &&
          "ring-2 ring-blue-500"
        }`}
      >
        <CardHeader className="z-0">Limit Orders Pending Settlement</CardHeader>
        <CardBody>
          <PendingLimitOrders
            limitOrders={limitOrdersPendingSettlement}
            isResolving={isResolving}
          />
        </CardBody>
      </Card>
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
      <Card
        className={`flex-1 ${
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
      <div className="flex items-center">
        <ArrowRightIcon className="size-5" />
      </div>
      <Card
        className={`flex-1 ${
          (currentPhase?.name === PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER ||
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
        className={`flex-1 ${
          currentPhase?.name === PhaseName.STOCK_RESOLVE_OPTION_ORDER &&
          "ring-2 ring-blue-500"
        }`}
      >
        <CardHeader className="z-0">Option Contracts</CardHeader>
        <CardBody></CardBody>
      </Card>
      <Card
        className={`flex-1 ${
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
  );
};

export default PendingOrders;
