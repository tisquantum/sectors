'use client';

import { cn } from '@/lib/utils';

interface FactorySlot {
  id: string;
  phase: string;
  isAvailable: boolean;
  isOccupied: boolean;
  blueprintId?: string;
}

interface FactorySlotsProps {
  companyId: string;
  gameId: string;
  currentPhase: number;
}

const SLOT_CONFIG: FactorySlot[] = [
  { id: 'slot-1', phase: 'I', isAvailable: true, isOccupied: false },
  { id: 'slot-2', phase: 'I', isAvailable: true, isOccupied: false },
  { id: 'slot-3', phase: 'II', isAvailable: false, isOccupied: false },
  { id: 'slot-4', phase: 'III', isAvailable: false, isOccupied: false },
  { id: 'slot-5', phase: 'IV', isAvailable: false, isOccupied: false },
];

export function FactorySlots({ companyId, gameId, currentPhase }: FactorySlotsProps) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {SLOT_CONFIG.map((slot) => (
        <div
          key={slot.id}
          className={cn(
            'relative h-8 w-full rounded border transition-all flex items-center justify-center',
            slot.isAvailable 
              ? 'border-orange-400/60 bg-orange-400/10 text-orange-300' 
              : 'border-gray-600/40 bg-gray-700/30 text-gray-500',
            slot.isOccupied && 'border-orange-400 bg-orange-400/20 text-orange-200',
            slot.isAvailable && !slot.isOccupied && 'hover:bg-orange-400/20 cursor-pointer'
          )}
        >
          <span className="text-xs font-medium">
            {slot.phase}
          </span>
          {slot.isOccupied && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
          )}
        </div>
      ))}
    </div>
  );
} 