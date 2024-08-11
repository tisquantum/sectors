import { Avatar, Chip } from "@nextui-org/react";
import { determineColorByOrderType } from "@sectors/app/helpers";
import {
  OrderStatus,
  OrderType,
  PlayerOrder,
  Player,
  GameTurn,
} from "@server/prisma/prisma.client";
import {
  PlayerOrderWithPlayerCompany,
  PlayerOrderAllRelations,
} from "@server/prisma/prisma.types";
import React, { useMemo } from "react";
import PlayerAvatar from "../Player/PlayerAvatar";
import { RiText } from "@remixicon/react";

const OrderChipWithPlayer = ({
  order,
  status,
  endContent,
}: {
  order: PlayerOrder & { Player: Player } & { GameTurn: GameTurn };
  status?: OrderStatus;
  endContent?: React.ReactNode;
}) => {
  return (
    <Chip
      key={order.id}
      variant="flat"
      color={determineColorByOrderType(order.orderType, order.isSell)}
      avatar={<PlayerAvatar player={order.Player} />}
      endContent={endContent}
      className="my-2"
    >
      <div className="flex items-center text-gray-100">
        <div className="flex items-center"><RiText />{order.GameTurn.turn}</div>
        <span>{order.orderType}</span>
        {order.orderType === OrderType.MARKET && <span>@${order.value}</span>}
        <span>&nbsp;|&nbsp;{order.location}&nbsp;</span>
        {(order.orderType === OrderType.LIMIT ||
          order.orderType === OrderType.MARKET) && (
          <>
            <span>{order.isSell ? "-" : "+"}</span>
          </>
        )}
        {order.orderType === OrderType.LIMIT && <span>@${order.value}</span>}
        {(order.orderType === OrderType.MARKET ||
          order.orderType === OrderType.LIMIT ||
          order.orderType === OrderType.SHORT) && <span>{order.quantity}</span>}
        {order.orderType === OrderType.SHORT && <span>@${order.value}</span>}
        &nbsp;| {status && status}
      </div>
    </Chip>
  );
};

export default OrderChipWithPlayer;
