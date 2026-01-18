'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { FactoryCreation } from '../Factory/FactoryCreation';
import { Factory } from '../Factory/Factory';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';
import { FACTORY_CUSTOMER_LIMITS } from '@server/data/constants';
import { PhaseName, FactorySize, CompanyStatus } from '@server/prisma/prisma.client';
import { Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react';
import { RiInformationLine } from '@remixicon/react';

interface SlotPhase {
  min: FactorySize;
  max: FactorySize;
}

interface FactorySlot {
  id: string;
  phase: string;
  phaseLabel: string; // Display label like "I", "II", "I/II", etc.
  slotNumber: number;
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
  currentPhase?: number;
  isCEO?: boolean;
}

export function FactorySlots({ companyId, gameId, currentPhase, isCEO = false }: FactorySlotsProps) {
  const { currentPhase: gamePhase } = useGame();
  const [showFactoryCreation, setShowFactoryCreation] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FactorySlot | null>(null);
  const [showFutureStages, setShowFutureStages] = useState(false);

  // Check if we're in the MODERN_OPERATIONS phase
  const isModernOperationsPhase = gamePhase?.name === PhaseName.MODERN_OPERATIONS;

  // Fetch company to get sector information
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

  // Fetch real factory data
  const { data: factories, isLoading } = trpc.factory.getCompanyFactories.useQuery({
    companyId,
    gameId,
  });

  // Fetch production data for current turn if available
  const { data: productionData } = trpc.factoryProduction.getCompanyProductionForTurn.useQuery(
    {
      companyId,
      gameTurnId: gamePhase?.id || '',
    },
    { enabled: !!gamePhase?.id }
  );

  // Fetch resource prices
  const { data: resourcePrices } = trpc.resource.getAllResourcePrices.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  // Create production map for quick lookup
  const productionMap = useMemo(() => {
    if (!productionData) return new Map();
    return new Map(productionData.map(p => [p.factoryId, p]));
  }, [productionData]);

  // Create resource price map for quick lookup
  const resourcePriceMap = useMemo(() => {
    if (!resourcePrices) return new Map<string, number>();
    return new Map(resourcePrices.map(r => [r.type, r.price]));
  }, [resourcePrices]);

  // Calculate research stage from sector researchMarker
  const getResearchStage = (researchMarker: number): number => {
    if (researchMarker >= 10) return 4;
    if (researchMarker >= 7) return 3;
    if (researchMarker >= 4) return 2;
    return 1;
  };

  // Get slot phases for a research stage
  const getSlotPhasesForResearchStage = (stage: number): SlotPhase[] => {
    switch (stage) {
      case 1:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
        ];
      case 2:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
        ];
      case 3:
        return [
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_III },
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
        ];
      case 4:
        return [
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_IV },
          { min: FactorySize.FACTORY_IV, max: FactorySize.FACTORY_IV },
        ];
      default:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
        ];
    }
  };

  // Format phase label (e.g., "I", "II", "I/II")
  const formatPhaseLabel = (phase: SlotPhase): string => {
    const minNum = phase.min.toString().replace('FACTORY_', '');
    const maxNum = phase.max.toString().replace('FACTORY_', '');
    if (minNum === maxNum) {
      return minNum;
    }
    return `${minNum}/${maxNum}`;
  };

  // Get current research stage
  const currentResearchStage = useMemo(() => {
    const researchMarker = company?.Sector?.researchMarker || 0;
    return getResearchStage(researchMarker);
  }, [company?.Sector?.researchMarker]);

  // Get slot phases for current stage
  const currentSlotPhases = useMemo(() => {
    return getSlotPhasesForResearchStage(currentResearchStage);
  }, [currentResearchStage]);

  // Build slot configuration from real factory data and current research stage
  const SLOT_CONFIG: FactorySlot[] = useMemo(() => {
    // Only create slots for the current research stage
    const slots: FactorySlot[] = currentSlotPhases.map((phase, index) => ({
      id: `slot-${index + 1}`,
      phase: phase.min.toString().replace('FACTORY_', ''), // Convert to string format for display/creation
      phaseLabel: formatPhaseLabel(phase),
      slotNumber: index + 1,
      isAvailable: true,
      isOccupied: false,
    }));

    if (!factories) return slots;

    // Map factories to slots by slot number
    factories.forEach((factory) => {
      const slotIndex = factory.slot - 1; // Slots are 1-indexed
      if (slotIndex >= 0 && slotIndex < slots.length) {
        const production = productionMap.get(factory.id);
        const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size] || 0;
        
        slots[slotIndex] = {
          ...slots[slotIndex],
          isOccupied: true,
          isAvailable: true,
          factory: {
            id: factory.id,
            size: factory.size,
            workers: factory.workers,
            consumers: production?.customersServed || maxCustomers,
            resources: factory.resourceTypes.map((type, idx) => ({
              type,
              price: resourcePriceMap.get(type) || 0,
            })),
            isOperational: factory.isOperational,
            totalValue: production?.profit || 0,
          },
        };
      }
    });

    return slots;
  }, [factories, productionMap, resourcePriceMap, currentSlotPhases]);

  // Get future stage previews
  const futureStagesPreview = useMemo(() => {
    const stages = [];
    for (let stage = currentResearchStage + 1; stage <= 4; stage++) {
      const slotPhases = getSlotPhasesForResearchStage(stage);
      stages.push({
        stage,
        slots: slotPhases.map((phase, index) => ({
          slotNumber: index + 1,
          label: formatPhaseLabel(phase),
        })),
      });
    }
    return stages;
  }, [currentResearchStage]);

  const handleSlotClick = (slot: FactorySlot) => {
    // Only allow clicks during MODERN_OPERATIONS phase and if user is CEO
    if (!isModernOperationsPhase || !isCEO) return;
    // Only active or insolvent companies can operate
    if (company?.status !== CompanyStatus.ACTIVE && company?.status !== CompanyStatus.INSOLVENT) return;
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="w-full h-8 rounded border border-gray-600/40 bg-gray-700/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Stage {currentResearchStage}</span>
            {futureStagesPreview.length > 0 && (
              <Popover placement="bottom" showArrow>
                <PopoverTrigger>
                  <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <RiInformationLine className="w-3 h-3" />
                    Future Stages
                  </button>
                </PopoverTrigger>
                <PopoverContent className="bg-gray-800 border-gray-700">
                  <div className="p-2 space-y-3">
                    <div className="text-xs font-semibold text-gray-300 mb-2">Future Slot Phases</div>
                    {futureStagesPreview.map(({ stage, slots }) => (
                      <div key={stage} className="space-y-1">
                        <div className="text-xs font-medium text-blue-400">Stage {stage}</div>
                        <div className="flex gap-1 flex-wrap">
                          {slots.map((slot) => (
                            <span
                              key={slot.slotNumber}
                              className="text-xs px-2 py-1 bg-gray-700 rounded border border-gray-600 text-gray-300"
                            >
                              Slot {slot.slotNumber}: {slot.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <div className={cn(
          'grid gap-1',
          SLOT_CONFIG.length === 3 ? 'grid-cols-3' :
          SLOT_CONFIG.length === 4 ? 'grid-cols-4' :
          'grid-cols-5'
        )}>
          {SLOT_CONFIG.map((slot) => (
            <div
              key={slot.id}
              onClick={() => handleSlotClick(slot)}
              className={cn(
                'relative w-full rounded border transition-all flex items-center justify-center',
                slot.isOccupied ? 'h-auto' : 'h-8',
                slot.isOccupied && 'border-orange-400 bg-orange-400/20 text-orange-200 cursor-default',
                // Only allow interaction during MODERN_OPERATIONS phase, if user is CEO, and company is active or insolvent
                isModernOperationsPhase && isCEO && (company?.status === CompanyStatus.ACTIVE || company?.status === CompanyStatus.INSOLVENT) && slot.isAvailable && !slot.isOccupied
                  ? 'border-orange-400/60 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 cursor-pointer hover:border-orange-400'
                  : 'border-gray-600/40 bg-gray-700/30 text-gray-500 cursor-not-allowed',
                // Dim available slots if not in correct phase or not CEO
                (!isModernOperationsPhase || !isCEO) && slot.isAvailable && !slot.isOccupied && 'opacity-50'
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
                  {slot.phaseLabel}
                </span>
              )}
              {slot.isOccupied && !slot.factory && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
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