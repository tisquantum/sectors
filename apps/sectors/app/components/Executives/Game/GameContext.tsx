"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthUser } from "../../AuthUser.context";
import { usePusherSubscription } from "@sectors/app/hooks/pusher";
import {
  ExecutiveGameTurn,
  ExecutivePhase,
  ExecutivePhaseName,
  ExecutivePlayer,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import {
  EVENT_EXECUTIVE_NEW_PHASE,
  EVENT_PING_PLAYERS,
} from "@server/pusher/pusher.types";
import {
  ExecutiveGameTurnWithRelations,
  ExecutiveGameWithRelations,
  ExecutivePlayerWithRelations,
} from "@server/prisma/prisma.types";
import * as PusherTypes from "pusher-js";

interface GameContextProps {
  gameId: string;
  authPlayer: ExecutivePlayerWithRelations | null;
  isAuthPlayerPhasing: boolean;
  gameState: ExecutiveGameWithRelations;
  currentPhase?: ExecutivePhase;
  socketChannel: PusherTypes.Channel | null;
  refetchAuthPlayer: () => void;
  currentTurn: ExecutiveGameTurnWithRelations;
  pingCounter: number;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const useExecutiveGame = (): GameContextProps => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

export const GameProvider: React.FC<{
  gameId: string;
  children: ReactNode;
}> = ({ gameId, children }) => {
  const { user } = useAuthUser();
  const [isAuthPlayerPhasing, setIsAuthPlayerPhasing] = useState(false);
  const channel = usePusherSubscription(gameId);
  const [pingCounter, setPingCounter] = useState(0);
  const {
    data: gameState,
    refetch: refetchGameState,
    isLoading: isLoadingGameState,
    isError: gameStateIsError,
  } = trpc.executiveGame.getExecutiveGame.useQuery({
    id: gameId,
  });
  const {
    data: currentTurn,
    refetch: refetchCurrentTurn,
    isLoading: currentTurnIsLoading,
  } = trpc.executiveGameTurn.getLatestTurn.useQuery({
    gameId: gameId,
  });
  const {
    data: currentPhase,
    refetch: refetchCurrentPhase,
    isLoading: isLoadingCurrentPhase,
  } = trpc.executivePhase.getCurrentPhase.useQuery({
    gameId: gameId,
  });
  const {
    data: player,
    isLoading,
    isError,
    refetch: refetchAuthPlayer,
  } = trpc.executivePlayer.getExecutivePlayerByUserIdAndGameId.useQuery(
    { userId: user?.id || "", gameId: gameId },
    { enabled: !!user }
  );
  console.log("player authPlayer", player, isError);
  useEffect(() => {
    if (!channel || !gameId) {
      return;
    }
    const handleNewPhase = (phaseName: ExecutivePhaseName) => {
      refetchGameState();
      refetchAuthPlayer();
      refetchCurrentPhase();
      refetchCurrentTurn();
    };

    const handleGameEnded = () => {
      refetchGameState();
    };

    channel.bind(
      EVENT_EXECUTIVE_NEW_PHASE,
      ({ phaseName }: { phaseName: ExecutivePhaseName }) => {
        handleNewPhase(phaseName);
      }
    );
    channel.bind(EVENT_PING_PLAYERS, () => {
      if (currentPhase?.phaseName) {
        handleNewPhase(currentPhase.phaseName);
      }
      setPingCounter((prev) => prev + 1);
    });

    return () => {
      channel.unbind(EVENT_EXECUTIVE_NEW_PHASE, handleNewPhase);
    };
  }, [gameId, channel]);

  useEffect(() => {
    refetchCurrentPhase();
  }, [gameState?.phases.length]);

  useEffect(() => {
    console.log("gameState player refetch", gameState);
    if(gameState && gameState.players.length > 0) {
      refetchGameState();
    }
  }, [gameState?.players.length]);

  useEffect(() => {
    if (!currentPhase) {
      return;
    }
    setIsAuthPlayerPhasing(player?.id === currentPhase?.activePlayerId);
  }, [currentPhase?.id, player]);

  if (isLoading || currentTurnIsLoading) {
    return <div>Loading...</div>;
  }
  if (!currentTurn) {
    return <div>No current turn</div>;
  }
  if (isError || gameStateIsError) return <div>Error...</div>;
  if (player === undefined || !gameState) return null;
  return (
    <GameContext.Provider
      value={{
        gameId,
        authPlayer: player,
        gameState,
        socketChannel: channel,
        refetchAuthPlayer,
        currentPhase,
        currentTurn,
        isAuthPlayerPhasing,
        pingCounter,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
