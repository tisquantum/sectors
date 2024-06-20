"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAuthUser } from "../AuthUser.context";
import { trpc } from "@sectors/app/trpc";
import { Player } from "@server/prisma/prisma.client";
import { GameState } from "@server/prisma/prisma.types";

interface GameContextProps {
  gameId: string;
  authPlayer: Player;
  gameState: GameState;
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
  const { data: gameState, isLoading: gameStateIsLoading, isError: gameStateIsError } = trpc.game.getGameState.useQuery(
    { gameId }
  );
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
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;
  if (player == undefined) return null; //TODO: handle this case for possible spectators.

  if(gameStateIsLoading) return <div>Loading...</div>;
  if(gameStateIsError) return <div>Error...</div>;
  if (gameState == undefined) return null; //TODO: handle this case for possible spectators.
  return (
    <GameContext.Provider value={{ gameId, authPlayer: player, gameState }}>{children}</GameContext.Provider>
  );
};
