'use client';

import { trpc } from '@sectors/app/trpc';
import { useGame } from '../GameContext';
import { ModernOperationsSection } from '../ModernOperations/layouts';
import { Spinner, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import { DEFAULT_WORKERS, ECONOMY_SCORE_VALUES } from '@server/data/constants';
import { sectorColors } from '@server/data/gameData';
import { useMemo } from 'react';
import { RiInformationLine } from '@remixicon/react';

/**
 * Workforce Track Component
 * 
 * Displays the global workforce pool showing:
 * - Available workers (green spaces)
 * - Allocated workers (sector-colored cubes)
 * - Economy Score (blue ring indicator)
 * 
 * The track has 40 spaces representing workers. As workers are allocated
 * to factories, marketing campaigns, and research, they are replaced with
 * sector-colored cubes showing where workers have been allocated.
 * The Economy Score is driven by the worker track - as workers are put to work,
 * the spaces reflect an improving economy. The economy score is determined by
 * the rightmost allocated worker's position.
 */
export function WorkforceTrack() {
  const { gameId, gameState } = useGame();
  
  // Get game data for workforce info
  const { data: game, isLoading: isLoadingGame } = trpc.game.getGame.useQuery(
    { id: gameId },
    { enabled: !!gameId }
  );

  // Get worker allocation by sector
  const { data: workerAllocationBySector, isLoading: isLoadingAllocation } = 
    trpc.modernOperations.getWorkerAllocationBySector.useQuery(
      { gameId },
      { enabled: !!gameId }
    );

  // Use gameState if available, otherwise use game query result
  // Calculate these values BEFORE early returns to ensure hooks are called consistently
  const totalWorkers = DEFAULT_WORKERS;
  
  // Calculate allocated workers from worker allocation data
  // Only calculate if we have the data (not loading)
  const totalAllocatedFromData = (!isLoadingAllocation && workerAllocationBySector)
    ? workerAllocationBySector.reduce(
        (sum, sector) => sum + sector.totalWorkers,
        0
      )
    : 0;
  
  // Get workforcePool from game state
  // If workforcePool is 0 or undefined, and we have no allocated workers,
  // assume it should be the default (game just started or not yet calculated)
  const workforcePoolFromDB = gameState?.workforcePool ?? game?.workforcePool ?? 0;
  
  // Calculate available workers:
  // - If workforcePool is set (> 0), use it
  // - Otherwise, calculate from total - allocated (but only if we have allocation data)
  // - If we don't have allocation data yet, default to totalWorkers (all available)
  const availableWorkers = workforcePoolFromDB > 0 
    ? workforcePoolFromDB 
    : (!isLoadingAllocation && workerAllocationBySector)
      ? Math.max(0, totalWorkers - totalAllocatedFromData)
      : totalWorkers; // Default to all available if we don't have data yet
  
  const allocatedWorkers = totalWorkers - availableWorkers;
  
  // Economy score is determined by the rightmost allocated worker's position
  // Use the economy score array value at that position
  // If no workers allocated, economy score is 8 (first position in array, index 0)
  // If allocatedWorkers = 9, use index 8 (space 9 - 1 = 8) which is 10
  const economyScore = allocatedWorkers > 0 
    ? ECONOMY_SCORE_VALUES[allocatedWorkers - 1] 
    : ECONOMY_SCORE_VALUES[0];

  // Create a mapping of space number to sector color
  // Workers are allocated left to right (starting from space 1), so we need to map which spaces belong to which sectors
  // This hook must be called BEFORE any early returns
  const spaceToSectorMap = useMemo(() => {
    const map: Map<number, { color: string; sectorName: string }> = new Map();
    
    if (!workerAllocationBySector || allocatedWorkers <= 0) return map;

    let currentSpace = 1; // Start from space 1 (top left, going right)
    
    // Sort sectors by total workers (descending) for consistent ordering
    const sortedSectors = [...workerAllocationBySector].sort((a, b) => b.totalWorkers - a.totalWorkers);
    
    for (const sector of sortedSectors) {
      const sectorColor = sectorColors[sector.name] || '#666666';
      
      // Map each worker to a space starting from the left
      for (let i = 0; i < sector.totalWorkers && currentSpace <= allocatedWorkers; i++) {
        map.set(currentSpace, { color: sectorColor, sectorName: sector.name });
        currentSpace++;
      }
    }
    
    return map;
  }, [workerAllocationBySector, allocatedWorkers]);

  const spaces = Array.from({ length: 40 }, (_, i) => i + 1);
  const isLoading = isLoadingGame || isLoadingAllocation;

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
            <Popover placement="top" showArrow>
              <PopoverTrigger>
                <button
                  type="button"
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-semibold hover:bg-blue-500/30 transition-colors flex items-center gap-1 cursor-help"
                  aria-label="Economy Score information"
                >
                  {economyScore}
                  <RiInformationLine size={14} className="text-blue-400/70" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-gray-900 border border-gray-700 max-w-md">
                <div className="p-4 space-y-3">
                  <div className="text-sm font-semibold text-white mb-2">Economy Score Explained</div>
                  <div className="text-xs space-y-2 text-gray-300">
                    <p>
                      <strong className="text-white">What it is:</strong> The Economy Score represents the overall economic strength of the game economy, driven purely by worker allocation on the workforce track.
                    </p>
                    <p>
                      <strong className="text-white">How it works:</strong> As workers are allocated to factories, marketing campaigns, and research, the economy score increases. The score is determined by the rightmost allocated worker&apos;s position on the track.
                    </p>
                    <p>
                      <strong className="text-white">What it&apos;s used for:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Consumer Distribution:</strong> Determines how many consumers can be distributed from the Consumer Pool to sectors each turn</li>
                      <li><strong>Economic Indicator:</strong> Higher scores indicate a stronger economy with more active workers</li>
                      <li><strong>Game Balance:</strong> More allocated workers = stronger economy = more consumer activity</li>
                    </ul>
                    <p className="pt-2 mt-2 border-t border-gray-700 text-gray-400 italic">
                      The track shows economy score values for each position (8, 8, 8, 8, 9, 9...). The current economy score is highlighted with a blue outline at the rightmost allocated worker position.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Economy Score Starting Indicator (when economy score = 8, no workers allocated) */}
        {allocatedWorkers === 0 && (
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded" />
            <span>Economy Score: {economyScore} (starting position, no workers allocated)</span>
          </div>
        )}

        {/* Workforce Track Grid */}
        <div className="grid grid-cols-10 gap-1">
          {spaces.map((space) => {
            // Workers are allocated from left to right, starting at space 1
            // So spaces 1 to allocatedWorkers are allocated, and spaces allocatedWorkers+1 to 40 are available
            const isAvailable = space > allocatedWorkers;
            // The economy score indicator should be at the rightmost allocated worker's position
            const rightmostAllocatedPosition = allocatedWorkers > 0 ? allocatedWorkers : 0;
            // Show economy score indicator at the rightmost allocated position
            const isEconomyScore = allocatedWorkers > 0 && space === rightmostAllocatedPosition;
            const sectorInfo = spaceToSectorMap.get(space);
            // Get the economy score value for this space (space is 1-indexed, array is 0-indexed)
            const spaceEconomyScore = ECONOMY_SCORE_VALUES[space - 1];

            return (
              <div
                key={space}
                className={`
                  relative h-16 pt-4 border rounded flex items-center justify-center transition-colors
                  ${
                    isAvailable
                      ? 'bg-green-500/20 border-green-500/50'
                      : sectorInfo
                      ? 'bg-gray-700/30 border-gray-600/50'
                      : 'bg-gray-700/30 border-gray-600/50'
                  }
                  ${isEconomyScore ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-800' : ''}
                `}
                title={
                  isEconomyScore
                    ? `Economy Score: ${economyScore} (rightmost allocated worker position)`
                    : isAvailable
                    ? `Available Worker - Economy Score: ${spaceEconomyScore}`
                    : sectorInfo
                    ? `Allocated Worker - ${sectorInfo.sectorName} - Economy Score: ${spaceEconomyScore}`
                    : `Allocated Worker - Economy Score: ${spaceEconomyScore}`
                }
              >
                <div className="absolute top-1 left-1 text-xs text-gray-400">
                  {spaceEconomyScore}
                </div>
                {isAvailable && (
                  <div className="w-4 h-4 bg-green-500 shadow-md border border-green-700 rounded-full" />
                )}
                {!isAvailable && sectorInfo && (
                  <div 
                    className="w-4 h-4 shadow-md border border-gray-800 rounded-full" 
                    style={{ 
                      backgroundColor: sectorInfo.color,
                    }}
                  />
                )}
                {!isAvailable && !sectorInfo && (
                  <div className="w-4 h-4 bg-gray-600 border border-gray-500 rounded-full opacity-50" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-700/30 border border-gray-600/50 rounded" />
            <span>Allocated (sector-colored)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded" />
            <span>Economy Score</span>
          </div>
        </div>
        
        {/* Sector Legend */}
        {workerAllocationBySector && workerAllocationBySector.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-2">
            <span className="font-medium">Sectors:</span>
            {workerAllocationBySector.map((sector) => {
              const sectorColor = sectorColors[sector.name] || '#666666';
              return (
                <div key={sector.sectorId} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-800"
                    style={{ backgroundColor: sectorColor }}
                  />
                  <span>{sector.name} ({sector.totalWorkers})</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModernOperationsSection>
  );
}

