import {
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { Avatar, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import "./PendingOrders.css";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { OrderType } from "@server/prisma/prisma.client";
import { PlayerOrderWithPlayerCompany } from "@server/prisma/prisma.types";
import { interestRatesByTerm } from "@server/data/constants";

interface GroupedOrders {
  [key: string]: PlayerOrderWithPlayerCompany[];
}

const PendingMarketOrders = ({
  marketOrders,
}: {
  marketOrders: PlayerOrderWithPlayerCompany[];
}) => {
  // Assuming marketOrders is an array of objects with name, companyName, orderType (buy/sell), and shares
  const groupedOrders = marketOrders.reduce(
    (acc: GroupedOrders, order: PlayerOrderWithPlayerCompany) => {
      const key = order.Company.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(order);
      return acc;
    },
    {} as GroupedOrders
  );

  return (
    <div className="space-y-2">
      {Object.entries(groupedOrders).map(([company, orders]) => {
        let netDifference: string | number = orders.reduce((acc, order) => {
          return (
            acc + (!order.isSell ? order.quantity || 0 : -(order.quantity || 0))
          );
        }, 0);
        netDifference = netDifference > 0 ? `+${netDifference}` : netDifference;
        return (
          <div
            key={company}
            className="flex flex-col bg-green-600 p-2 rounded gap-2"
          >
            <div className="bg-green-900 p-2 font-bold">
              {company} {netDifference}
            </div>
            <div className="flex flex-wrap gap-2">
              {orders.map((order, index) => (
                <Chip
                  key={index}
                  avatar={<Avatar name={order.Player.nickname} />}
                  variant="flat"
                >
                  <div>
                    {String(order.orderType).toUpperCase()} {order.quantity}
                  </div>
                </Chip>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PendingLimitOrders = ({
  limitOrders,
}: {
  limitOrders: PlayerOrderWithPlayerCompany[];
}) => {
  // Group orders by company
  const groupedOrders = limitOrders.reduce(
    (acc: GroupedOrders, order: PlayerOrderWithPlayerCompany) => {
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
                className="bg-purple-600 p-2 rounded flex items-center gap-2"
              >
                <Avatar name={order.Player.nickname} />
                <div>{order.Company.name}</div>
                <div>
                  {String(order.orderType).toUpperCase()} @ {order.value}
                </div>
                {order.filled ? (
                  <CheckCircleIcon className="size-5 text-green-500" />
                ) : (
                  <ClockIcon className="size-5" />
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
  shortOrders: PlayerOrderWithPlayerCompany[];
}) => {
  // Assuming shortOrders is an array of objects with term, avatar, name, companyName, shares, and interestRate
  const terms = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-2">
      {terms.map((term) => (
        <div key={term} className="space-y-1">
          Term {term}
          {shortOrders
            .filter((order) => order.term === term)
            .map((order, index) => (
              <div
                key={index}
                className="bg-gray-500 p-2 rounded flex items-center gap-2"
              >
                <Avatar name={order.Player.nickname} />
                <div>{order.Company.name}</div>
                <div>
                  {order.quantity} @ {interestRatesByTerm[order?.term || 5]}%
                </div>
              </div>
            ))}
          {term < 5 && (
            <div className="flex justify-center">
              <ArrowUpIcon className="size-5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const PendingOrders = () => {
  const { gameId } = useGame();
  const { data: pendingOrders, isLoading } =
    trpc.playerOrder.listPlayerOrdersWithPlayerCompany.useQuery({
      orderBy: "createdAt",
      where: {
        filled: false,
        Game: {
          id: gameId,
        },
      },
    });
  if (isLoading) return <div>Loading...</div>;
  if (!pendingOrders) return <div>No pending orders.</div>;

  const limitOrders = pendingOrders.filter(
    (order) => order.orderType === OrderType.LIMIT
  );
  const marketOrders = pendingOrders.filter(
    (order) => order.orderType === OrderType.MARKET
  );
  const shortOrders = pendingOrders.filter(
    (order) => order.orderType === OrderType.SHORT
  );
  return (
    <div className="flex space-x-4 z-0">
      <Card className="flex-1">
        <CardHeader className="z-0">Limit Orders</CardHeader>
        <CardBody>
          <PendingLimitOrders limitOrders={limitOrders} />
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
      <Card className="flex-1">
        <CardHeader>Market Orders</CardHeader>
        <CardBody>
          <PendingMarketOrders marketOrders={marketOrders} />
        </CardBody>
      </Card>
      <div className="flex items-center">
        <ArrowRightIcon className="size-5" />
      </div>
      <Card className="flex-1">
        <CardHeader>Short Orders</CardHeader>
        <CardBody>
          <PendingShortOrders shortOrders={shortOrders} />
        </CardBody>
      </Card>
    </div>
  );
};

export default PendingOrders;
