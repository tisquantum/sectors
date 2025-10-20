'use client';

import { trpc } from '@sectors/app/trpc';
import { RESEARCH_COSTS_BY_PHASE } from '@server/data/constants';

interface Props {
  gameId: string;
}

const getTechnologyLevelName = (level: number): string => {
  const names = ['Basic', 'Level 1', 'Level 2', 'Level 3', 'Level 4'];
  return names[level] || `Level ${level}`;
};

const getUnlockedFactorySizes = (level: number): string[] => {
  if (level === 0) return ['Factory I'];
  if (level === 1) return ['Factory I', 'Factory II'];
  if (level === 2) return ['Factory I', 'Factory II', 'Factory III'];
  return ['Factory I', 'Factory II', 'Factory III', 'Factory IV'];
};

export function ResearchProgressTracker({ gameId }: Props) {
  const { data: sectorsProgress, isLoading } = 
    trpc.modernOperations.getAllSectorsResearchProgress.useQuery({
      gameId,
    });

  if (isLoading) return <div className="text-gray-400">Loading research progress...</div>;
  if (!sectorsProgress || sectorsProgress.length === 0) return null;

  return (
    <div className="research-progress bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h4 className="font-bold text-white mb-4">Research Progress</h4>
      
      <div className="space-y-4">
        {sectorsProgress.map((sector) => {
          const nextMilestone = sector.technologyLevel + 1;
          const requiredMarkers = RESEARCH_COSTS_BY_PHASE[nextMilestone] || 999;
          const progressPercentage = (sector.researchMarker / requiredMarkers) * 100;
          const unlockedSizes = getUnlockedFactorySizes(sector.technologyLevel);

          return (
            <div key={sector.sectorId} className="sector-progress bg-gray-900 p-4 rounded border border-gray-700">
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-white">
                    {sector.sectorName.replace(/_/g, ' ')}
                  </h5>
                  <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                    {getTechnologyLevelName(sector.technologyLevel)}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {sector.researchMarker} / {requiredMarkers} markers
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-700 rounded overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>

              {/* Unlocked Factory Sizes */}
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500">Unlocked:</span>
                {unlockedSizes.map(size => (
                  <span 
                    key={size}
                    className="px-2 py-1 bg-green-900 text-green-200 rounded text-xs"
                  >
                    {size}
                  </span>
                ))}
                {nextMilestone <= 3 && (
                  <span className="text-xs text-gray-500">
                    → Next: Factory {nextMilestone + 1} ({requiredMarkers - sector.researchMarker} markers needed)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 p-3 bg-gray-900 rounded">
        💡 <strong>Tip:</strong> Submit research actions to advance technology levels and unlock larger factories!
      </div>
    </div>
  );
}

