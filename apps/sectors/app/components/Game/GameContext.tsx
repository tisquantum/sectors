"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
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
  PhaseWithRelations,
  PhaseWithStockRound,
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
  currentPhase?: PhaseWithRelations;
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
  const trpcUtils = trpc.useUtils();
  const gameStateQueryCountRef = useRef(0);
  const {
    data: gameState,
    isLoading: gameStateIsLoading,
    isError: gameStateIsError,
    refetch: refetchGameState,
    error: gameStateError,
  } = trpc.game.getGameState.useQuery(
    { gameId },
    {
      // Prevent excessive refetching
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10000, // 10 seconds
      retry: 1, // Only retry once on failure
      retryDelay: 1000,
    }
  );
  
  // Handle query success
  useEffect(() => {
    if (gameState && !gameStateIsLoading && !gameStateIsError) {
      gameStateQueryCountRef.current += 1;
      if (gameStateQueryCountRef.current % 10 === 0) {
        console.log(`[GameContext] GameState query succeeded ${gameStateQueryCountRef.current} times`);
      }
      if (gameStateQueryCountRef.current > 50) {
        console.error(`[GameContext] POTENTIAL LOOP: GameState query succeeded ${gameStateQueryCountRef.current} times!`);
      }
    }
  }, [gameState, gameStateIsLoading, gameStateIsError]);
  
  // Log 207 status code issues
  useEffect(() => {
    if (gameStateError) {
      console.error(`[GameContext] GameState query error detected:`, gameStateError);
    }
  }, [gameStateError]);
  
  const currentTurnQueryCountRef = useRef(0);
  const {
    data: currentTurn,
    isLoading: currentTurnIsLoading,
    isError: currentTurnIsError,
    error: currentTurnError,
    refetch: refetchCurrentTurn,
  } = trpc.gameTurn.getCurrentGameTurn.useQuery(
    { gameId },
    {
      // Prevent excessive refetching
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10000, // 10 seconds
      retry: 1,
      retryDelay: 1000,
    }
  );
  
  // Handle currentTurn query success
  useEffect(() => {
    if (currentTurn && !currentTurnIsLoading && !currentTurnIsError) {
      currentTurnQueryCountRef.current += 1;
      if (currentTurnQueryCountRef.current % 10 === 0) {
        console.log(`[GameContext] CurrentTurn query succeeded ${currentTurnQueryCountRef.current} times`);
      }
      if (currentTurnQueryCountRef.current > 50) {
        console.error(`[GameContext] POTENTIAL LOOP: CurrentTurn query succeeded ${currentTurnQueryCountRef.current} times!`);
      }
    }
  }, [currentTurn, currentTurnIsLoading, currentTurnIsError]);
  
  // Handle currentTurn query error
  useEffect(() => {
    if (currentTurnError) {
      console.error(`[GameContext] CurrentTurn query error:`, currentTurnError);
    }
  }, [currentTurnError]);
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
  const phaseQueryCountRef = useRef(0);
  const { data: currentPhase, refetch: refetchCurrentPhase, error: phaseError } =
    trpc.phase.getPhase.useQuery(
      { where: { id: gameState?.currentPhaseId } },
      {
        enabled: !!gameState?.currentPhaseId, // Only query if phaseId exists
        // Prevent excessive refetching
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 10000, // 10 seconds
        retry: 1,
        retryDelay: 1000,
      }
    );
  
  // Handle phase query success
  useEffect(() => {
    if (currentPhase) {
      phaseQueryCountRef.current += 1;
      if (phaseQueryCountRef.current % 10 === 0) {
        console.log(`[GameContext] Phase query succeeded ${phaseQueryCountRef.current} times`);
      }
    }
  }, [currentPhase]);
  
  // Handle phase query error
  useEffect(() => {
    if (phaseError) {
      console.error(`[GameContext] Phase query error:`, phaseError);
    }
  }, [phaseError]);

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

  // Use refs to store latest values to avoid recreating handlers
  const refetchGameStateRef = useRef(refetchGameState);
  const refetchAuthPlayerRef = useRef(refetchAuthPlayer);
  const refetchPlayersWithSharesRef = useRef(refetchPlayersWithShares);
  const refetchCurrentTurnRef = useRef(refetchCurrentTurn);
  const refetchPlayerOrderRef = useRef(refetchPlayerOrder);
  const trpcUtilsRef = useRef(trpcUtils);

  // Track render count for debugging
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current % 10 === 0) {
    console.log(`[GameContext] Render count: ${renderCountRef.current}`);
  }

  // Update refs when values change
  useEffect(() => {
    console.log('[GameContext] Updating refs');
    refetchGameStateRef.current = refetchGameState;
    refetchAuthPlayerRef.current = refetchAuthPlayer;
    refetchPlayersWithSharesRef.current = refetchPlayersWithShares;
    refetchCurrentTurnRef.current = refetchCurrentTurn;
    refetchPlayerOrderRef.current = refetchPlayerOrder;
    trpcUtilsRef.current = trpcUtils;
  }, [refetchGameState, refetchAuthPlayer, refetchPlayersWithShares, refetchCurrentTurn, refetchPlayerOrder, trpcUtils]);

  // Track event handler call counts
  const eventCallCountRef = useRef({
    newPhase: 0,
    playerOrder: 0,
    gameEnded: 0,
  });
  
  // Debounce timers for refetches
  const lastRefetchTimeRef = useRef({
    gameState: 0,
    authPlayer: 0,
    playersWithShares: 0,
    currentTurn: 0,
  });

  useEffect(() => {
    if (!channel || !gameId) {
      return;
    }

    console.log('[GameContext] Setting up Pusher event handlers', { gameId, channelName: channel.name });

    const handleNewPhase = (phaseName: PhaseName) => {
      eventCallCountRef.current.newPhase += 1;
      const callCount = eventCallCountRef.current.newPhase;
      
      if (callCount % 5 === 0 || callCount > 20) {
        console.warn(`[GameContext] handleNewPhase called ${callCount} times. Phase: ${phaseName}`);
      }
      
      if (callCount > 50) {
        console.error(`[GameContext] POTENTIAL INFINITE LOOP: handleNewPhase called ${callCount} times! Stopping.`);
        return; // Prevent further execution
      }

      console.log(`[GameContext] handleNewPhase: ${phaseName} (call #${callCount})`);
      
      // Invalidate specific queries before refetching to ensure fresh data
      // Invalidate gameState when IPO prices are resolved to ensure companies show updated IPO prices
      if (phaseName === PhaseName.RESOLVE_SET_COMPANY_IPO_PRICES || 
          phaseName === PhaseName.STOCK_RESOLVE_LIMIT_ORDER) {
        // IPO prices are set during RESOLVE_SET_COMPANY_IPO_PRICES
        // Invalidate gameState to ensure companies show updated ipoAndFloatPrice
        console.log('[GameContext] Invalidating gameState after IPO price resolution');
        trpcUtilsRef.current.game.getGameState.invalidate({ gameId });
      }
      
      if (phaseName === PhaseName.EARNINGS_CALL) {
        // Factory production records created during CONSUMPTION_PHASE resolution
        // Invalidate production queries so consumption phase can show results
        console.log('[GameContext] Invalidating factory production queries');
        trpcUtilsRef.current.factoryProduction.getGameTurnProduction.invalidate();
      }
      
      // Debounce refetches - only refetch if last refetch was > 200ms ago
      const now = Date.now();
      const DEBOUNCE_MS = 200;
      
      if (now - lastRefetchTimeRef.current.gameState > DEBOUNCE_MS) {
        lastRefetchTimeRef.current.gameState = now;
        refetchGameStateRef.current();
      } else {
        console.warn(`[GameContext] Skipping gameState refetch - debounced`);
      }
      
      if (now - lastRefetchTimeRef.current.authPlayer > DEBOUNCE_MS) {
        lastRefetchTimeRef.current.authPlayer = now;
        refetchAuthPlayerRef.current();
      }
      
      if (now - lastRefetchTimeRef.current.playersWithShares > DEBOUNCE_MS) {
        lastRefetchTimeRef.current.playersWithShares = now;
        refetchPlayersWithSharesRef.current();
      }
      
      if (
        phaseName == PhaseName.END_TURN ||
        phaseName == PhaseName.START_TURN
      ) {
        if (now - lastRefetchTimeRef.current.currentTurn > DEBOUNCE_MS) {
          lastRefetchTimeRef.current.currentTurn = now;
          refetchCurrentTurnRef.current();
        }
      }
      
      // Refetch modern operations data on relevant phase changes
      if (phaseName === PhaseName.FACTORY_CONSTRUCTION_RESOLVE) {
        // Resources updated after factory construction
        // Consumption markers added
        // Note: These will auto-refetch if components are using the queries
      }
      if (phaseName === PhaseName.CONSUMPTION_PHASE) {
        // Consumption bags drawn
      }
      if (phaseName === PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE) {
        // Marketing campaigns activated
        // Research progress updated
      }
    };

    const handleNewPlayerOrder = (
      data: EVENT_NEW_PLAYER_ORDER_PLAYER_ID__PAYLOAD
    ) => {
      eventCallCountRef.current.playerOrder += 1;
      const callCount = eventCallCountRef.current.playerOrder;
      
      if (callCount % 10 === 0 || callCount > 50) {
        console.warn(`[GameContext] handleNewPlayerOrder called ${callCount} times`);
      }
      
      if (callCount > 200) {
        console.error(`[GameContext] POTENTIAL INFINITE LOOP: handleNewPlayerOrder called ${callCount} times!`);
        return;
      }

      console.log(`[GameContext] handleNewPlayerOrder (call #${callCount})`);
      refetchPlayerOrderRef.current();
    };

    const handleGameEnded = () => {
      eventCallCountRef.current.gameEnded += 1;
      console.log(`[GameContext] handleGameEnded (call #${eventCallCountRef.current.gameEnded})`);
      refetchGameStateRef.current();
    };

    channel.bind(EVENT_NEW_PHASE, handleNewPhase);
    channel.bind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);
    channel.bind(EVENT_GAME_ENDED, handleGameEnded);

    console.log('[GameContext] Pusher event handlers bound');

    return () => {
      console.log('[GameContext] Cleaning up Pusher event handlers');
      channel.unbind(EVENT_NEW_PHASE, handleNewPhase);
      channel.unbind(EVENT_NEW_PLAYER_ORDER_PLAYER_ID, handleNewPlayerOrder);
      channel.unbind(EVENT_GAME_ENDED, handleGameEnded);
      // Reset call counts on cleanup
      eventCallCountRef.current = {
        newPhase: 0,
        playerOrder: 0,
        gameEnded: 0,
      };
    };
  }, [gameId, channel]);

  const phaseRefetchCountRef = useRef(0);
  const lastPhaseRefetchTimeRef = useRef(0);
  const lastPhaseIdRef = useRef<string | undefined>(undefined);
  const lastPhaseNameRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    const currentPhaseId = gameState?.currentPhaseId;
    const currentPhase = gameState?.Phase?.find(p => p.id === currentPhaseId);
    const currentPhaseName = currentPhase?.name;
    
    // Only refetch if phaseId or phaseName actually changed
    if (currentPhaseId === lastPhaseIdRef.current && currentPhaseName === lastPhaseNameRef.current) {
      console.log(`[GameContext] Phase unchanged, skipping refetch`, {
        phaseId: currentPhaseId,
        phaseName: currentPhaseName,
      });
      return;
    }
    
    // Update refs
    lastPhaseIdRef.current = currentPhaseId || undefined;
    lastPhaseNameRef.current = currentPhaseName;
    
    // Debounce: Don't refetch if called too recently
    const now = Date.now();
    if (now - lastPhaseRefetchTimeRef.current < 500) {
      console.warn(`[GameContext] Skipping phase refetch - too soon (${now - lastPhaseRefetchTimeRef.current}ms ago)`);
      return;
    }
    lastPhaseRefetchTimeRef.current = now;
    
    phaseRefetchCountRef.current += 1;
    const count = phaseRefetchCountRef.current;
    
    if (count % 5 === 0 || count > 20) {
      console.warn(`[GameContext] refetchCurrentPhase called ${count} times`, {
        phase: currentPhaseName,
        phaseId: currentPhaseId,
      });
    }
    
    if (count > 50) {
      console.error(`[GameContext] POTENTIAL INFINITE LOOP: refetchCurrentPhase called ${count} times! Stopping.`);
      return;
    }

    console.log(`[GameContext] Refetching current phase (call #${count})`, {
      oldPhaseId: lastPhaseIdRef.current,
      newPhaseId: currentPhaseId,
      oldPhaseName: lastPhaseNameRef.current,
      newPhaseName: currentPhaseName,
    });
    refetchCurrentPhase();
  }, [gameState?.Phase, gameState?.currentPhaseId, refetchCurrentPhase]);

  // Circuit breaker: If queries are failing or looping excessively, show error
  const hasExcessiveQueries = 
    gameStateQueryCountRef.current > 100 ||
    currentTurnQueryCountRef.current > 100 ||
    phaseQueryCountRef.current > 100;
  
  if (hasExcessiveQueries) {
    console.error('[GameContext] CIRCUIT BREAKER: Excessive queries detected, stopping component');
    return (
      <div className="p-4 text-red-400">
        <h2>Error: Query Loop Detected</h2>
        <p>GameState queries: {gameStateQueryCountRef.current}</p>
        <p>CurrentTurn queries: {currentTurnQueryCountRef.current}</p>
        <p>Phase queries: {phaseQueryCountRef.current}</p>
        <p>Please refresh the page.</p>
      </div>
    );
  }

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
