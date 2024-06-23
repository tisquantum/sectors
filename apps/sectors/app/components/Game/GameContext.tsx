"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useAuthUser } from "../AuthUser.context";
import { trpc } from "@sectors/app/trpc";
import { Game, Phase, Player } from "@server/prisma/prisma.client";
import { GameState } from "@server/prisma/prisma.types";
import { usePusherSubscription } from "@sectors/app/hooks/pusher";
import * as PusherTypes from "pusher-js";
import { EVENT_NEW_PLAYER_ORDER_PLAYER_ID } from "@server/pusher/pusher.types";
interface GameContextProps {
  gameId: string;
  authPlayer: Player;
  gameState: GameState;
  currentPhase?: Phase;
  socketChannel: PusherTypes.Channel | null;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const useGame = (): GameContextProps => {
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
  const {
    data: gameState,
    isLoading: gameStateIsLoading,
    isError: gameStateIsError,
  } = trpc.game.getGameState.useQuery({ gameId });
  //get auth player based on user id and game id
  const {
    data: player,
    isLoading,
    isError,
    refetch: refetchAuthPlayer,
  } = trpc.player.getPlayer.useQuery(
    {
      where: { userId: user?.id, gameId: gameId },
    },
    { enabled: !!user }
  );
  const [currentPhase, setCurrentPhase] = useState<Phase | undefined>(
    gameState?.Phase.find((phase) => phase.id === gameState?.currentPhaseId)
  );

  const channel = usePusherSubscription(gameId); // Use the custom hook

  useEffect(() => {
    console.log(
      "updating current phase",
      gameState?.currentPhaseId,
      gameState?.Phase
    );
    setCurrentPhase(
      gameState?.Phase.find((phase) => phase.id === gameState?.currentPhaseId)
    );
  }, [gameState?.Phase, gameState?.currentPhaseId]);

  useEffect(() => {
    channel?.bind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrderPlayerId)
  }, [channel]);

  const handleNewPlayerOrderPlayerId = (data: { playerId: string }) => {
    if (data.playerId === player?.id) {
      //update action counters
      refetchAuthPlayer();
    }
  };

  if (isLoading || gameStateIsLoading) return <div>Loading...</div>;
  if (isError || gameStateIsError) return <div>Error...</div>;
  if (!player || !gameState) return null; // Handle undefined player, game state, or phase data

  return (
    <GameContext.Provider
      value={{ gameId, authPlayer: player, gameState, currentPhase, socketChannel: channel }}
    >
      {children}
    </GameContext.Provider>
  );
};
