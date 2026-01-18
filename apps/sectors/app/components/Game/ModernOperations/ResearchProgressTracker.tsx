'use client';

import { trpc } from '@sectors/app/trpc';
import { RESEARCH_COSTS_BY_PHASE } from '@server/data/constants';

interface Props {
  gameId: string;
}

const getResearchStageName = (stage: number): string => {
  return `Stage ${stage}`;
};

const getUnlockedFactorySizes = (stage: number): string[] => {
  if (stage === 1) return ['Factory I'];
  if (stage === 2) return ['Factory I', 'Factory II'];
  if (stage === 3) return ['Factory II', 'Factory III'];
  return ['Factory III', 'Factory IV'];
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
          // Calculate research stage from researchMarker (0-3 = Stage 1, 4-6 = Stage 2, 7-9 = Stage 3, 10-12+ = Stage 4)
          const researchMarker = sector.researchMarker || 0;
          let researchStage = 1;
          if (researchMarker >= 10) {
            researchStage = 4;
          } else if (researchMarker >= 7) {
            researchStage = 3;
          } else if (researchMarker >= 4) {
            researchStage = 2;
          }

          const nextMilestone = researchStage < 4 ? researchStage + 1 : 4;
          const requiredMarkers = nextMilestone === 2 ? 4 : nextMilestone === 3 ? 7 : nextMilestone === 4 ? 10 : 12;
          const progressPercentage = researchStage === 4 ? 100 : ((researchMarker / requiredMarkers) * 100);
          const unlockedSizes = getUnlockedFactorySizes(researchStage);

          return (
            <div key={sector.sectorId} className="sector-progress bg-gray-900 p-4 rounded border border-gray-700">
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-white">
                    {sector.sectorName.replace(/_/g, ' ')}
                  </h5>
                  <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                    {getResearchStageName(researchStage)}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {researchMarker} / {requiredMarkers} markers
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
                {nextMilestone <= 4 && researchStage < 4 && (
                  <span className="text-xs text-gray-500">
                    → Next: Stage {nextMilestone} ({requiredMarkers - researchMarker} markers needed)
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

