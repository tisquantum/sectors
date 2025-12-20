'use client';

import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';
import { ModernOperationsLayout, ModernOperationsSection } from '../layouts';
import { Spinner } from '@nextui-org/react';
import { ResourceIcon } from '../../ConsumptionPhase/ResourceIcon';
import { useMemo } from 'react';
import { FACTORY_CUSTOMER_LIMITS } from '@server/data/constants';
import { RiErrorWarningFill } from '@remixicon/react';
import { cn } from '@/lib/utils';

/**
 * Factory Construction Resolve Phase
 * Shows results of factory construction orders that were just processed
 */
export function FactoryConstructionResolvePhase() {
  const { gameId, gameState, currentTurn } = useGame();

  // Query factories for each company in the game
  const companyQueries = useMemo(() => {
    return gameState?.Company?.map(company => 
      trpc.factory.getCompanyFactoriesWithProduction.useQuery(
        {
          companyId: company.id,
          gameId,
          gameTurnId: currentTurn?.id,
        },
        { enabled: !!gameId && !!company.id }
      )
    ) || [];
  }, [gameState?.Company, gameId, currentTurn?.id]);

  // Also query outstanding orders to see what was supposed to be built
  const orderQueries = useMemo(() => {
    return gameState?.Company?.map(company =>
      trpc.factoryConstruction.getOutstandingOrders.useQuery(
        {
          companyId: company.id,
          gameId,
          gameTurnId: currentTurn?.id,
        },
        { enabled: !!gameId && !!company.id && !!currentTurn?.id }
      )
    ) || [];
  }, [gameState?.Company, gameId, currentTurn?.id]);

  const isLoading = companyQueries.some(q => q.isLoading) || orderQueries.some(q => q.isLoading);
  
  // Combine all factories from all companies
  const allFactories = useMemo(() => {
    return companyQueries.flatMap(q => q.data || []);
  }, [companyQueries]);

  // Filter to factories that are under construction (not operational yet)
  // Also check if they were created in this turn (recently created factories)
  const constructedFactories = useMemo(() => {
    return allFactories.filter(f => !f.isOperational);
  }, [allFactories]);

  // Get all outstanding orders
  const outstandingOrders = useMemo(() => {
    return orderQueries.flatMap(q => q.data || []);
  }, [orderQueries]);

  // Group orders by company (always compute, used conditionally)
  const ordersByCompany = useMemo(() => {
    const grouped: Record<string, typeof outstandingOrders> = {};
    outstandingOrders.forEach(order => {
      if (!grouped[order.companyId]) {
        grouped[order.companyId] = [];
      }
      grouped[order.companyId].push(order);
    });
    return grouped;
  }, [outstandingOrders]);

  // Group factories by company (always compute at top level)
  const factoriesByCompany = useMemo(() => {
    const grouped: Record<string, typeof constructedFactories> = {};
    constructedFactories.forEach(factory => {
      if (!grouped[factory.companyId]) {
        grouped[factory.companyId] = [];
      }
      grouped[factory.companyId].push(factory);
    });
    return grouped;
  }, [constructedFactories]);

  if (isLoading) {
    return (
      <ModernOperationsLayout
        title="Factory Construction Results"
        description="Loading construction results..."
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  // Show outstanding orders if no factories were created (resolution may have failed or not happened yet)
  if (!constructedFactories || constructedFactories.length === 0) {
    if (outstandingOrders.length > 0) {

      return (
        <ModernOperationsLayout
          title="Factory Construction Results"
          description="Results from factory construction phase"
        >
          <ModernOperationsSection>
            <div className="space-y-4">
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4">
                <p className="text-yellow-300 font-medium mb-1">⚠️ Pending Resolution</p>
                <p className="text-gray-400 text-sm">
                  Factory construction orders are pending resolution. This may indicate that resolution hasn&apos;t occurred yet, or construction failed (e.g., insufficient cash).
                </p>
              </div>
              {Object.entries(ordersByCompany).map(([companyId, orders]) => {
                const company = gameState?.Company?.find(c => c.id === companyId);
                return (
                  <div key={companyId} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                    <div className="font-semibold text-gray-200">
                      {company?.name || 'Unknown Company'} - {orders.length} Pending Order{orders.length !== 1 ? 's' : ''}
                    </div>
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className={cn(
                          'border rounded p-3 space-y-2',
                          order.failureReason
                            ? 'bg-red-900/20 border-red-700/50'
                            : 'bg-gray-800/50 border-gray-700'
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-300">
                            {order.size.replace('FACTORY_', '')} Factory
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {order.resourceTypes.map((type, idx) => (
                            <ResourceIcon key={idx} resourceType={type} size="w-4 h-4" />
                          ))}
                        </div>
                        {order.failureReason ? (
                          <div className="space-y-1">
                            <div className="text-xs text-red-400 font-medium">
                              Status: Failed
                            </div>
                            <div className="p-2 bg-red-900/30 border border-red-700/50 rounded text-xs">
                              <div className="flex items-start gap-2">
                                <RiErrorWarningFill className="text-red-400 mt-0.5 flex-shrink-0" size={14} />
                                <span className="text-red-300">{order.failureReason}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-yellow-400">
                            Status: Pending - Waiting for resolution
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </ModernOperationsSection>
        </ModernOperationsLayout>
      );
    }

    return (
      <ModernOperationsLayout
        title="Factory Construction Results"
        description="Results from factory construction phase"
      >
        <ModernOperationsSection>
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">No factories were constructed this phase</p>
            <p className="text-gray-500 text-sm">
              No factory construction orders were submitted or all orders were already resolved.
            </p>
          </div>
        </ModernOperationsSection>
      </ModernOperationsLayout>
    );
  }

  return (
    <ModernOperationsLayout
      title="Factory Construction Results"
      description="Results from factory construction phase"
    >
      <div className="space-y-6">
        {Object.entries(factoriesByCompany).map(([companyId, companyFactories]) => {
          // Get company info from gameState
          const company = gameState?.Company?.find(c => c.id === companyId);
          
          return (
            <ModernOperationsSection 
              key={companyId}
              title={`${company?.name || 'Unknown Company'} - ${companyFactories.length} Factor${companyFactories.length !== 1 ? 'ies' : 'y'} Constructed`}
            >
              <div className="space-y-4">
                {companyFactories.map((factory) => {
                  const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size] || 0;
                  const totalCost = factory.resourceTypes.reduce((sum, type) => {
                    // Note: Actual cost calculation would need resource prices
                    return sum + 100; // Placeholder
                  }, 0);

                  return (
                    <div
                      key={factory.id}
                      className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-lg font-semibold text-gray-100">
                            {factory.size.replace('_', ' ')} (Slot {factory.slot})
                          </div>
                          <div className="text-sm text-gray-400">
                            Workers: {factory.workers} / Max Capacity: {maxCustomers} customers
                          </div>
                          {!factory.isOperational && (
                            <div className="inline-block mt-2 px-2 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded text-xs">
                              Under Construction - Will be operational next turn
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Total Cost</div>
                          <div className="text-lg font-bold text-orange-400">
                            ~${totalCost.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-300 font-medium mb-2">Schematic:</div>
                        <div className="flex gap-3 flex-wrap">
                          {factory.resourceTypes.map((type, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <ResourceIcon resourceType={type} size="w-5 h-5" />
                              <span className="text-gray-400 text-sm">{type.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-600">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Sector:</span>
                            <span className="ml-2 text-gray-200">
                              {factory.Sector?.name || factory.Sector?.sectorName || 'Unknown'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <span className={`ml-2 font-medium ${factory.isOperational ? 'text-green-400' : 'text-yellow-400'}`}>
                              {factory.isOperational ? 'Operational' : 'Under Construction'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ModernOperationsSection>
          );
        })}
      </div>
    </ModernOperationsLayout>
  );
}

