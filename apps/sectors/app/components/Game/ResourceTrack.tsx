'use client';

import { cn } from '@/lib/utils';
import { ResourceType } from '@/components/Company/Factory/Factory.types';

const RESOURCE_COLORS: Record<ResourceType, string> = {
    TRIANGLE: 'bg-yellow-500',
    SQUARE: 'bg-blue-500',
    CIRCLE: 'bg-green-500',
    STAR: 'bg-red-500',
    MATERIALS: 'bg-gray-500',
    INDUSTRIALS: 'bg-orange-500',
    CONSUMER_DISCRETIONARY: 'bg-purple-500',
    CONSUMER_STAPLES: 'bg-pink-500',
    CONSUMER_CYCLICAL: 'bg-red-500',
    CONSUMER_DEFENSIVE: 'bg-indigo-500',
    ENERGY: 'bg-yellow-600',
    HEALTHCARE: 'bg-teal-500',
    TECHNOLOGY: 'bg-cyan-500',
    GENERAL: 'bg-gray-400',
};

interface ResourceTrackProps {
  resourceType: ResourceType;
  title?: string;
  track: number[];
  currentPrice: number;
}

export function ResourceTrack({ resourceType, title, track, currentPrice }: ResourceTrackProps) {
  const resourceColor = RESOURCE_COLORS[resourceType] || 'bg-gray-500';
  const currentIndex = track.indexOf(currentPrice);

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">{title || resourceType}</h3>
        <span className="text-lg font-bold text-green-400">${currentPrice}</span>
      </div>
      <div className="flex flex-wrap gap-1 min-h-12">
        {track.map((price, index) => {
          const hasCube = index <= currentIndex;
          return (
            <div key={index} className="relative flex-1 basis-12 max-w-[48px] h-12 bg-gray-700 rounded flex items-center justify-center min-w-[40px]">
              <span className="relative z-10 text-white font-medium">${price}</span>
              {hasCube && (
                <div className={cn('absolute inset-0 m-1 rounded-sm', resourceColor)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 