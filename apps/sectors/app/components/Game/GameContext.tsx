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
  ResearchDeck,
} from "@server/prisma/prisma.client";
import {
  GameState,
  PlayerWithPlayerOrders,
  PlayerWithShares,
  ResearchDeckWithCards,
} from "@server/prisma/prisma.types";
import { usePusherSubscription } from "@sectors/app/hooks/pusher";
import * as PusherTypes from "pusher-js";
import {
  EVENT_GAME_ENDED,
  EVENT_NEW_PHASE,
  EVENT_NEW_PLAYER_ORDER_PLAYER_ID,
  EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD,
  getGameChannelId,
} from "@server/pusher/pusher.types";
interface GameContextProps {
  gameId: string;
  authPlayer: PlayerWithPlayerOrders | null;
  gameState: GameState;
  currentPhase?: Phase;
  socketChannel: PusherTypes.Channel | null;
  playersWithShares: PlayerWithShares[];
  refetchPlayersWithShares: () => void;
  refetchAuthPlayer: () => void;
  currentTurn: GameTurn;
  researchDeck: ResearchDeckWithCards;
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
  const { data: currentPhase, refetch: refetchCurrentPhase } =
    trpc.phase.getPhase.useQuery({ where: { id: gameState?.currentPhaseId } });

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
  const {
    data: researchDeck,
    isLoading: researchDeckIsLoading,
    error: researchDeckError,
    refetch: researchDeckRefetch,
  } = trpc.researchDeck.getResearchDeckFirst.useQuery({
    where: { gameId },
  });

  useEffect(() => {
    if (!channel || !gameId) {
      return;
    }
    const handleNewPhase = (phaseName: PhaseName) => {
      refetchGameState();
      refetchAuthPlayer();
      refetchPlayersWithShares();
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
  if (isError || gameStateIsError || currentTurnIsError || researchDeckError)
    return <div>Error...</div>;
  if (
    player === undefined ||
    !gameState ||
    !playersWithShares ||
    !currentTurn ||
    !researchDeck
  )
    return null;
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
        refetchPlayersWithShares,
        currentTurn,
        researchDeck,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
