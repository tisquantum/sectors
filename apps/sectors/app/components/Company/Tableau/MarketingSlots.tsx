'use client';

import { cn } from '@/lib/utils';
import { Marketing } from '../Marketing/Marketing';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MarketingCreation } from '../Marketing/MarketingCreation';
import { trpc } from '@sectors/app/trpc';
import { getSectorResourceForSectorName } from '@server/data/constants';
import { SectorName, PhaseName } from '@server/prisma/prisma.client';
import { useGame } from '../../Game/GameContext';

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

// Helper to get max marketing slots based on technology level (same as factories)
const getMaxMarketingSlots = (technologyLevel: number): number => {
  switch (technologyLevel) {
    case 1: return 2;
    case 2: return 3;
    case 3: return 4;
    case 4: return 5;
    default: return 2;
  }
};

export function MarketingSlots({ companyId, gameId }: MarketingSlotsProps) {
  const { currentPhase } = useGame();
  const [showMarketingCreation, setShowMarketingCreation] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<MarketingSlot | null>(null);

  // Check if we're in the MODERN_OPERATIONS phase
  const isModernOperationsPhase = currentPhase?.name === PhaseName.MODERN_OPERATIONS;

  // Fetch company to get sector info
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

  // Fetch real marketing campaigns
  const { data: campaigns, isLoading } = trpc.marketing.getCompanyCampaigns.useQuery({
    companyId,
    gameId,
  });

  // Get sector resource type for this company
  const sectorResourceType = useMemo(() => {
    if (!company?.Sector?.sectorName) return ResourceType.GENERAL;
    return getSectorResourceForSectorName(company.Sector.sectorName as SectorName);
  }, [company]);

  // Get technology level to determine slot availability
  const technologyLevel = company?.Sector?.technologyLevel || 0;
  const maxSlots = getMaxMarketingSlots(technologyLevel);

  // Build slot configuration from real campaign data
  const SLOT_CONFIG: MarketingSlot[] = useMemo(() => {
    const slots: MarketingSlot[] = [
      { id: 'slot-1', phase: 1, isAvailable: true, isOccupied: false },
      { id: 'slot-2', phase: 2, isAvailable: maxSlots >= 2, isOccupied: false },
      { id: 'slot-3', phase: 3, isAvailable: maxSlots >= 3, isOccupied: false },
      { id: 'slot-4', phase: 4, isAvailable: maxSlots >= 4, isOccupied: false },
      { id: 'slot-5', phase: 5, isAvailable: maxSlots >= 5, isOccupied: false },
    ];

    if (!campaigns) return slots;

    // Map campaigns to slots by slot number
    // Handle slot: 0 (default/unset) as slot 1 (index 0)
    // Also handle 1-indexed slots (1-5) by converting to 0-indexed array position
    campaigns.forEach((campaign) => {
      let slotIndex: number;
      if (campaign.slot === 0) {
        // Default/unset slot (0) should be treated as first slot (index 0)
        slotIndex = 0;
      } else {
        // Slots are 1-indexed (1-5), convert to 0-indexed array position (0-4)
        slotIndex = campaign.slot - 1;
      }
      
      if (slotIndex >= 0 && slotIndex < slots.length) {
        slots[slotIndex] = {
          ...slots[slotIndex],
          isOccupied: true,
          isAvailable: true,
          campaign: {
            id: campaign.id,
            brandModifier: campaign.brandBonus,
            workers: campaign.workers,
            resources: [
              {
                type: sectorResourceType,
                price: 0, // Marketing campaigns don't have resource prices
              },
            ],
          },
        };
      }
    });

    return slots;
  }, [campaigns, maxSlots, sectorResourceType]);

  const handleSlotClick = (slot: MarketingSlot) => {
    // Only allow clicks during MODERN_OPERATIONS phase
    if (!isModernOperationsPhase) return;
    if (slot.isAvailable && !slot.isOccupied) {
      setSelectedSlot(slot);
      setShowMarketingCreation(true);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`loading-${i}`}
            className="w-full h-8 rounded border border-gray-600/40 bg-gray-700/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

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
              slot.isOccupied && 'border-purple-400 bg-purple-400/20 text-purple-200 cursor-default',
              // Only allow interaction during MODERN_OPERATIONS phase
              isModernOperationsPhase && slot.isAvailable && !slot.isOccupied
                ? 'border-purple-400/60 bg-purple-400/10 text-purple-300 cursor-pointer hover:bg-purple-400/20'
                : 'border-gray-600/40 bg-gray-700/30 text-gray-500 cursor-not-allowed',
              // Dim available slots if not in correct phase
              !isModernOperationsPhase && slot.isAvailable && !slot.isOccupied && 'opacity-50'
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
              setSelectedSlot(null);
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
} 