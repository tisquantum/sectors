'use client';

import { useState } from 'react';
import { trpc } from '@sectors/app/trpc';
import { cn } from '@/lib/utils';

type FactorySize = 'FACTORY_I' | 'FACTORY_II' | 'FACTORY_III' | 'FACTORY_IV';

type ResourceType = 
  | 'TRIANGLE'
  | 'SQUARE'
  | 'CIRCLE'
  | 'MATERIALS'
  | 'INDUSTRIALS'
  | 'CONSUMER_DISCRETIONARY'
  | 'CONSUMER_STAPLES'
  | 'CONSUMER_CYCLICAL'
  | 'CONSUMER_DEFENSIVE'
  | 'ENERGY'
  | 'HEALTHCARE'
  | 'TECHNOLOGY'
  | 'GENERAL';

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

// Mock resource data - replace with actual tRPC call when resource router is available
const MOCK_RESOURCES = [
  { type: 'TRIANGLE' as ResourceType, price: 10 },
  { type: 'SQUARE' as ResourceType, price: 15 },
  { type: 'CIRCLE' as ResourceType, price: 20 },
  { type: 'MATERIALS' as ResourceType, price: 25 },
  { type: 'INDUSTRIALS' as ResourceType, price: 30 },
  { type: 'CONSUMER_DISCRETIONARY' as ResourceType, price: 35 },
  { type: 'CONSUMER_STAPLES' as ResourceType, price: 40 },
  { type: 'CONSUMER_CYCLICAL' as ResourceType, price: 45 },
  { type: 'CONSUMER_DEFENSIVE' as ResourceType, price: 50 },
  { type: 'ENERGY' as ResourceType, price: 55 },
  { type: 'HEALTHCARE' as ResourceType, price: 60 },
  { type: 'TECHNOLOGY' as ResourceType, price: 65 },
  { type: 'GENERAL' as ResourceType, price: 70 },
];

const RESOURCE_LIMITS: Record<FactorySize, number> = {
  FACTORY_I: 2,
  FACTORY_II: 3,
  FACTORY_III: 4,
  FACTORY_IV: 5,
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
  TRIANGLE: 'bg-yellow-500',
  SQUARE: 'bg-blue-500',
  CIRCLE: 'bg-green-500',
  MATERIALS: 'bg-gray-500',
  INDUSTRIALS: 'bg-orange-500',
  CONSUMER_DISCRETIONARY: 'bg-purple-500',
  CONSUMER_STAPLES: 'bg-pink-500',
  CONSUMER_CYCLICAL: 'bg-red-500',
  CONSUMER_DEFENSIVE: 'bg-indigo-500',
  ENERGY: 'bg-yellow-600',
  HEALTHCARE: 'bg-teal-500',
  TECHNOLOGY: 'bg-cyan-500',
  GENERAL: 'bg-gray-400',
};

export function FactoryCreation({ 
  companyId, 
  gameId, 
  factorySize, 
  onClose 
}: FactoryCreationProps) {
  const [schematic, setSchematic] = useState<ResourceSchematic[]>([]);
  
  // TODO: Replace with actual tRPC call when resource router is available
  const resources = MOCK_RESOURCES;
  const createFactoryOrder = trpc.factoryConstruction.createOrder.useMutation();

  const maxResources = RESOURCE_LIMITS[factorySize];
  const canAddResource = schematic.length < maxResources;

  const addResource = (resourceType: ResourceType) => {
    if (!canAddResource || !resources) return;
    
    const resource = resources.find((r: { type: ResourceType; price: number }) => r.type === resourceType);
    if (!resource) return;

    setSchematic(prev => [...prev, {
      type: resourceType,
      quantity: 1,
      price: resource.price
    }]);
  };

  const removeResource = (index: number) => {
    setSchematic(prev => prev.filter((_, i) => i !== index));
  };

  const resetSchematic = () => {
    setSchematic([]);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setSchematic(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const handleSubmit = async () => {
    if (schematic.length === 0) return;

    try {
      await createFactoryOrder.mutateAsync({
        companyId,
        gameId,
        size: factorySize,
        resourceTypes: schematic.map(s => s.type),
      });
      onClose();
    } catch (error) {
      console.error('Failed to create factory order:', error);
    }
  };

  const totalCost = schematic.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-lg p-4 space-y-4 min-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-600 pb-2">
        <h3 className="text-lg font-semibold text-gray-200">
          Factory {factorySize.split('_')[1]} Schematic
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Available Resources */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Available Resources</h4>
        <div className="grid grid-cols-3 gap-2">
          {resources?.map((resource: { type: ResourceType; price: number }) => (
            <button
              key={resource.type}
              onClick={() => addResource(resource.type)}
              disabled={!canAddResource}
              className={cn(
                'p-2 rounded border transition-all text-xs font-medium',
                'flex items-center gap-2 justify-center',
                canAddResource
                  ? 'border-gray-500 hover:border-gray-400 text-gray-200 hover:bg-gray-700/50'
                  : 'border-gray-700 text-gray-500 cursor-not-allowed'
              )}
            >
              <div className={cn('w-3 h-3 rounded', RESOURCE_COLORS[resource.type])} />
              <span>{resource.type}</span>
              <span className="text-gray-400">${resource.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Schematic */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">
            Schematic ({schematic.length}/{maxResources})
          </h4>
          {schematic.length > 0 && (
            <button
              onClick={resetSchematic}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        
        {schematic.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No resources selected
          </div>
        ) : (
          <div className="space-y-2">
            {schematic.map((item, index) => (
              <div
                key={`${item.type}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-700/50 rounded border border-gray-600"
              >
                <div className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded', RESOURCE_COLORS[item.type])} />
                  <span className="text-sm text-gray-200">{item.type}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs"
                    >
                      -
                    </button>
                    <span className="text-sm text-gray-200 w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs"
                    >
                      +
                    </button>
                  </div>
                  
                  <span className="text-sm text-gray-400 w-16 text-right">
                    ${item.price * item.quantity}
                  </span>
                  
                  <button
                    onClick={() => removeResource(index)}
                    className="w-6 h-6 rounded bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Cost */}
      {schematic.length > 0 && (
        <div className="border-t border-gray-600 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Total Cost:</span>
            <span className="text-lg font-semibold text-gray-200">${totalCost}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={schematic.length === 0 || createFactoryOrder.isPending}
          className={cn(
            'flex-1 px-4 py-2 rounded font-medium transition-colors',
            schematic.length > 0 && !createFactoryOrder.isPending
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          )}
        >
          {createFactoryOrder.isPending ? 'Creating...' : 'Create Factory'}
        </button>
      </div>
    </div>
  );
} 