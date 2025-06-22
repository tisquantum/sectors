'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ResourceType } from '@/components/Company/Factory/Factory.types';

type CampaignSize = 'CAMPAIGN_I' | 'CAMPAIGN_II' | 'CAMPAIGN_III';

interface MarketingCreationProps {
  companyId: string;
  gameId: string;
  onClose: () => void;
}

interface ResourceSchematic {
  type: ResourceType;
  price: number;
}

// Mock resource data
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

const CAMPAIGN_CONFIG: Record<CampaignSize, { workers: number; brandBonus: number; resources: number; cost: number }> = {
  CAMPAIGN_I: { workers: 1, brandBonus: 1, resources: 1, cost: 10 },
  CAMPAIGN_II: { workers: 2, brandBonus: 2, resources: 2, cost: 20 },
  CAMPAIGN_III: { workers: 3, brandBonus: 3, resources: 3, cost: 30 },
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
    TRIANGLE: 'bg-yellow-500',
    SQUARE: 'bg-blue-500',
    CIRCLE: 'bg-green-500',
    STAR: 'bg-red-500',
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

export function MarketingCreation({
  companyId,
  gameId,
  onClose,
}: MarketingCreationProps) {
  const [selectedSize, setSelectedSize] = useState<CampaignSize>('CAMPAIGN_I');
  const [schematic, setSchematic] = useState<ResourceSchematic[]>([]);
  
  const resources = MOCK_RESOURCES;

  const campaignConfig = CAMPAIGN_CONFIG[selectedSize];
  const maxResources = campaignConfig.resources;
  const canAddResource = schematic.length < maxResources;

  const addResource = (resourceType: ResourceType) => {
    if (!canAddResource || !resources) return;
    
    const resource = resources.find((r) => r.type === resourceType);
    if (!resource) return;

    setSchematic(prev => [...prev, { type: resourceType, price: resource.price }]);
  };

  const removeResource = (index: number) => {
    setSchematic(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (schematic.length === 0) return;
    // ... mutation call here
    console.log('Creating campaign with:', { companyId, gameId, campaignSize: selectedSize, resources: schematic });
    onClose();
  };

  const totalCost = campaignConfig.cost;

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-lg p-4 space-y-4 min-w-[400px]">
      <div className="flex items-center justify-between border-b border-gray-600 pb-2">
        <h3 className="text-lg font-semibold text-gray-200">New Marketing Campaign</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">✕</button>
      </div>

      <div className="flex justify-center gap-2">
        {(Object.keys(CAMPAIGN_CONFIG) as CampaignSize[]).map((size) => (
          <button
            key={size}
            onClick={() => {
              setSelectedSize(size);
              setSchematic([]); // Reset schematic when size changes
            }}
            className={cn(
              'px-4 py-2 rounded font-medium transition-colors',
              selectedSize === size
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            )}
          >
            Campaign {size.split('_')[1]}
          </button>
        ))}
      </div>

      <div className="flex justify-around text-center p-2 bg-gray-700/30 rounded-lg">
        <div>
          <p className="text-sm text-gray-400">Workers</p>
          <p className="text-lg font-semibold text-gray-200">{campaignConfig.workers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Brand Bonus</p>
          <p className="text-lg font-semibold text-green-400">+{campaignConfig.brandBonus}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Campaign Cost</p>
          <p className="text-lg font-semibold text-gray-200">${totalCost}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Available Resources for Influence Bag</h4>
        <div className="grid grid-cols-3 gap-2">
          {resources?.map((resource) => (
            <button
              key={resource.type}
              onClick={() => addResource(resource.type)}
              disabled={!canAddResource}
              className={cn(
                'p-2 rounded border transition-all text-xs font-medium flex items-center gap-2 justify-center',
                canAddResource ? 'border-gray-500 hover:border-gray-400 text-gray-200 hover:bg-gray-700/50' : 'border-gray-700 text-gray-500 cursor-not-allowed'
              )}
            >
              <div className={cn('w-3 h-3 rounded', RESOURCE_COLORS[resource.type])} />
              <span>{resource.type}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">
            Selected for Bag ({schematic.length}/{maxResources})
          </h4>
        </div>
        {schematic.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No resources selected</div>
        ) : (
          <div className="space-y-2">
            {schematic.map((item, index) => (
              <div key={`${item.type}-${index}`} className="flex items-center justify-between p-2 bg-gray-700/50 rounded border border-gray-600">
                <div className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded', RESOURCE_COLORS[item.type])} />
                  <span className="text-sm text-gray-200">{item.type}</span>
                </div>
                <button onClick={() => removeResource(index)} className="w-6 h-6 rounded bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs transition-colors">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-colors">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={schematic.length === 0}
          className={cn(
            'flex-1 px-4 py-2 rounded font-medium transition-colors',
            schematic.length > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          )}
        >
          Create Campaign
        </button>
      </div>
    </div>
  );
} 