'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { FactoryCreation } from '../Factory/FactoryCreation';
import { Factory } from '../Factory/Factory';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';
import { FACTORY_CUSTOMER_LIMITS } from '@server/data/constants';

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
  currentPhase?: number;
}

export function FactorySlots({ companyId, gameId, currentPhase }: FactorySlotsProps) {
  const { currentPhase: gamePhase } = useGame();
  const [showFactoryCreation, setShowFactoryCreation] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FactorySlot | null>(null);

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

  // Build slot configuration from real factory data
  const SLOT_CONFIG: FactorySlot[] = useMemo(() => {
    const slots: FactorySlot[] = [
      { id: 'slot-1', phase: 'I', isAvailable: true, isOccupied: false },
      { id: 'slot-2', phase: 'II', isAvailable: false, isOccupied: false },
      { id: 'slot-3', phase: 'III', isAvailable: false, isOccupied: false },
      { id: 'slot-4', phase: 'IV', isAvailable: false, isOccupied: false },
      { id: 'slot-5', phase: 'IV', isAvailable: false, isOccupied: false },
    ];

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
  }, [factories, productionMap, resourcePriceMap]);

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