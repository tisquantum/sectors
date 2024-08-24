import { Avatar, Chip, Tooltip } from "@nextui-org/react";
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
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";

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
      <Tooltip
        className={tooltipStyle}
        content={
          <p>
            Game Turn | Order type bid at price | Order location, + = BUY - =
            SELL, order quantity
          </p>
        }
      >
        <div className="flex items-center text-gray-100">
          <span>T{order.GameTurn.turn}</span>
          <span>&nbsp;|&nbsp;</span>
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
            order.orderType === OrderType.SHORT) && (
            <span>{order.quantity}</span>
          )}
          {order.orderType === OrderType.SHORT && <span>@${order.value}</span>}
          &nbsp;| {status && status}
        </div>
      </Tooltip>
    </Chip>
  );
};

export default OrderChipWithPlayer;
