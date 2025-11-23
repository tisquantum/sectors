'use client';

import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils';

interface WorkerTrackProps {
  totalWorkers: number;
  availableWorkers: number;
  economyScore: number;
  allocatedWorkers: {
    factories: number;
    marketing: number;
    research: number;
  };
}

export function WorkerTrack({
  totalWorkers,
  availableWorkers,
  economyScore,
  allocatedWorkers,
}: WorkerTrackProps) {
  const workers = Array.from({ length: totalWorkers }, (_, i) => i + 1);
  const economyMarkers = [5, 10, 15, 20, 25, 30, 35, 40];

  return (
    <Card className="w-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workforce Track</h3>
        <div className="text-sm text-muted-foreground">
          Available: {availableWorkers}/{totalWorkers}
        </div>
      </div>

      <div className="relative">
        {/* Economy score markers */}
        <div className="mb-2 flex justify-between">
          {economyMarkers.map((marker) => (
            <div
              key={marker}
              className={cn(
                'text-xs',
                marker <= economyScore ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {marker}
            </div>
          ))}
        </div>

        {/* Worker track */}
        <div className="grid grid-cols-10 gap-1">
          {workers.map((worker) => {
            const isAllocated = worker > availableWorkers;
            const allocationType = isAllocated
              ? worker <= availableWorkers + allocatedWorkers.factories
                ? 'factory'
                : worker <=
                  availableWorkers +
                    allocatedWorkers.factories +
                    allocatedWorkers.marketing
                ? 'marketing'
                : 'research'
              : null;

            return (
              <div
                key={worker}
                className={cn(
                  'relative h-8 w-full rounded border transition-colors',
                  isAllocated
                    ? allocationType === 'factory'
                      ? 'border-blue-500 bg-blue-500/10'
                      : allocationType === 'marketing'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-green-500 bg-green-500/10'
                    : 'border-muted bg-background'
                )}
              >
                <div className="flex h-full items-center justify-center text-xs">
                  {worker}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border border-blue-500 bg-blue-500/10" />
            <span>Factories</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border border-purple-500 bg-purple-500/10" />
            <span>Marketing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border border-green-500 bg-green-500/10" />
            <span>Research</span>
          </div>
        </div>
      </div>
    </Card>
  );
} 