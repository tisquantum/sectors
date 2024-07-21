import { Avatar, Chip } from "@nextui-org/react";
import { determineColorByOrderType } from "@sectors/app/helpers";
import { OrderType, PlayerOrder } from "@server/prisma/prisma.client";

const OrderChip = ({ order }: { order: PlayerOrder }) => {
  return (
    <Chip
      key={order.id}
      variant="flat"
      color={determineColorByOrderType(order.orderType, order.isSell)}
    >
      <div className="flex items-center text-gray-100">
        <span>{order.orderType}</span>
        {(order.orderType === OrderType.LIMIT ||
          order.orderType === OrderType.MARKET) && (
          <>
            <span>{order.isSell ? "-" : "+"}</span>
          </>
        )}
        {order.orderType === OrderType.LIMIT && <span>@${order.value}</span>}
        {(order.orderType === OrderType.MARKET ||
          order.orderType === OrderType.SHORT) && <span>{order.quantity}</span>}
        {order.orderType === OrderType.SHORT && <span>@${order.value}</span>}
      </div>
    </Chip>
  );
};

export default OrderChip;
