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
  isCEO?: boolean;
}

// Helper to get max marketing slots based on research stage (same as factories)
// Research stages: 0-5 = Stage 1, 6-10 = Stage 2, 11-15 = Stage 3, 16-20+ = Stage 4
const getMaxMarketingSlots = (researchStage: number): number => {
  switch (researchStage) {
    case 1: return 2;
    case 2: return 3;
    case 3: return 4;
    case 4: return 5;
    default: return 2;
  }
};

// Calculate research stage from researchMarker
const getResearchStage = (researchMarker: number): number => {
  if (researchMarker >= 16) return 4;
  if (researchMarker >= 11) return 3;
  if (researchMarker >= 6) return 2;
  return 1;
};

export function MarketingSlots({ companyId, gameId, isCEO = false }: MarketingSlotsProps) {
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

  // Get research stage to determine slot availability
  const researchMarker = company?.Sector?.researchMarker || 0;
  const researchStage = getResearchStage(researchMarker);
  const maxSlots = getMaxMarketingSlots(researchStage);

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

    // Assign campaigns to slots sequentially, filling from left to right
    // This ensures that if you have 2 campaigns, they appear in slots 1 and 2
    let nextAvailableSlotIndex = 0;
    
    campaigns.forEach((campaign) => {
      // Find the next available slot that's not yet occupied
      while (nextAvailableSlotIndex < slots.length && slots[nextAvailableSlotIndex].isOccupied) {
        nextAvailableSlotIndex++;
      }
      
      // If we've found an available slot, assign the campaign to it
      if (nextAvailableSlotIndex < slots.length && slots[nextAvailableSlotIndex].isAvailable) {
        slots[nextAvailableSlotIndex] = {
          ...slots[nextAvailableSlotIndex],
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
        nextAvailableSlotIndex++;
      }
    });

    return slots;
  }, [campaigns, maxSlots, sectorResourceType]);

  const handleSlotClick = (slot: MarketingSlot) => {
    // Only allow clicks during MODERN_OPERATIONS phase and if user is CEO
    if (!isModernOperationsPhase || !isCEO) return;
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
              // Only allow interaction during MODERN_OPERATIONS phase and if user is CEO
              isModernOperationsPhase && isCEO && slot.isAvailable && !slot.isOccupied
                ? 'border-purple-400/60 bg-purple-400/10 text-purple-300 cursor-pointer hover:bg-purple-400/20'
                : 'border-gray-600/40 bg-gray-700/30 text-gray-500 cursor-not-allowed',
              // Dim available slots if not in correct phase or not CEO
              (!isModernOperationsPhase || !isCEO) && slot.isAvailable && !slot.isOccupied && 'opacity-50'
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