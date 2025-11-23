import { trpc } from "@sectors/app/trpc";
import { ActionWrapper } from "../Game/ActionWrapper";
import { useExecutiveGame } from "../Game/GameContext";
import { toast } from "sonner";

export const TakeNoBid = () => {
  const { authPlayer, currentTurn } = useExecutiveGame();
  const takeNoBidMutation =
    trpc.executiveInfluence.takeNoInfluenceBid.useMutation();
  if (!authPlayer) {
    return <div>Auth player not found</div>;
  }
  if (!currentTurn) {
    return <div>Current turn not found</div>;
  }
  return (
    <ActionWrapper
      acceptCallback={() => {
        return new Promise<void>((resolve) => {
          takeNoBidMutation.mutate(
            {
              gameId: currentTurn.gameId,
              gameTurnId: currentTurn.id,
              toPlayerId: authPlayer.id,
            },
            {
              onError: (error) => {
                toast.error("Error taking no bid: " + error.message);
              },
              onSettled: () => {
                resolve();
              },
            }
          );
        });
      }}
    >
      <div className="text-sm rounded-md bg-slate-600 p-2 flex justify-center items-center">
        Take No Bid
      </div>
    </ActionWrapper>
  );
};
