import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@nextui-org/react";
import {
  determineColorByOrderType,
  hashStringToColor,
  renderLocationShortHand,
  renderOrderTypeShortHand,
} from "@sectors/app/helpers";
import {
  OrderStatus,
  OrderType,
  PlayerOrder,
  Player,
  GameTurn,
  DistributionStrategy,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  PlayerOrderWithPlayerCompany,
  PlayerOrderAllRelations,
} from "@server/prisma/prisma.types";
import React, { useMemo } from "react";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  RiCheckboxCircleFill,
  RiCheckFill,
  RiCloseCircleFill,
  RiText,
  RiTimeFill,
} from "@remixicon/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { useGame } from "./GameContext";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";
import PlayerOverview from "../Player/PlayerOverview";

const OrderChipChitWithPlayer = ({
  order,
  showStatus,
}: {
  order: PlayerOrder & { Player: Player } & { GameTurn: GameTurn };
  showStatus?: boolean;
}) => {
  const { gameState, playersWithShares } = useGame();
  const avatarUri = useMemo(() => {
    return createAvatar(lorelei, {
      size: 16,
      seed: order.Player.nickname,
      backgroundColor: [hashStringToColor(order.Player.nickname)],
    }).toDataUri();
  }, []);
  const playerWithShares = playersWithShares.find(
    (p) => p.id === order.Player.id
  );
  return (
    <Popover placement="bottom">
      <Badge
        className="top-[5%] right-[2%]"
        key={order.id}
        isOneChar
        isDot
        showOutline={false}
        size="sm"
        content={
          order.orderStatus == OrderStatus.FILLED ? (
            <RiCheckboxCircleFill className="text-green-500" />
          ) : order.orderStatus == OrderStatus.REJECTED ? (
            <RiCloseCircleFill className="text-red-500" />
          ) : (
            <RiTimeFill className="text-yellow-500" />
          )
        }
        shape="circle"
        placement="top-right"
      >
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>{order.Player.nickname}</p>
          }
        >
          <PopoverTrigger>
            <Card
              className={`relative bg-${determineColorByOrderType(
                order.orderType,
                order.isSell
              )} drop-shadow-md cursor-pointer`}
            >
              {/* Background Image ${hashStringToColor(order.Player.nickname)} ${determineColorByOrderType(
            order.orderType,
            order.isSell
          )} */}
              <img
                src={avatarUri}
                alt="Avatar Background"
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-25"
              />

              <CardHeader className="z-20 p-1 pt-2 pb-0 flex justify-center gap-2">
                <div className="flex flex-col gap-1 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex">
                        <span>{renderOrderTypeShortHand(order.orderType)}</span>

                        <div className="flex items-center gap-1">
                          <span>
                            {(order.orderType === OrderType.LIMIT ||
                              order.orderType === OrderType.MARKET) && (
                              <>
                                <span>{order.isSell ? "-" : "+"}</span>
                              </>
                            )}
                          </span>
                          {(order.orderType === OrderType.MARKET ||
                            order.orderType === OrderType.LIMIT ||
                            order.orderType === OrderType.SHORT) && (
                            <span>{order.quantity}</span>
                          )}
                          <div className="flex items-center gap-1">
                            {order.orderType === OrderType.LIMIT && (
                              <span>@${order.value}</span>
                            )}
                            {order.orderType === OrderType.SHORT && (
                              <span>@${order.value}</span>
                            )}
                            {gameState.distributionStrategy ==
                              DistributionStrategy.BID_PRIORITY &&
                              (order.orderType === OrderType.MARKET ||
                                order.orderType === OrderType.OPTION) && (
                                <span>@${order.value}</span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="z-20 p-1 pb-2 flex flex-col justify-center items-center">
                <div className="flex justify-center items-center text-gray-100 text-xs font-bold drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                  <span>T{order.GameTurn.turn}</span>
                  <span>
                    &nbsp;|&nbsp;{renderLocationShortHand(order.location)}
                  </span>
                  {/* <div className="flex items-center">
            <span>&nbsp;|&nbsp;</span>
            {order.orderStatus == OrderStatus.FILLED ? (
              <RiCheckboxCircleFill className="size-3 text-green-500" />
            ) : order.orderStatus == OrderStatus.REJECTED ? (
              <RiCloseCircleFill className="size-3 text-red-500" />
            ) : (
              <RiTimeFill className="size-3 text-yellow-500" />
            )}
          </div> */}
                </div>
              </CardBody>
            </Card>
          </PopoverTrigger>
        </Tooltip>
      </Badge>
      <PopoverContent className="p-0 m-0">
        {playerWithShares && (
          <PlayerOverview playerWithShares={playerWithShares} />
        )}
      </PopoverContent>
    </Popover>
  );
};

export default OrderChipChitWithPlayer;
