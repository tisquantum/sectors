'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { FactoryCreation } from '../Factory/FactoryCreation';
import { Factory } from '../Factory/Factory';

interface FactorySlot {
  id: string;
  phase: string;
  isAvailable: boolean;
  isOccupied: boolean;
  blueprintId?: string;
  factory?: {
    id: string;
    size: string;
    workers: number;
    consumers: number;
    resources: { type: string; price: number }[];
    isOperational: boolean;
    totalValue: number;
  };
}

interface FactorySlotsProps {
  companyId: string;
  gameId: string;
}

// Mock factory data
const MOCK_FACTORIES = [
  {
    id: 'factory-1',
    size: 'FACTORY_I',
    workers: 1,
    consumers: 2,
    resources: [
      { type: 'TRIANGLE', price: 10 },
      { type: 'SQUARE', price: 12 },
    ],
    isOperational: true,
    totalValue: 22,
  },
  {
    id: 'factory-2',
    size: 'FACTORY_II',
    workers: 2,
    consumers: 3,
    resources: [
      { type: 'CIRCLE', price: 8 },
      { type: 'SQUARE', price: 15 },
      { type: 'STAR', price: 25 },
    ],
    isOperational: false,
    totalValue: 48,
  },
];

const SLOT_CONFIG: FactorySlot[] = [
  { 
    id: 'slot-1', 
    phase: 'I', 
    isAvailable: true, 
    isOccupied: true,
    factory: MOCK_FACTORIES[0]
  },
  { 
    id: 'slot-2', 
    phase: 'I', 
    isAvailable: true, 
    isOccupied: true,
    factory: MOCK_FACTORIES[1]
  },
  { id: 'slot-3', phase: 'II', isAvailable: false, isOccupied: false },
  { id: 'slot-4', phase: 'III', isAvailable: false, isOccupied: false },
  { id: 'slot-5', phase: 'IV', isAvailable: false, isOccupied: false },
];

export function FactorySlots({ companyId, gameId }: FactorySlotsProps) {
  const [showFactoryCreation, setShowFactoryCreation] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FactorySlot | null>(null);

  const handleSlotClick = (slot: FactorySlot) => {
    if (slot.isAvailable && !slot.isOccupied) {
      setSelectedSlot(slot);
      setShowFactoryCreation(true);
    }
  };

  const getFactorySize = (phase: string) => {
    switch (phase) {
      case 'I': return 'FACTORY_I';
      case 'II': return 'FACTORY_II';
      case 'III': return 'FACTORY_III';
      case 'IV': return 'FACTORY_IV';
      default: return 'FACTORY_I';
    }
  };

  return (
    <>
      <div className="grid grid-cols-5 gap-1">
        {SLOT_CONFIG.map((slot) => (
          <div
            key={slot.id}
            onClick={() => handleSlotClick(slot)}
            className={cn(
              'relative w-full rounded border transition-all flex items-center justify-center cursor-pointer',
              slot.isOccupied ? 'h-auto' : 'h-8',
              slot.isAvailable 
                ? 'border-orange-400/60 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20' 
                : 'border-gray-600/40 bg-gray-700/30 text-gray-500 cursor-not-allowed',
              slot.isOccupied && 'border-orange-400 bg-orange-400/20 text-orange-200 cursor-default',
              slot.isAvailable && !slot.isOccupied && 'hover:border-orange-400'
            )}
          >
            {slot.isOccupied && slot.factory ? (
              <Factory
                id={slot.factory.id}
                size={slot.factory.size}
                workers={slot.factory.workers}
                consumers={slot.factory.consumers}
                resources={slot.factory.resources as any}
                isOperational={slot.factory.isOperational}
                totalValue={slot.factory.totalValue}
              />
            ) : (
              <span className="text-xs font-medium">
                {slot.phase}
              </span>
            )}
            {slot.isOccupied && !slot.factory && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* Factory Creation Modal - Using Portal */}
      {showFactoryCreation && selectedSlot && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <FactoryCreation
            companyId={companyId}
            gameId={gameId}
            factorySize={getFactorySize(selectedSlot.phase) as any}
            onClose={() => {
              setShowFactoryCreation(false);
              setSelectedSlot(null);
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
} 