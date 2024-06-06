import {
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { Avatar, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import "./PendingOrders.css";
const marketOrders = [
  {
    avatar: "/path/to/avatar1.jpg",
    name: "John Doe",
    companyName: "TechCorp",
    orderType: "buy",
    shares: 10,
  },
  {
    avatar: "/path/to/avatar2.jpg",
    name: "Jane Smith",
    companyName: "HealthInc",
    orderType: "sell",
    shares: 5,
  },
  {
    avatar: "/path/to/avatar1.jpg",
    name: "Alice Johnson",
    companyName: "TechCorp",
    orderType: "sell",
    shares: 3,
  },
  {
    avatar: "/path/to/avatar3.jpg",
    name: "Bob Brown",
    companyName: "Retailers",
    orderType: "buy",
    shares: 7,
  },
];

const limitOrders = [
  {
    avatar: "/path/to/avatar2.jpg",
    name: "Jane Smith",
    companyName: "HealthInc",
    orderType: "buy",
    amount: 200,
    filled: false,
  },
  {
    avatar: "/path/to/avatar1.jpg",
    name: "John Doe",
    companyName: "TechCorp",
    orderType: "sell",
    amount: 150,
    filled: false,
  },
  {
    avatar: "/path/to/avatar3.jpg",
    name: "Alice Johnson",
    companyName: "Retailers",
    orderType: "buy",
    amount: 300,
    filled: true,
  },
  {
    avatar: "/path/to/avatar1.jpg",
    name: "John Doe",
    companyName: "Retailers",
    orderType: "sell",
    amount: 100,
    filled: false,
  },
  {
    avatar: "/path/to/avatar2.jpg",
    name: "Jane Smith",
    companyName: "HealthInc",
    orderType: "buy",
    amount: 250,
    filled: true,
  },
];

const shortOrders = [
  {
    term: 5,
    avatar: "/path/to/avatar1.jpg",
    name: "John Doe",
    companyName: "TechCorp",
    shares: 50,
    interestRate: 5,
  },
  {
    term: 4,
    avatar: "/path/to/avatar2.jpg",
    name: "Jane Smith",
    companyName: "HealthInc",
    shares: 30,
    interestRate: 3.5,
  },
  {
    term: 5,
    avatar: "/path/to/avatar1.jpg",
    name: "Alice Johnson",
    companyName: "TechCorp",
    shares: 40,
    interestRate: 5,
  },
  {
    term: 3,
    avatar: "/path/to/avatar3.jpg",
    name: "Bob Brown",
    companyName: "Retailers",
    shares: 20,
    interestRate: 4,
  },
  {
    term: 2,
    avatar: "/path/to/avatar1.jpg",
    name: "Alice Johnson",
    companyName: "TechCorp",
    shares: 40,
    interestRate: 4.5,
  },
  {
    term: 1,
    avatar: "/path/to/avatar2.jpg",
    name: "Jane Smith",
    companyName: "Retailers",
    shares: 10,
    interestRate: 2.5,
  },
];

const PendingMarketOrders = ({ marketOrders }: any) => {
  // Assuming marketOrders is an array of objects with name, companyName, orderType (buy/sell), and shares
  const groupedOrders = marketOrders.reduce((acc, order) => {
    const key = order.companyName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(order);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {Object.entries(groupedOrders).map(([company, orders]) => {
        let netDifference = orders.reduce((acc, order) => {
          return (
            acc + (order.orderType === "buy" ? order.shares : -order.shares)
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
                  avatar={<Avatar name={order.name} />}
                  variant="flat"
                >
                  <div>
                    {String(order.orderType).toUpperCase()} {order.shares}
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

const PendingLimitOrders = ({ limitOrders }: any) => {
  // Group orders by company
  const groupedOrders = limitOrders.reduce((acc, order) => {
    const key = order.companyName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(order);
    return acc;
  }, {});

  // Sort each group's orders by amount in descending order
  const sortedGroupedOrders = Object.entries(groupedOrders).map(
    ([company, orders]) => {
      const sortedOrders = [...orders].sort((a, b) => b.amount - a.amount);
      return { company, orders: sortedOrders };
    }
  );

  // Sort groups by the highest order amount within each group in descending order
  sortedGroupedOrders.sort((a, b) => b.orders[0].amount - a.orders[0].amount);

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
                <Avatar name={order.name} />
                <div>{order.companyName}</div>
                <div>
                  {String(order.orderType).toUpperCase()} @ {order.amount}
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

const PendingShortOrders = ({ shortOrders }: any) => {
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
                <Avatar name={order.name} />
                <div>{order.companyName}</div>
                <div>
                  {order.shares} @ {order.interestRate}%
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
