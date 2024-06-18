"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAuthUser } from "../AuthUser.context";
import { trpc } from "@sectors/app/trpc";
import { Player } from "@server/prisma/prisma.client";

interface GameContextProps {
  gameId: string;
  authPlayer: Player;
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
  return (
    <GameContext.Provider value={{ gameId, authPlayer: player }}>{children}</GameContext.Provider>
  );
};
