'use client';

import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';

/**
 * Hook for company-specific modern operations data
 */
export function useCompanyOperations(companyId: string) {
  const { gameId, currentTurn } = useGame();

  // Workforce status
  const workforce = trpc.modernOperations.getCompanyWorkforceStatus.useQuery(
    { companyId, gameId },
    { enabled: !!companyId && !!gameId }
  );

  // Company production for current turn
  const production = trpc.factoryProduction.getCompanyProductionForTurn.useQuery(
    {
      companyId,
      gameTurnId: currentTurn?.id || '',
    },
    { enabled: !!companyId && !!gameId && !!currentTurn?.id }
  );

  // Company production history
  const productionHistory = trpc.factoryProduction.getCompanyProductionHistory.useQuery(
    { companyId, gameId },
    { enabled: !!companyId && !!gameId }
  );

  // Company factories
  const factories = trpc.factory.getCompanyFactories.useQuery(
    { companyId, gameId },
    { enabled: !!companyId && !!gameId }
  );

  return {
    workforce: workforce.data,
    production: production.data || [],
    productionHistory: productionHistory.data || [],
    factories: factories.data || [],
    isLoading: workforce.isLoading || production.isLoading || productionHistory.isLoading || factories.isLoading,
    errors: {
      workforce: workforce.error,
      production: production.error,
      productionHistory: productionHistory.error,
      factories: factories.error,
    },
  };
}

