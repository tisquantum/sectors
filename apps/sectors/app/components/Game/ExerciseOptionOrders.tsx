import { trpc } from "@sectors/app/trpc";
import { ContractState, OrderStatus } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import OptionContract from "./OptionContract";

const ExerciseOptionOrders = () => {
  const { authPlayer } = useGame();
  const { data: purchasedOptionOrders, isLoading } =
    trpc.optionContract.listOptionContracts.useQuery({
      where: {
        contractState: ContractState.PURCHASED,
      },
    });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!purchasedOptionOrders) {
    return <div>No purchased option orders found</div>;
  }
  //filter by strike price against company
  const exercisableOptionOrders = purchasedOptionOrders.filter(
    (optionContract) => {
      return (
        optionContract.strikePrice <= optionContract.Company?.currentStockPrice
      );
    }
  );

  return (
    <>
      {authPlayer ? (
        <div className="flex flex-col">
          <h1>Exercise Option Orders</h1>
          <div className="flex gap-2">
            {exercisableOptionOrders.map((optionContract) => {
              const isAuthPlayerOptionOrder =
                optionContract.PlayerOrders.filter(
                  (order) => order.orderStatus === OrderStatus.OPEN
                ).some((order) => order.playerId === authPlayer.id);
              return (
                <div key={optionContract.id} className="flex gap-2">
                  <OptionContract
                    contract={optionContract}
                    isExercisableByAuth={isAuthPlayerOptionOrder}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>Spectator</div>
      )}
    </>
  );
};

export default ExerciseOptionOrders;
