import { Avatar, Chip } from "@nextui-org/react";
import { determineColorByOrderType } from "@sectors/app/helpers";
import {
  OrderStatus,
  OrderType,
  PlayerOrder,
} from "@server/prisma/prisma.client";
import {
  PlayerOrderWithPlayerCompany,
  PlayerOrdersAllRelations,
} from "@server/prisma/prisma.types";
import React from "react";

const OrderChipWithPlayer = ({
  order,
  status,
  endContent,
}: {
  order: PlayerOrdersAllRelations;
  status?: OrderStatus;
  endContent?: React.ReactNode;
}) => {
  return (
    <Chip
      key={order.id}
      variant="flat"
      color={determineColorByOrderType(order.orderType, order.isSell)}
      avatar={<Avatar name={order.Player.nickname} />}
      endContent={endContent}
    >
      <div className="flex items-center text-gray-100">
        <span>{order.orderType}</span>
        <span>&nbsp;|&nbsp;{order.location}&nbsp;</span>
        {(order.orderType === OrderType.LIMIT ||
          order.orderType === OrderType.MARKET) && (
          <>
            <span>{order.isSell ? "-" : "+"}</span>
          </>
        )}
        {order.orderType === OrderType.LIMIT && <span>@${order.value}</span>}
        {(order.orderType === OrderType.MARKET ||
          order.orderType === OrderType.SHORT) && <span>{order.quantity}</span>}
        {order.orderType === OrderType.SHORT && <span>@T{order.value}</span>}
        &nbsp;| {status && status}
      </div>
    </Chip>
  );
};

export default OrderChipWithPlayer;
