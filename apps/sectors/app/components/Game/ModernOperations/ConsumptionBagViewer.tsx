'use client';

import { trpc } from '@sectors/app/trpc';
import { cn } from '@/lib/utils';

interface Props {
  sectorId: string;
  sectorName: string;
  gameId: string;
}

const RESOURCE_COLORS: Record<string, string> = {
  TRIANGLE: 'bg-yellow-500',
  SQUARE: 'bg-blue-500',
  CIRCLE: 'bg-green-500',
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

export function ConsumptionBagViewer({ sectorId, sectorName, gameId }: Props) {
  const { data: summary, isLoading } = 
    trpc.consumptionMarker.getConsumptionBagSummary.useQuery({
      sectorId,
      gameId,
    });

  if (isLoading) return <div className="text-gray-400">Loading consumption bag...</div>;

  const totalMarkers = summary?.reduce((sum, s) => sum + s.count, 0) || 0;

  return (
    <div className="consumption-bag bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-white">
          {sectorName} Consumption Bag
        </h4>
        <span className="text-gray-400 text-sm">{totalMarkers} markers</span>
      </div>
      
      <div className="space-y-2">
        {summary && summary.length > 0 ? (
          summary.map((item, idx) => {
            const colorClass = RESOURCE_COLORS[item.resourceType] || 'bg-gray-500';
            
            return (
              <div 
                key={idx} 
                className="flex justify-between items-center p-3 bg-gray-900 rounded border border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded', colorClass)} />
                  <span className="text-white">
                    {item.resourceType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs">
                    {item.isPermanent ? (
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                        🔒 Permanent
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-900 text-yellow-200 rounded text-xs">
                        ⏱️ Temporary
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-bold text-white text-lg">{item.count}</span>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center py-4">
            No consumption markers yet
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex gap-4">
        <div className="flex items-center gap-1">
          <span>🔒</span>
          <span>Permanent markers from factory output</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⏱️</span>
          <span>Temporary markers from marketing</span>
        </div>
      </div>
    </div>
  );
}

