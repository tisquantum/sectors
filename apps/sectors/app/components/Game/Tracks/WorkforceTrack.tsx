'use client';

import { trpc } from '@sectors/app/trpc';
import { useGame } from '../GameContext';
import { ModernOperationsSection } from '../ModernOperations/layouts';
import { Spinner } from '@nextui-org/react';
import { DEFAULT_WORKERS } from '@server/data/constants';

/**
 * Workforce Track Component
 * 
 * Displays the global workforce pool showing:
 * - Available workers (green spaces)
 * - Allocated workers (gray spaces)
 * - Economy Score (blue ring indicator)
 * 
 * The track has 40 spaces representing workers. As workers are allocated
 * to factories and marketing campaigns, the available pool decreases.
 * The Economy Score indicates overall economic strength based on worker allocation.
 */
export function WorkforceTrack() {
  const { gameId, gameState } = useGame();
  
  // Get game data for workforce info
  const { data: game, isLoading } = trpc.game.getGame.useQuery(
    { id: gameId },
    { enabled: !!gameId }
  );

  if (isLoading) {
    return (
      <ModernOperationsSection title="Workforce Track">
        <div className="flex items-center justify-center h-32">
          <Spinner size="sm" />
        </div>
      </ModernOperationsSection>
    );
  }

  if (!game && !gameState) {
    return null;
  }

  // Use gameState if available, otherwise use game query result
  const availableWorkers = gameState?.workforcePool ?? game?.workforcePool ?? 0;
  const economyScore = gameState?.economyScore ?? game?.economyScore ?? 0;
  const totalWorkers = DEFAULT_WORKERS;
  const allocatedWorkers = totalWorkers - availableWorkers;

  const spaces = Array.from({ length: 40 }, (_, i) => i + 1);

  return (
    <ModernOperationsSection title="Workforce Track">
      <div className="space-y-3">
        {/* Stats Header */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-300">
              Available Workers: <span className="text-green-400">{availableWorkers}</span>
            </span>
            <span className="font-medium text-gray-300">
              Allocated: <span className="text-gray-400">{allocatedWorkers}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-300">Economy Score:</span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-semibold">
              {economyScore}
            </span>
          </div>
        </div>

        {/* Workforce Track Grid */}
        <div className="grid grid-cols-10 gap-1">
          {spaces.map((space) => {
            const isAvailable = space <= availableWorkers;
            const isEconomyScore = space === economyScore;

            return (
              <div
                key={space}
                className={`
                  relative h-16 pt-4 border rounded flex items-center justify-center transition-colors
                  ${
                    isAvailable
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-gray-700/30 border-gray-600/50'
                  }
                  ${isEconomyScore ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-800' : ''}
                `}
                title={
                  isEconomyScore
                    ? `Economy Score: ${economyScore}`
                    : isAvailable
                    ? `Available Worker ${space}`
                    : `Allocated Worker ${space}`
                }
              >
                <div className="absolute top-1 left-1 text-xs text-gray-400">
                  {space}
                </div>
                {isAvailable && (
                  <div className="w-4 h-4 bg-green-500 shadow-md border border-green-700 rounded-full" />
                )}
                {!isAvailable && (
                  <div className="w-4 h-4 bg-gray-600 border border-gray-500 rounded-full opacity-50" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-700/30 border border-gray-600/50 rounded" />
            <span>Allocated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded" />
            <span>Economy Score</span>
          </div>
        </div>
      </div>
    </ModernOperationsSection>
  );
}

