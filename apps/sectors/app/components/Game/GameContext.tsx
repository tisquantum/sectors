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
import {
  Game,
  GameTurn,
  Phase,
  PhaseName,
  Player,
} from "@server/prisma/prisma.client";
import { GameState, PlayerWithShares } from "@server/prisma/prisma.types";
import { usePusherSubscription } from "@sectors/app/hooks/pusher";
import * as PusherTypes from "pusher-js";
import {
  EVENT_NEW_PHASE,
  EVENT_NEW_PLAYER_ORDER_PLAYER_ID,
  EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD,
  getGameChannelId,
} from "@server/pusher/pusher.types";
interface GameContextProps {
  gameId: string;
  authPlayer: Player;
  gameState: GameState;
  currentPhase?: Phase;
  socketChannel: PusherTypes.Channel | null;
  playersWithShares: PlayerWithShares[];
  refetchAuthPlayer: () => void;
  currentTurn: GameTurn;
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
    data: currentTurn,
    isLoading: currentTurnIsLoading,
    isError: currentTurnIsError,
    refetch: refetchCurrentTurn,
  } = trpc.gameTurn.getCurrentGameTurn.useQuery({ gameId });
  const {
    data: player,
    isLoading,
    isError,
    refetch: refetchAuthPlayer,
  } = trpc.player.getPlayer.useQuery(
    { where: { userId: user?.id, gameId: gameId } },
    { enabled: !!user }
  );
  const { data: playersWithShares, refetch: refetchPlayersWithShares } =
    trpc.game.getPlayersWithShares.useQuery({ gameId });
  const [currentPhase, setCurrentPhase] = useState<Phase | undefined>(
    gameState?.Phase.find((phase) => phase.id === gameState?.currentPhaseId)
  );
  const { refetch: refetchPlayerOrder } =
    trpc.playerOrder.listPlayerOrdersWithCompany.useQuery(
      {
        where: {
          stockRoundId: currentPhase?.stockRoundId,
          playerId: player?.id,
        },
      },
      { enabled: !!currentPhase?.stockRoundId }
    );

  useEffect(() => {
    if (!channel || !gameId) {
      return;
    }
    const handleNewPhase = (phaseName: PhaseName) => {
      console.log('new phase', phaseName);
      refetchGameState();
      refetchAuthPlayer();
      if (
        phaseName == PhaseName.STOCK_RESOLVE_MARKET_ORDER ||
        phaseName == PhaseName.OPERATING_PRODUCTION ||
        phaseName == PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE
      ) {
        console.log('refetching players with shares');
        refetchPlayersWithShares();
      }
      if (
        phaseName == PhaseName.END_TURN ||
        phaseName == PhaseName.START_TURN
      ) {
        refetchCurrentTurn();
      }
    };

    const handleNewPlayerOrder = (
      data: EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD
    ) => {
      refetchPlayerOrder();
    };

    channel.bind(EVENT_NEW_PHASE, handleNewPhase);
    channel.bind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);

    return () => {
      channel.unbind(EVENT_NEW_PHASE, handleNewPhase);
      channel.unbind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);
    };
  }, [gameId, channel]);

  useEffect(() => {
    setCurrentPhase(
      gameState?.Phase.find((phase) => phase.id === gameState?.currentPhaseId)
    );
  }, [gameState?.Phase, gameState?.currentPhaseId]);

  if (isLoading || gameStateIsLoading || currentTurnIsLoading)
    return <div>Loading...</div>;
  if (isError || gameStateIsError || currentTurnIsError)
    return <div>Error...</div>;
  if (!player || !gameState || !playersWithShares || !currentTurn) return null;
  return (
    <GameContext.Provider
      value={{
        gameId,
        authPlayer: player,
        gameState,
        currentPhase,
        socketChannel: channel,
        refetchAuthPlayer,
        playersWithShares,
        currentTurn,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
