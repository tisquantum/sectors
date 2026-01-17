'use client';

import { cn } from '@/lib/utils';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { Tooltip, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import { RiInformationLine } from '@remixicon/react';
import { sectorColors } from '@server/data/gameData';

// Map ResourceType to SectorName for sector resources
const RESOURCE_TYPE_TO_SECTOR_NAME: Record<ResourceType, string | null> = {
    TRIANGLE: null, // Global resource
    SQUARE: null, // Global resource
    CIRCLE: null, // Global resource
    MATERIALS: 'Materials',
    INDUSTRIALS: 'Industrial',
    CONSUMER_DISCRETIONARY: 'Consumer Discretionary',
    CONSUMER_STAPLES: 'Consumer Staples',
    CONSUMER_CYCLICAL: 'Consumer Cyclical',
    CONSUMER_DEFENSIVE: 'Consumer Defensive',
    ENERGY: 'Energy',
    HEALTHCARE: 'Healthcare',
    TECHNOLOGY: 'Technology',
    GENERAL: null, // No specific sector
};

// Global resource colors (for TRIANGLE, SQUARE, CIRCLE)
const GLOBAL_RESOURCE_COLORS: Record<ResourceType, string> = {
    TRIANGLE: 'bg-yellow-500',
    SQUARE: 'bg-blue-500',
    CIRCLE: 'bg-green-500',
    MATERIALS: 'bg-gray-500', // Fallback
    INDUSTRIALS: 'bg-orange-500', // Fallback
    CONSUMER_DISCRETIONARY: 'bg-purple-500', // Fallback
    CONSUMER_STAPLES: 'bg-pink-500', // Fallback
    CONSUMER_CYCLICAL: 'bg-red-500', // Fallback
    CONSUMER_DEFENSIVE: 'bg-indigo-500', // Fallback
    ENERGY: 'bg-yellow-600', // Fallback
    HEALTHCARE: 'bg-teal-500', // Fallback
    TECHNOLOGY: 'bg-cyan-500', // Fallback
    GENERAL: 'bg-gray-400', // Fallback
};

// Get color for a resource type - returns hex for sector resources, Tailwind class for global
function getResourceColor(resourceType: ResourceType): { hex: string | null; tailwindClass: string } {
    const sectorName = RESOURCE_TYPE_TO_SECTOR_NAME[resourceType];
    if (sectorName && sectorColors[sectorName]) {
        // Use sector color (hex)
        return { hex: sectorColors[sectorName], tailwindClass: '' };
    }
    // Use global resource color (Tailwind class)
    return { hex: null, tailwindClass: GLOBAL_RESOURCE_COLORS[resourceType] || 'bg-gray-500' };
}

interface ResourceTrackProps {
  resourceType: ResourceType;
  title?: string;
  track: number[];
  currentPrice: number;
  breakdown?: { factories: number; researchMilestones: number; trackPosition?: number } | undefined;
}

export function ResourceTrack({ resourceType, title, track, currentPrice, breakdown }: ResourceTrackProps) {
  const { hex: resourceColorHex, tailwindClass: resourceColorClass } = getResourceColor(resourceType);
  const isSectorResource = resourceColorHex !== null;
  const currentIndex = track.indexOf(currentPrice);
  // trackPosition IS the number of resources consumed (0 = none, 1 = one consumed, etc.)
  // The display shows trackPosition + 1 boxes filled because position 0 shows 1 box, position 1 shows 2 boxes, etc.
  // But the actual consumption count is just trackPosition
  const totalConsumed = breakdown?.trackPosition !== undefined ? breakdown.trackPosition : currentIndex;
  const accountedFor = (breakdown?.factories || 0) + (breakdown?.researchMilestones || 0);
  const unaccountedFor = totalConsumed - accountedFor;

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">{title || resourceType}</h3>
          {breakdown && (
            <Popover placement="top" showArrow>
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                  <RiInformationLine size={16} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-gray-900 border border-gray-700">
                <div className="p-3 space-y-2 min-w-[200px]">
                  <div className="text-sm font-semibold text-white mb-2">Resource Consumption Breakdown</div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Consumed:</span>
                      <span className="text-white font-semibold">{totalConsumed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">From Factories:</span>
                      <span className="text-orange-400">{breakdown.factories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">From Research Milestones:</span>
                      <span className="text-blue-400">{breakdown.researchMilestones}</span>
                    </div>
                    {unaccountedFor > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Unaccounted:</span>
                        <span className="text-yellow-400">({unaccountedFor})</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-gray-700 text-gray-500 text-xs">
                      Each factory consumes 1 sector resource. Research Stage II, III, and IV each consume 1 resource (economies of scale).
                      {unaccountedFor > 0 && (
                        <div className="mt-1 text-yellow-400">
                          Note: {unaccountedFor} resource(s) consumed from other sources (check game logs for details).
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <span className="text-lg font-bold text-green-400">${currentPrice}</span>
      </div>
      <div className="flex flex-wrap gap-1 min-h-12">
        {track.map((price, index) => {
          const hasCube = index <= currentIndex;
          return (
            <div key={index} className="relative flex-1 basis-12 max-w-[48px] h-12 bg-gray-700 rounded flex items-center justify-center min-w-[40px]">
              <span className="relative z-10 text-white font-medium">${price}</span>
              {hasCube && (
                <div 
                  className={cn('absolute inset-0 m-1 rounded-sm border-2 border-black', !isSectorResource && resourceColorClass)}
                  style={isSectorResource && resourceColorHex ? { backgroundColor: resourceColorHex } : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 