'use client';

import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';

/**
 * Centralized hook for fetching all modern operations data
 * Reduces duplication and ensures consistent data fetching across components
 */
export function useModernOperations() {
  const { gameId, currentTurn, gameState } = useGame();

  // Resource tracks - only query if gameId is valid
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  const resources = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );

  // Sectors
  const sectors = trpc.sector.listSectors.useQuery(
    { where: { gameId: isValidGameId ? gameId : '' } },
    { enabled: isValidGameId }
  );

  // Consumption bags for all sectors
  const consumptionBags = trpc.consumptionMarker.getAllConsumptionBags.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { 
      enabled: isValidGameId,
      refetchOnMount: false, // Prevent excessive refetching
      refetchOnWindowFocus: false,
      staleTime: 5000, // 5 seconds
    }
  );

  // Current turn production data
  const productionData = trpc.factoryProduction.getGameTurnProduction.useQuery(
    {
      gameId: isValidGameId ? gameId : '',
      gameTurnId: currentTurn?.id || '',
    },
    { 
      enabled: isValidGameId && !!currentTurn?.id,
      refetchOnMount: false, // Prevent excessive refetching
      refetchOnWindowFocus: false,
      staleTime: 5000, // 5 seconds - data is relatively stable
    }
  );

  // All sectors research progress
  const researchProgress = trpc.modernOperations.getAllSectorsResearchProgress.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );

  return {
    // Data
    resources: resources.data || [],
    sectors: sectors.data || [],
    consumptionBags: consumptionBags.data || [],
    productionData: productionData.data || [],
    researchProgress: researchProgress.data || [],
    
    // Loading states
    isLoading: 
      resources.isLoading || 
      sectors.isLoading || 
      consumptionBags.isLoading || 
      productionData.isLoading ||
      researchProgress.isLoading,
    
    // Error states
    errors: {
      resources: resources.error,
      sectors: sectors.error,
      consumptionBags: consumptionBags.error,
      productionData: productionData.error,
      researchProgress: researchProgress.error,
    },

    // Refetch functions
    refetch: {
      resources: resources.refetch,
      sectors: sectors.refetch,
      consumptionBags: consumptionBags.refetch,
      productionData: productionData.refetch,
      researchProgress: researchProgress.refetch,
    },
  };
}

