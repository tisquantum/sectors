import { trpc } from "@sectors/app/trpc";
import { OrderStatus, OrderType } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import PlayerAvatar from "../Player/PlayerAvatar";
import DebounceButton from "../General/DebounceButton";
import { useState } from "react";

const CoverShortButton = ({ shortOrderId }: { shortOrderId: number }) => {
  const { gameId } = useGame();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingCoverShort, setIsLoadingCoverShort] = useState(false);
  const useCoverShortMutation = trpc.game.coverShort.useMutation({
    onSettled: () => {
      setIsLoadingCoverShort(false);
    },
  });
  return (
    <>
      {isSubmitted ? (
        <div>Covering short order...</div>
      ) : (
        <DebounceButton
          onClick={() => {
            setIsLoadingCoverShort(true);
            useCoverShortMutation.mutate({
              shortId: shortOrderId,
              gameId,
            });
            setIsSubmitted(true);
          }}
          isLoading={isLoadingCoverShort}
        >
          Cover Short Order
        </DebounceButton>
      )}
    </>
  );
};
const CoverShortOrders = () => {
  const { gameId, authPlayer } = useGame();
  const { data: openShortOrders, isLoading: isLoadingOpenShortOrders } =
    trpc.playerOrder.listPlayerOrdersAllRelations.useQuery({
      where: {
        gameId: gameId,
        orderStatus: OrderStatus.OPEN,
        orderType: OrderType.SHORT,
      },
    });
  if (isLoadingOpenShortOrders) {
    return <div>Loading...</div>;
  }
  if (!openShortOrders) {
    return <div>No open short orders found</div>;
  }
  return (
    <div className="flex flex-col">
      <h2>Cover Short Orders</h2>
      <div>
        <p>
          When a short is covered the funds in your margin account from opening
          the short order are released.
        </p>
      </div>
      <div className="flex gap-2">
        {openShortOrders.map((shortOrder) => (
          <div key={shortOrder.id} className="flex flex-col gap-2">
            <div className="text-lg">Short Order</div>
            <PlayerAvatar player={shortOrder.Player} size="sm" />
            <div className="text-sm">
              Company: {shortOrder.Company?.stockSymbol}
            </div>
            <div className="text-sm">
              Short Sale Price: {shortOrder.ShortOrder?.shortSalePrice}
            </div>
            <div className="text-sm">
              Shares Price At Purchase:{" "}
              {shortOrder.ShortOrder?.shortStockPriceAtPurchase}
            </div>
            {authPlayer.id == shortOrder.Player.id &&
              shortOrder.ShortOrder?.id && (
                <CoverShortButton shortOrderId={shortOrder.ShortOrder.id} />
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoverShortOrders;
