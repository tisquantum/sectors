'use client';

import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils';
import { FactorySize } from '@prisma/client';

interface FactorySlot {
  id: string;
  size: FactorySize;
  phase: number;
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
  { id: 'slot-1', size: 'I', phase: 1, isAvailable: true, isOccupied: false },
  { id: 'slot-2', size: 'I', phase: 1, isAvailable: true, isOccupied: false },
  { id: 'slot-3', size: 'II', phase: 2, isAvailable: false, isOccupied: false },
  { id: 'slot-4', size: 'III', phase: 3, isAvailable: false, isOccupied: false },
  { id: 'slot-5', size: 'IV', phase: 4, isAvailable: false, isOccupied: false },
];

export function FactorySlots({ companyId, gameId, currentPhase }: FactorySlotsProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
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
            <div className="text-lg font-bold">{slot.size}</div>
            <div className="text-sm text-muted-foreground">
              {slot.phase}
            </div>
            {slot.isOccupied && (
              <div className="absolute bottom-2 text-xs text-primary">
                Occupied
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
} 