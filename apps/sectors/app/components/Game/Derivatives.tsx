import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  ContractState,
  OrderStatus,
  OrderType,
  PhaseName,
} from "@server/prisma/prisma.client";
import OptionContract from "./OptionContract";
import PlayerAvatar from "../Player/PlayerAvatar";

const Derivatives = () => {
  const { gameId, currentPhase } = useGame();
  const { data: optionsContracts, isLoading } =
    trpc.optionContract.listOptionContracts.useQuery({
      where: { gameId, contractState: ContractState.FOR_SALE },
    });
  const { data: playerOrders, isLoading: playerOrdersLoading } =
    trpc.playerOrder.listPlayerOrdersConcealed.useQuery({
      where: {
        gameId,
        orderStatus: OrderStatus.PENDING,
        stockRoundId: currentPhase?.stockRoundId,
        orderType: OrderType.OPTION,
      },
    });

  if (isLoading) return <div>Loading...</div>;
  if (!optionsContracts) return <div>No options contracts found</div>;
  console.log("currentPhase", currentPhase);
  return (
    <div>
      <h1 className="text-2xl">Derivatives Options Contracts</h1>
      <div className="flex gap-2">
        <div className="border border-slate-100 rounded-md p-4 flex flex-col justify-center items-center">
          <div className="text-xl font-bold">FOR SALE</div>
          <div className="my-2 flex flex-col gap-2">
            {optionsContracts.map((optionContract) => (
              <OptionContract
                key={optionContract.id}
                contract={optionContract}
                isInteractive
              />
            ))}
          </div>
        </div>
      </div>

      {(currentPhase?.name == PhaseName.STOCK_ACTION_RESULT ||
        currentPhase?.name == PhaseName.STOCK_ACTION_REVEAL) && (
        <div className="flex flex-col gap-2 justify-center items-center mt-4">
          <div className="text-xl font-bold">
            Players Who Have Placed Orders Here
          </div>
          <div className="flex gap-2 justify-center items-center">
            {playerOrders?.map((playerOrder) => (
              <div key={playerOrder.id}>
                <PlayerAvatar player={playerOrder.Player} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Derivatives;
