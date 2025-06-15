'use client';

import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils';
import { MarketingCampaignTier } from '@prisma/client';

interface MarketingSlot {
  id: string;
  tier: MarketingCampaignTier;
  phase: number;
  isAvailable: boolean;
  isOccupied: boolean;
  campaignId?: string;
}

interface MarketingSlotsProps {
  companyId: string;
  gameId: string;
  currentPhase: number;
}

const SLOT_CONFIG: MarketingSlot[] = [
  { id: 'slot-1', tier: 'TIER_1', phase: 1, isAvailable: true, isOccupied: false },
  { id: 'slot-2', tier: 'TIER_1', phase: 1, isAvailable: true, isOccupied: false },
  { id: 'slot-3', tier: 'TIER_2', phase: 2, isAvailable: false, isOccupied: false },
  { id: 'slot-4', tier: 'TIER_3', phase: 3, isAvailable: false, isOccupied: false },
  { id: 'slot-5', tier: 'TIER_3', phase: 4, isAvailable: false, isOccupied: false },
];

export function MarketingSlots({ companyId, gameId, currentPhase }: MarketingSlotsProps) {
  return (
    <div className="grid grid-cols-5 gap-2 p-2">
      {SLOT_CONFIG.map((slot) => (
        <Card
          key={slot.id}
          className={cn(
            'relative h-16 w-full p-2 transition-all',
            !slot.isAvailable && 'opacity-50',
            slot.isOccupied && 'border-2 border-primary',
            slot.phase <= currentPhase && 'cursor-pointer hover:border-primary'
          )}
        >
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-lg font-bold">
              {slot.tier.replace('TIER_', '')}
            </div>
            <div className="text-sm text-muted-foreground">
              {slot.phase}
            </div>
            {slot.isOccupied && (
              <div className="absolute bottom-2 text-xs text-primary">
                Active Campaign
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
} 