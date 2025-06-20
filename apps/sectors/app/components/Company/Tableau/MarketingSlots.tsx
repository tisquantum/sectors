'use client';

import { cn } from '@/lib/utils';

interface MarketingSlot {
  id: string;
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
  { id: 'slot-2', phase: 2, isAvailable: true, isOccupied: false },
  { id: 'slot-4', phase: 3, isAvailable: false, isOccupied: false },
  { id: 'slot-5', phase: 4, isAvailable: false, isOccupied: false },
];

export function MarketingSlots({ companyId, gameId, currentPhase }: MarketingSlotsProps) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {SLOT_CONFIG.map((slot) => (
        <div
          key={slot.id}
          className={cn(
            'relative h-8 w-full rounded border transition-all flex items-center justify-center',
            slot.isAvailable 
              ? 'border-purple-400/60 bg-purple-400/10 text-purple-300' 
              : 'border-gray-600/40 bg-gray-700/30 text-gray-500',
            slot.isOccupied && 'border-purple-400 bg-purple-400/20 text-purple-200',
            slot.isAvailable && !slot.isOccupied && 'hover:bg-purple-400/20 cursor-pointer'
          )}
        >
          <span className="text-xs font-medium">
            {slot.phase}
          </span>
          {slot.isOccupied && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full"></div>
          )}
        </div>
      ))}
    </div>
  );
} 