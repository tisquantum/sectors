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
import { usePusher } from "../Pusher.context";
import { EVENT_NEW_PHASE, getGameChannelId } from "@server/pusher/pusher.types";

interface GameContextProps {
  gameId: string;
  authPlayer: Player;
  gameState: GameState;
  currentPhase?: Phase;
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
  const utils = trpc.useUtils();
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
  } = trpc.player.getPlayer.useQuery(
    {
      where: { userId: user?.id, gameId: gameId },
    },
    { enabled: !!user }
  );
  const { pusher } = usePusher();
  const [currentPhase, setCurrentPhase] = useState<Phase | undefined>(
    gameState?.Phase.find((phase) => phase.id === gameState.currentPhaseId)
  );

  useEffect(() => {
    if (!pusher || !gameId) return;

    console.log("Subscribing to game channel");
    const channel = pusher.subscribe(getGameChannelId(gameId));

    const handleNewPhase = (data: { game: GameState; phase: Phase }) => {
      console.log("New Phase:", data);
      // utils.phase.getPhase.setData(
      //   { where: { id: data.phase.id } },
      //   data.phase
      // );
      //I don't believe we need this because the state update below should trigger a new query.
      utils.game.getGameState.setData(
        { gameId },
        (oldData: GameState | undefined | null) =>
          oldData
            ? { ...oldData, currentPhaseId: data.phase.id }
            : { ...data.game, currentPhaseId: data.phase.id }
      );
      setCurrentPhase(
        data.game.Phase.find((phase) => phase.id === data.game.currentPhaseId)
      );
    };

    channel.bind(EVENT_NEW_PHASE, handleNewPhase);

    return () => {
      console.log("Unsubscribing from game channel");
      channel.unbind(EVENT_NEW_PHASE, handleNewPhase);
      channel.unsubscribe();
    };
  }, [pusher, gameId, utils]);

  if (isLoading || gameStateIsLoading) return <div>Loading...</div>;
  if (isError || gameStateIsError) return <div>Error...</div>;
  if (!player || !gameState) return null; // Handle undefined player, game state, or phase data

  return (
    <GameContext.Provider
      value={{ gameId, authPlayer: player, gameState, currentPhase }}
    >
      {children}
    </GameContext.Provider>
  );
};
