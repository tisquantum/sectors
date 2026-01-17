'use client';

import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@sectors/app/trpc';
import { cn } from '@/lib/utils';
import { ResourceType } from './Factory.types';
import { ResourceTrackType, FactorySize } from '@server/prisma/prisma.client';
import { getNumberForFactorySize } from '@server/data/helpers';
import { ResourceIcon } from '../../Game/ConsumptionPhase/ResourceIcon';
import { Spinner, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react';
import { RiCloseLine, RiInformationLine, RiErrorWarningFill } from '@remixicon/react';
import { useGame } from '../../Game/GameContext';

const PLOT_FEE_FRESH = 100;

function getBuildErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  const e = error as { message?: string; data?: { json?: { message?: string }; message?: string } };
  if (typeof e?.message === 'string') return e.message;
  if (typeof e?.data?.json?.message === 'string') return e.data.json.message;
  if (typeof e?.data?.message === 'string') return e.data.message;
  return 'Failed to create factory order.';
}

interface FactoryCreationProps {
  companyId: string;
  gameId: string;
  factorySize: FactorySize;
  onClose: () => void;
}

interface ResourceSchematic {
  type: ResourceType;
  quantity: number;
  price: number;
}

// Helper function to get sector resource type
const getSectorResourceType = (sectorName: string): ResourceType => {
  switch (sectorName) {
    case 'MATERIALS':
      return 'MATERIALS';
    case 'INDUSTRIALS':
      return 'INDUSTRIALS';
    case 'CONSUMER_DISCRETIONARY':
      return 'CONSUMER_DISCRETIONARY';
    case 'CONSUMER_STAPLES':
      return 'CONSUMER_STAPLES';
    case 'CONSUMER_CYCLICAL':
      return 'CONSUMER_CYCLICAL';
    case 'CONSUMER_DEFENSIVE':
      return 'CONSUMER_DEFENSIVE';
    case 'ENERGY':
      return 'ENERGY';
    case 'HEALTHCARE':
      return 'HEALTHCARE';
    case 'TECHNOLOGY':
      return 'TECHNOLOGY';
    default:
      return 'GENERAL';
  }
};

const RESOURCE_LIMITS: Record<string, number> = {
  FACTORY_I: 2,
  FACTORY_II: 3,
  FACTORY_III: 4,
  FACTORY_IV: 5,
};

export function FactoryCreation({ 
  companyId, 
  gameId, 
  factorySize, 
  onClose 
}: FactoryCreationProps) {
  const { authPlayer } = useGame();
  
  // Get company data to determine sector
  const company = trpc.company.getCompanyWithSector.useQuery({ id: companyId });
  
  // Get all resources for the game
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  const { data: allResources, isLoading: resourcesLoading } = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );
  
  // Get sector resource type - use sectorName (enum) not name (display name)
  const sectorResourceType = company.data?.Sector?.sectorName 
    ? getSectorResourceType(company.data.Sector.sectorName)
    : 'GENERAL';
  
  // Get sector resource price
  const sectorResource = useMemo(() => {
    if (!allResources) return null;
    return allResources.find(r => r.type === sectorResourceType);
  }, [allResources, sectorResourceType]);
  
  // Initialize with sector resource by default
  const [schematic, setSchematic] = useState<ResourceSchematic[]>(() => {
    // Start with empty array, will be populated by useEffect when sector data loads
    return [];
  });

  const [buildError, setBuildError] = useState<string | null>(null);

  // Update schematic when sector resource becomes available
  useEffect(() => {
    // Only proceed if we have a valid sector resource type (not GENERAL)
    if (sectorResourceType && sectorResourceType !== 'GENERAL' && sectorResource) {
      setSchematic(prev => {
        // If schematic is empty or first item is GENERAL, replace with sector resource
        if (prev.length === 0 || prev[0]?.type === 'GENERAL') {
          // Keep other resources but ensure sector resource is first
          const otherResources = prev.filter((item, i) => 
            i !== 0 && item.type !== sectorResourceType
          );
          return [{
            type: sectorResourceType,
            quantity: 1,
            price: sectorResource.price
          }, ...otherResources];
        }
        // If first item already matches sector resource, just update the price
        if (prev[0]?.type === sectorResourceType) {
          return prev.map((item, i) => 
            i === 0 ? { ...item, price: sectorResource.price } : item
          );
        }
        // If sector resource exists elsewhere, move it to first position
        const withoutSector = prev.filter(item => item.type !== sectorResourceType);
        return [{
          type: sectorResourceType,
          quantity: 1,
          price: sectorResource.price
        }, ...withoutSector];
      });
    }
  }, [sectorResource, sectorResourceType]);

  const trpcUtils = trpc.useUtils();
  const createFactoryOrder = trpc.factoryConstruction.createOrder.useMutation({
    onSuccess: () => {
      // Invalidate outstanding orders query to refresh the list
      trpcUtils.factoryConstruction.getOutstandingOrders.invalidate({
        companyId,
        gameId,
      });
    },
  });

  // Separate GLOBAL and SECTOR resources
  const globalResources = useMemo(() => {
    if (!allResources) return [];
    return allResources
      .filter(r => r.trackType === ResourceTrackType.GLOBAL)
      .map(r => ({ type: r.type as ResourceType, price: r.price }));
  }, [allResources]);

  const maxResources = RESOURCE_LIMITS[factorySize];
  const canAddResource = schematic.length < maxResources;

  const addResource = (resourceType: ResourceType) => {
    if (!canAddResource || !allResources) return;
    // Prevent duplicates
    if (schematic.some((item) => item.type === resourceType)) return;
    const resource = allResources.find(r => r.type === resourceType);
    if (!resource) return;
    setSchematic(prev => [...prev, {
      type: resourceType,
      quantity: 1,
      price: resource.price
    }]);
  };

  const removeResource = (index: number) => {
    // Don't allow removing the sector resource (index 0)
    if (index === 0) return;
    setSchematic(prev => prev.filter((_, i) => i !== index));
  };

  const resetSchematic = () => {
    // Reset to just the sector resource
    setSchematic([{
      type: sectorResourceType,
      quantity: 1,
      price: sectorResource?.price || 25
    }]);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setSchematic(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const handleSubmit = async () => {
    if (schematic.length === 0) return;

    if (!authPlayer?.id) {
      console.error('No authenticated player found');
      return;
    }

    setBuildError(null);

    try {
      await createFactoryOrder.mutateAsync({
        companyId,
        gameId,
        playerId: authPlayer.id,
        size: factorySize,
        resourceTypes: schematic.map(s => s.type),
      });
      onClose();
    } catch (error) {
      console.error('Failed to create factory order:', error);
      setBuildError(getBuildErrorMessage(error));
    }
  };

  const handleCloseError = () => {
    setBuildError(null);
    onClose();
  };

  // Formula: (sum of resource prices) × factory size + $100 plot fee (fresh plots only)
  const resourceCost = schematic.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const factorySizeNumber = getNumberForFactorySize(factorySize);
  const totalCost = resourceCost * factorySizeNumber + PLOT_FEE_FRESH;

  if (resourcesLoading) {
    return (
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl p-6 min-w-[450px] max-w-[500px]">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl p-6 min-w-[450px] max-w-[500px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-100">
            Factory {factorySize.split('_')[1]} Schematic
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Select {maxResources} resource{maxResources > 1 ? 's' : ''} for your factory
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors"
          aria-label="Close"
        >
          <RiCloseLine size={20} />
        </button>
      </div>

      {/* Available Resources */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Available Resources
          </h4>
          <span className="text-xs text-gray-500">
            Global Resources
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {globalResources?.map((resource) => {
            const isAlreadyAdded = schematic.some((item) => item.type === resource.type);
            return (
              <button
                key={resource.type}
                onClick={() => addResource(resource.type)}
                disabled={!canAddResource || isAlreadyAdded}
                className={cn(
                  'p-3 rounded-lg border transition-all text-xs font-medium',
                  'flex flex-col items-center gap-2 justify-center min-h-[80px]',
                  'hover:scale-105 active:scale-95',
                  canAddResource && !isAlreadyAdded
                    ? 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50 text-gray-200'
                    : isAlreadyAdded
                    ? 'border-green-500/50 bg-green-500/10 text-gray-400 cursor-not-allowed'
                    : 'border-gray-700 bg-gray-800/30 text-gray-500 cursor-not-allowed'
                )}
                title={isAlreadyAdded ? 'Already in schematic' : `Add ${resource.type} ($${resource.price})`}
              >
                <ResourceIcon resourceType={resource.type} size="w-6 h-6" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-medium">{resource.type}</span>
                  <span className="text-xs text-gray-400">${resource.price}</span>
                </div>
              </button>
            );
          })}
        </div>
        {globalResources.length === 0 && (
          <p className="text-center py-4 text-gray-500 text-sm">
            No resources available
          </p>
        )}
      </div>

      {/* Current Schematic */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Schematic
            <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
              ({schematic.length}/{maxResources})
            </span>
          </h4>
          {schematic.length > 1 && (
            <button
              onClick={resetSchematic}
              className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
            >
              Reset
            </button>
          )}
        </div>
        
        {schematic.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-700 rounded-lg">
            <p>No resources selected</p>
            <p className="text-xs text-gray-600 mt-1">Add resources from above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schematic.map((item, index) => {
              const isSectorResource = index === 0;
              return (
                <div
                  key={`${item.type}-${index}`}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    isSectorResource
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ResourceIcon resourceType={item.type} size="w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">
                        {item.type}
                      </span>
                      {isSectorResource && (
                        <span className="text-xs text-blue-400">Required (Sector)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-300 min-w-[60px] text-right">
                      ${item.price}
                    </span>
                    {!isSectorResource && (
                      <button
                        onClick={() => removeResource(index)}
                        className="w-7 h-7 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center"
                        aria-label={`Remove ${item.type}`}
                      >
                        <RiCloseLine size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Total Cost */}
      {schematic.length > 0 && (
        <div className="border-t border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              Resources × factory size multiplier (×{factorySizeNumber})
              <Popover placement="top">
                <PopoverTrigger>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                    aria-label="How resources cost is calculated"
                  >
                    <RiInformationLine size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="px-2 py-2 max-w-[260px] text-sm">
                    <div className="font-semibold text-gray-200 mb-1">Resources × factory size</div>
                    <p className="text-gray-400">
                      The sum of current market prices for all resources in your schematic. This is
                      multiplied by the factory size (Factory I = ×1, II = ×2, III = ×3, IV = ×4)
                      because larger factories require more materials.
                    </p>
                    <p className="text-gray-500 mt-2 text-xs">
                      Formula: (sum of resource prices) × {factorySizeNumber} = ${resourceCost * factorySizeNumber}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </span>
            <span>${resourceCost * factorySizeNumber}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              Plot fee (fresh plot)
              <Popover placement="top">
                <PopoverTrigger>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                    aria-label="What is the plot fee"
                  >
                    <RiInformationLine size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="px-2 py-2 max-w-[260px] text-sm">
                    <div className="font-semibold text-gray-200 mb-1">Plot fee (fresh plot)</div>
                    <p className="text-gray-400">
                      A $100 one-time fee for building on a new plot. This covers the cost of
                      securing and preparing the land for construction.
                    </p>
                    <p className="text-gray-500 mt-2 text-xs">
                      This fee is <strong>not</strong> charged when upgrading an existing factory
                      (e.g. repairing a rusted factory).
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </span>
            <span>${PLOT_FEE_FRESH}</span>
          </div>
          <div className="flex justify-between items-center bg-gray-900/50 rounded-lg p-3">
            <span className="text-sm font-medium text-gray-300">Total Cost:</span>
            <span className="text-2xl font-bold text-orange-400">${totalCost}</span>
          </div>
        </div>
      )}

      {/* Build error */}
      {buildError && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-4 space-y-3">
          <div className="flex gap-3">
            <RiErrorWarningFill className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="text-sm font-semibold text-red-300">Build failed</div>
              <p className="text-sm text-red-200/90 mt-1">{buildError}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCloseError}
              className="px-4 py-2 rounded-lg bg-red-700/50 hover:bg-red-700/70 border border-red-600/50 text-red-100 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-600 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 transition-all font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={schematic.length === 0 || createFactoryOrder.isPending || schematic.length !== maxResources}
          className={cn(
            'flex-1 px-4 py-3 rounded-lg font-semibold transition-all shadow-lg',
            schematic.length === maxResources && !createFactoryOrder.isPending
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          )}
        >
          {createFactoryOrder.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" color="white" />
              Creating...
            </span>
          ) : (
            `Create Factory${schematic.length !== maxResources ? ` (${schematic.length}/${maxResources})` : ''}`
          )}
        </button>
      </div>
    </div>
  );
} 