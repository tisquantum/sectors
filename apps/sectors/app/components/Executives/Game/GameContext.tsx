import { ReactNode, useEffect } from "react";
import { useAuthUser } from "../../AuthUser.context";
import { usePusherSubscription } from "@sectors/app/hooks/pusher";
import { ExecutivePhaseName } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";

export const GameProvider: React.FC<{
  gameId: string;
  children: ReactNode;
}> = ({ gameId, children }) => {
  const { user } = useAuthUser();
  const channel = usePusherSubscription(gameId);
  const {
    data: gameState,
    refetch: refetchGameState,
    isLoading: isLoadingGameState,
    isError: gameStateIsError,
  } = trpc.executiveGame.getExecutiveGame.useQuery({
    id: gameId,
  });
  const {
    data: player,
    isLoading,
    isError,
    refetch: refetchAuthPlayer,
  } = trpc.player.getPlayer.useQuery(
    { where: { userId: user?.id, gameId: gameId } },
    { enabled: !!user }
  );
  useEffect(() => {
    if (!channel || !gameId) {
      return;
    }
    const handleNewPhase = (phaseName: ExecutivePhaseName) => {
      refetchGameState();
      refetchAuthPlayer();
    //   if (
    //     phaseName == PhaseName.END_TURN ||
    //     phaseName == PhaseName.START_TURN
    //   ) {
    //     refetchCurrentTurn();
    //   }
    };


    const handleGameEnded = () => {
      refetchGameState();
    };

    channel.bind(EVENT_NEW_PHASE, handleNewPhase);
    channel.bind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);
    channel.bind(EVENT_GAME_ENDED, handleGameEnded);

    return () => {
      channel.unbind(EVENT_NEW_PHASE, handleNewPhase);
      channel.unbind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);
    };
  }, [gameId, channel]);

  useEffect(() => {
    refetchCurrentPhase();
  }, [gameState?.Phase, gameState?.currentPhaseId]);

  if (
    isLoading ||
    gameStateIsLoading ||
    currentTurnIsLoading ||
    researchDeckIsLoading
  )
    return <div>Loading...</div>;
  if (isError || gameStateIsError)
    return <div>Error...</div>;
  if (
    player === undefined ||
    !gameState 
  )
    return null;
  return (
    <GameContext.Provider
      value={{
        gameId,
        authPlayer: player,
        gameState,
        //currentPhase,
        socketChannel: channel,
        refetchAuthPlayer,
        //currentTurn,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
