'use client';

import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils';

interface ResearchSpace {
  id: string;
  number: number;
  phase: number;
  isUnlocked: boolean;
  hasReward: boolean;
  reward?: {
    type: 'GRANT' | 'MARKET_FAVOR';
    amount: number;
  };
}

interface ResearchTrackProps {
  currentProgress: number;
  currentStage: number;
  spaces: ResearchSpace[];
}

export function ResearchTrack({ 
  currentProgress, 
  currentStage,
  spaces 
}: ResearchTrackProps) {
  return (
    <Card className="w-full p-4">
      <div className="relative">
        {/* Track line */}
        <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-border" />
        
        {/* Spaces */}
        <div className="relative grid grid-cols-10 gap-2">
          {spaces.map((space) => (
            <div
              key={space.id}
              className={cn(
                'relative z-10 flex h-12 w-full items-center justify-center',
                space.number % 5 === 0 && 'mb-8' // Add extra space for stage markers
              )}
            >
              {/* Space circle */}
              <div
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition-colors',
                  space.isUnlocked && 'border-primary bg-primary/10',
                  !space.isUnlocked && 'border-muted bg-background',
                  space.number <= currentProgress && 'border-primary bg-primary',
                  space.number > currentStage * 5 && 'opacity-50'
                )}
              >
                <div className="flex h-full items-center justify-center text-sm">
                  {space.number}
                </div>
              </div>

              {/* Stage marker */}
              {space.number % 5 === 0 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                  <div className="text-xs text-muted-foreground">
                    Stage {space.number / 5}
                  </div>
                  {space.number === 5 && (
                    <div className="text-[10px] text-muted-foreground/70">
                      +0 demand
                    </div>
                  )}
                  {space.number === 10 && (
                    <div className="text-[10px] text-green-400/80">
                      +2 demand
                    </div>
                  )}
                  {space.number === 15 && (
                    <div className="text-[10px] text-green-400/80">
                      +3 demand
                    </div>
                  )}
                  {space.number === 20 && (
                    <div className="text-[10px] text-green-400/80">
                      +5 demand
                    </div>
                  )}
                </div>
              )}

              {/* Reward indicator */}
              {space.hasReward && space.reward && (
                <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-yellow-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 