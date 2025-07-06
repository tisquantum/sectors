'use client';

import { cn } from '@/lib/utils';
import { Marketing } from '../Marketing/Marketing';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MarketingCreation } from '../Marketing/MarketingCreation';

interface MarketingSlot {
  id: string;
  phase: number;
  isAvailable: boolean;
  isOccupied: boolean;
  campaign?: {
    id: string;
    brandModifier: number;
    workers: number;
    resources: { type: ResourceType; price: number }[];
  };
}

interface MarketingSlotsProps {
  companyId: string;
  gameId: string;
}

const MOCK_CAMPAIGNS = [
  {
    id: 'campaign-1',
    brandModifier: 2,
    workers: 1,
    resources: [
      { type: 'CONSUMER_DISCRETIONARY' as ResourceType, price: 15 },
    ],
  },
];

const SLOT_CONFIG: MarketingSlot[] = [
  { 
    id: 'slot-2', 
    phase: 2, 
    isAvailable: true, 
    isOccupied: true,
    campaign: MOCK_CAMPAIGNS[0]
  },
  { id: 'slot-4', phase: 3, isAvailable: true, isOccupied: false },
  { id: 'slot-5', phase: 4, isAvailable: true, isOccupied: false },
];

export function MarketingSlots({ companyId, gameId }: MarketingSlotsProps) {
  const [showMarketingCreation, setShowMarketingCreation] = useState(false);

  const handleSlotClick = (slot: MarketingSlot) => {
    if (slot.isAvailable && !slot.isOccupied) {
      setShowMarketingCreation(true);
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
              'relative w-full rounded border transition-all flex items-center justify-center',
              slot.isOccupied ? 'h-auto' : 'h-8',
              slot.isAvailable 
                ? 'border-purple-400/60 bg-purple-400/10 text-purple-300' 
                : 'border-gray-600/40 bg-gray-700/30 text-gray-500',
              slot.isOccupied && 'border-purple-400 bg-purple-400/20 text-purple-200',
              slot.isAvailable && !slot.isOccupied && 'hover:bg-purple-400/20 cursor-pointer'
            )}
          >
            {slot.isOccupied && slot.campaign ? (
              <Marketing
                id={slot.campaign.id}
                brandModifier={slot.campaign.brandModifier}
                workers={slot.campaign.workers}
                resources={slot.campaign.resources}
              />
            ) : (
              <span className="text-xs font-medium">
                {slot.phase}
              </span>
            )}
            {slot.isOccupied && !slot.campaign && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
      {showMarketingCreation && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <MarketingCreation
            companyId={companyId}
            gameId={gameId}
            onClose={() => {
              setShowMarketingCreation(false);
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
} 