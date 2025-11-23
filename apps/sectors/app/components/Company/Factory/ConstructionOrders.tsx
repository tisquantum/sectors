'use client';

import { useMemo } from 'react';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';
import { ResourceIcon } from '../../Game/ConsumptionPhase/ResourceIcon';
import { Spinner, Chip } from '@nextui-org/react';
import { RiTimeLine, RiHistoryLine, RiErrorWarningFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { ResourceType } from './Factory.types';

interface ConstructionOrdersProps {
  companyId: string;
  gameId: string;
  showHistory?: boolean;
}

/**
 * Component to display outstanding factory construction orders and history
 */
export function ConstructionOrders({ companyId, gameId, showHistory = true }: ConstructionOrdersProps) {
  const { currentTurn } = useGame();

  // Get outstanding orders (not yet resolved)
  const { data: outstandingOrders, isLoading: ordersLoading } = trpc.factoryConstruction.getOutstandingOrders.useQuery(
    {
      companyId,
      gameId,
      gameTurnId: currentTurn?.id,
    },
    { enabled: !!currentTurn?.id }
  );

  // Get construction history (factories built)
  const { data: history, isLoading: historyLoading } = trpc.factoryConstruction.getConstructionHistory.useQuery(
    {
      companyId,
      gameId,
    },
    { enabled: showHistory }
  );

  // Get resource prices to calculate order costs
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  const { data: resources } = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );

  // Create price lookup map
  const resourcePriceMap = useMemo(() => {
    if (!resources) return new Map<ResourceType, number>();
    const map = new Map<ResourceType, number>();
    resources.forEach((resource) => {
      map.set(resource.type as ResourceType, resource.price);
    });
    return map;
  }, [resources]);

  if (ordersLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  const hasOutstanding = outstandingOrders && outstandingOrders.length > 0;
  const hasHistory = history && history.length > 0;

  if (!hasOutstanding && !hasHistory) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Outstanding Orders */}
      {hasOutstanding && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wide">
            <RiTimeLine size={16} />
            <span>Outstanding Orders</span>
            <Chip size="sm" variant="flat" color="warning" className="ml-auto">
              {outstandingOrders.length}
            </Chip>
          </div>
          <div className="space-y-2 pl-4 border-l-2 border-orange-500/30">
            {outstandingOrders.map((order) => {
              const totalCost = order.resourceTypes.reduce((sum, type) => {
                const price = resourcePriceMap.get(type as ResourceType) || 0;
                return sum + price;
              }, 0);

              return (
                <div
                  key={order.id}
                  className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-orange-300">
                      {order.size.replace('FACTORY_', '')} Factory
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.resourceTypes.map((type, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <ResourceIcon resourceType={type} size="w-4 h-4" />
                        <span className="text-xs text-gray-400">
                          ${resourcePriceMap.get(type as ResourceType) || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Status:{' '}
                      {order.failureReason ? (
                        <span className="text-red-400">Failed</span>
                      ) : (
                        <span className="text-orange-300">Pending Resolution</span>
                      )}
                    </span>
                    <span className="text-orange-300 font-semibold">
                      Total: ${totalCost}
                    </span>
                  </div>
                  {order.failureReason && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded text-xs">
                      <div className="flex items-start gap-2">
                        <RiErrorWarningFill className="text-red-400 mt-0.5 flex-shrink-0" size={14} />
                        <span className="text-red-300">{order.failureReason}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Construction History */}
      {showHistory && hasHistory && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wide">
            <RiHistoryLine size={16} />
            <span>Construction History</span>
            <Chip size="sm" variant="flat" color="primary" className="ml-auto">
              {history.length}
            </Chip>
          </div>
          <div className="space-y-2 pl-4 border-l-2 border-blue-500/30 max-h-48 overflow-y-auto">
            {history.map((factory) => (
              <div
                key={factory.id}
                className={cn(
                  'bg-blue-500/10 border rounded-lg p-2 space-y-1',
                  factory.isOperational
                    ? 'border-blue-500/30'
                    : 'border-yellow-500/30 bg-yellow-500/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-300">
                    {factory.size.replace('FACTORY_', '')} Factory - Slot {factory.slot}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(factory.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {factory.resourceTypes.map((type, idx) => (
                    <ResourceIcon key={idx} resourceType={type} size="w-4 h-4" />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={factory.isOperational ? 'success' : 'warning'}
                  >
                    {factory.isOperational ? 'Operational' : 'Under Construction'}
                  </Chip>
                  <span className="text-gray-400">
                    Workers: <span className="text-gray-300">{factory.workers}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

