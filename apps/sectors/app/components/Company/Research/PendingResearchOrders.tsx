'use client';

import { useMemo } from 'react';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';
import { Spinner, Chip } from '@nextui-org/react';
import { RiTimeLine, RiTestTubeFill, RiErrorWarningFill } from '@remixicon/react';
import { PhaseName } from '@server/prisma/prisma.client';
import { cn } from '@/lib/utils';

interface PendingResearchOrdersProps {
  companyId: string;
  gameId: string;
}

/**
 * Component to display pending research orders (created this turn, not yet resolved)
 */
export function PendingResearchOrders({ companyId, gameId }: PendingResearchOrdersProps) {
  const { currentTurn, currentPhase } = useGame();

  // Only show pending research orders during MODERN_OPERATIONS phase
  const isModernOperationsPhase = currentPhase?.name === PhaseName.MODERN_OPERATIONS;

  // Get pending research orders (created this turn)
  const { data: pendingOrders, isLoading: ordersLoading } = 
    trpc.modernOperations.getPendingResearchOrders.useQuery(
      {
        companyId,
        gameId,
        gameTurnId: currentTurn?.id,
      },
      { enabled: !!currentTurn?.id && isModernOperationsPhase }
    );

  if (!isModernOperationsPhase) {
    return null; // Don't show pending orders outside of MODERN_OPERATIONS phase
  }

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!pendingOrders || pendingOrders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wide">
        <RiTimeLine size={16} />
        <span>Pending Research</span>
        <Chip size="sm" variant="flat" color="primary" className="ml-auto">
          {pendingOrders.length}
        </Chip>
      </div>
      <div className="space-y-2 pl-4 border-l-2 border-blue-500/30">
        {pendingOrders.map((order) => (
          <div
            key={order.id}
            className={cn(
              "rounded-lg p-2 space-y-1",
              order.failureReason
                ? "bg-red-900/20 border border-red-700/50"
                : "bg-blue-500/10 border border-blue-500/30"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiTestTubeFill 
                  size={14} 
                  className={order.failureReason ? "text-red-400" : "text-blue-400"} 
                />
                <span className={cn(
                  "text-xs font-medium",
                  order.failureReason ? "text-red-300" : "text-blue-300"
                )}>
                  Research Investment
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'Invalid Date'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className={cn(
                "text-gray-400",
                order.failureReason && "text-red-300"
              )}>
                Cost: <span className={cn(
                  "font-semibold",
                  order.failureReason ? "text-red-400" : "text-blue-300"
                )}>${order.cost}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Status:{' '}
                {order.failureReason ? (
                  <span className="text-red-400">Failed</span>
                ) : order.researchProgressGain !== null ? (
                  <span className="text-green-400">Completed: +{order.researchProgressGain}</span>
                ) : (
                  <span className="text-blue-300">Pending Resolution</span>
                )}
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
        ))}
      </div>
    </div>
  );
}

