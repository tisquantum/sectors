import React from "react";
import { Chip, Avatar, Badge } from "@nextui-org/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";

type OrderType = "LO" | "MO" | "SO";

interface PlayerOrderProps {
  orderType: string;
  orderAmount?: number; // Only required for LO
  isSell?: boolean; // Only required for MO or LO
  term?: number; // Only required for SO
  playerName: string;
}

const PlayerOrder: React.FC<{
  isHidden?: Boolean;
  orders?: PlayerOrderProps[];
}> = ({ orders, isHidden }) => {
  const determineColorByOrderType = (orderType: string, isSell?: boolean) => {
    switch (orderType) {
      case "LO":
        return isSell ? "danger" : "secondary";
      case "MO":
        return isSell ? "danger" : "primary";
      case "SO":
        return "warning";
      default:
        return "default";
    }
  };
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {isHidden
        ? orders?.map((order, index) => (
            <div className="flex items-center justify-center" key={index}>
              <Badge color="secondary" content={3}>
                <Avatar
                  name={order.playerName}
                  size="sm"
                  getInitials={(name) => name.charAt(0)}
                />
              </Badge>
            </div>
          ))
        : orders &&
          orders.map((order, index) => (
            <Chip
              key={index}
              variant="flat"
              avatar={
                <Avatar
                  name={order.playerName}
                  size="sm"
                  getInitials={(name) => name.charAt(0)}
                />
              }
              color={determineColorByOrderType(order.orderType, order?.isSell)}
            >
              <div className="flex items-center">
                <span>{order.orderType}</span>
                {(order.orderType === "LO" || order.orderType === "MO") && (
                  <span>{order.isSell ? "-" : "+"}</span>
                )}
                {order.orderType === "LO" && <span>{order.orderAmount}</span>}
                {order.orderType === "SO" && <span>{order.term}</span>}
              </div>
            </Chip>
          ))}
    </div>
  );
};

export default PlayerOrder;
