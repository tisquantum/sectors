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
import { Game, Phase, PhaseName, Player } from "@server/prisma/prisma.client";
import { GameState } from "@server/prisma/prisma.types";
import { usePusherSubscription } from "@sectors/app/hooks/pusher";
import * as PusherTypes from "pusher-js";
import { EVENT_NEW_PHASE, EVENT_NEW_PLAYER_ORDER_PLAYER_ID, EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD, getGameChannelId } from "@server/pusher/pusher.types";
interface GameContextProps {
  gameId: string;
  authPlayer: Player;
  gameState: GameState;
  currentPhase?: Phase;
  socketChannel: PusherTypes.Channel | null;
  refetchAuthPlayer: () => void;
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
  const channel = usePusherSubscription(gameId);
  const {
    data: gameState,
    isLoading: gameStateIsLoading,
    isError: gameStateIsError,
    refetch: refetchGameState,
  } = trpc.game.getGameState.useQuery({ gameId });
  const {
    data: player,
    isLoading,
    isError,
    refetch: refetchAuthPlayer,
  } = trpc.player.getPlayer.useQuery(
    { where: { userId: user?.id, gameId: gameId } },
    { enabled: !!user }
  );
  const { refetch: refetchPlayersWithShares,  } = trpc.game.getPlayersWithShares.useQuery(
    { gameId },
    {
      refetchOnMount: false,
    }
  );
  const [currentPhase, setCurrentPhase] = useState<Phase | undefined>(
    gameState?.Phase.find((phase) => phase.id === gameState?.currentPhaseId)
  );
  const { refetch: refetchPlayerOrder } = trpc.playerOrder.listPlayerOrdersWithCompany.useQuery({
    where: { stockRoundId: currentPhase?.stockRoundId, playerId: player?.id },
  });

  useEffect(() => {
    if (!channel || !gameId) {
      console.log("early return pusher subscription");
      return;
    }
    const handleNewPhase = (phaseName: PhaseName) => {
      console.log('refetching game state')
      refetchGameState();
      if(phaseName == PhaseName.STOCK_RESOLVE_MARKET_ORDER) {
        refetchPlayersWithShares();
      }
    };

    const handleNewPlayerOrder = (data: EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD) => {
      console.log("New player order, updating player order list.");
      refetchPlayerOrder();
    };

    channel.bind(EVENT_NEW_PHASE, handleNewPhase);
    channel.bind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);

    return () => {
      console.log("Unsubscribing from game channel");
      channel.unbind(EVENT_NEW_PHASE, handleNewPhase);
      channel.unbind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);
    };
  }, [gameId, channel]);

  useEffect(() => {
    setCurrentPhase(gameState?.Phase.find((phase) => phase.id === gameState?.currentPhaseId));
  }, [gameState?.Phase, gameState?.currentPhaseId]);

  if (isLoading || gameStateIsLoading) return <div>Loading...</div>;
  if (isError || gameStateIsError) return <div>Error...</div>;
  if (!player || !gameState) return null;

  return (
    <GameContext.Provider value={{ gameId, authPlayer: player, gameState, currentPhase, socketChannel: channel, refetchAuthPlayer }}>
      {children}
    </GameContext.Provider>
  );
};
