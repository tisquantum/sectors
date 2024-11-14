import { trpc } from "@sectors/app/trpc";
import { useExecutiveGame } from "../Game/GameContext";
import { ActionWrapper } from "../Game/ActionWrapper";
import { RiArrowRightSFill } from "@remixicon/react";
import DebounceButton from "../../General/DebounceButton";

export const PlayerPassed = ({ playerId }: { playerId: string }) => {
  const { gameId, isAuthPlayerPhasing, authPlayer, currentTurn } =
    useExecutiveGame();
  const passAction = trpc.executiveGame.playerPass.useMutation();
  if (!gameId) return <div>Game ID not found</div>;
  const playerPasses = currentTurn?.playerPasses || [];

  // Check if the player has already passed
  const hasPlayerPassed = playerPasses.some(
    (pass) => pass.playerId === playerId
  );

  return (
    <>
      {isAuthPlayerPhasing && authPlayer?.id === playerId ? (
        <ActionWrapper
          acceptCallback={() => {
            return new Promise<void>((resolve) => {
              passAction.mutate(
                { gameId, playerId },
                {
                  onSettled: () => {
                    resolve();
                  },
                }
              );
            });
          }}
        >
          <div className="text-sm rounded-md bg-slate-600 p-2 flex justify-center items-center">
            Pass
          </div>
        </ActionWrapper>
      ) : hasPlayerPassed ? (
        <div className="text-sm text-gray-400">Passed</div>
      ) : null}
    </>
  );
};
