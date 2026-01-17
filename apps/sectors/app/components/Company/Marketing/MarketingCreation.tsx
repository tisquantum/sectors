'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { trpc } from '@sectors/app/trpc';
import { MarketingCampaignTier } from '@server/prisma/prisma.client';
import { useGame } from '../../Game/GameContext';
import { Spinner, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react';
import { RiInformationLine, RiErrorWarningFill } from '@remixicon/react';

function getCampaignErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  const e = error as { message?: string; data?: { json?: { message?: string }; message?: string } };
  if (typeof e?.message === 'string') return e.message;
  if (typeof e?.data?.json?.message === 'string') return e.data.json.message;
  if (typeof e?.data?.message === 'string') return e.data.message;
  return 'Failed to create campaign.';
}

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

const CAMPAIGN_CONFIG: Record<CampaignSize, { workers: number; brandBonus: number; resources: number; cost: number; tier: MarketingCampaignTier }> = {
  CAMPAIGN_I: { workers: 1, brandBonus: 1, resources: 1, cost: 100, tier: MarketingCampaignTier.TIER_1 },
  CAMPAIGN_II: { workers: 2, brandBonus: 2, resources: 2, cost: 200, tier: MarketingCampaignTier.TIER_2 },
  CAMPAIGN_III: { workers: 3, brandBonus: 3, resources: 3, cost: 300, tier: MarketingCampaignTier.TIER_3 },
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

export function MarketingCreation({
  companyId,
  gameId,
  onClose,
}: MarketingCreationProps) {
  const { authPlayer, gameState } = useGame();
  const [selectedSize, setSelectedSize] = useState<CampaignSize>('CAMPAIGN_I');
  const [schematic, setSchematic] = useState<ResourceSchematic[]>([]);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  
  // Get company to find its sector
  const company = gameState?.Company?.find(c => c.id === companyId);
  const companySector = company?.sectorId ? gameState?.sectors?.find(s => s.id === company.sectorId) : null;
  
  // Helper function to get sector resource type
  const getSectorResourceType = (sectorName: string): ResourceType | null => {
    switch (sectorName) {
      case 'MATERIALS': return ResourceType.MATERIALS;
      case 'INDUSTRIALS': return ResourceType.INDUSTRIALS;
      case 'CONSUMER_DISCRETIONARY': return ResourceType.CONSUMER_DISCRETIONARY;
      case 'CONSUMER_STAPLES': return ResourceType.CONSUMER_STAPLES;
      case 'CONSUMER_CYCLICAL': return ResourceType.CONSUMER_CYCLICAL;
      case 'CONSUMER_DEFENSIVE': return ResourceType.CONSUMER_DEFENSIVE;
      case 'ENERGY': return ResourceType.ENERGY;
      case 'HEALTHCARE': return ResourceType.HEALTHCARE;
      case 'TECHNOLOGY': return ResourceType.TECHNOLOGY;
      default: return null;
    }
  };
  
  // Fetch real resources from backend
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  const { data: resourcesData, isLoading: resourcesLoading } = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );
  
  // Filter available resources: only TRIANGLE, SQUARE, CIRCLE, and the company's sector resource
  const baseResources: ResourceType[] = [ResourceType.TRIANGLE, ResourceType.SQUARE, ResourceType.CIRCLE];
  const sectorResource = companySector ? getSectorResourceType(companySector.sectorName) : null;
  const allowedResources = sectorResource 
    ? [...baseResources, sectorResource]
    : baseResources;
  
  // Filter and transform resources data to match expected format
  const resources = resourcesData
    ?.filter(r => allowedResources.includes(r.type as ResourceType))
    ?.map(r => ({
      type: r.type as ResourceType,
      price: r.price,
    })) || MOCK_RESOURCES.filter(r => allowedResources.includes(r.type));
  
  const submitCampaign = trpc.modernOperations.submitMarketingCampaign.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

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
    if (schematic.length === 0 || !authPlayer) return;

    const campaignConfig = CAMPAIGN_CONFIG[selectedSize];
    const resourceTypes = schematic.map(s => s.type);

    setCampaignError(null);

    try {
      await submitCampaign.mutateAsync({
        companyId,
        gameId,
        playerId: authPlayer.id,
        tier: campaignConfig.tier,
        slot: 1, // TODO: Get actual slot number
        resourceTypes,
      });
    } catch (error) {
      console.error('Failed to create marketing campaign:', error);
      setCampaignError(getCampaignErrorMessage(error));
    }
  };

  const handleCloseCampaignError = () => {
    setCampaignError(null);
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
              setCampaignError(null);
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
          <div className="flex items-center justify-center gap-1">
            <p className="text-sm text-gray-400">Workers</p>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Workers</div>
                  <div className="text-small text-default-500">
                    The number of workers required to operate this marketing campaign. Workers must be available from your company's workforce.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-lg font-semibold text-gray-200">{campaignConfig.workers}</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1">
            <p className="text-sm text-gray-400">Brand Bonus</p>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Brand Bonus</div>
                  <div className="text-small text-default-500">
                    The brand score bonus provided by this campaign. Brand score decreases the perceived unit price for attraction rating calculations, making your products more attractive to consumers.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-lg font-semibold text-green-400">+{campaignConfig.brandBonus}</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1">
            <p className="text-sm text-gray-400">Campaign Cost</p>
            <Popover placement="top">
              <PopoverTrigger>
                <button className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                  <RiInformationLine size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-1 max-w-xs">
                  <div className="text-small font-semibold mb-1">Campaign Cost</div>
                  <div className="text-small text-default-500">
                    The upfront cash cost to create this marketing campaign. This cost must be paid from your company's cash on hand.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-lg font-semibold text-gray-200">${totalCost}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Available Resources for Consumption Bag</h4>
        {resourcesLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
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
                <div className={cn('w-3 h-3 rounded', RESOURCE_COLORS[resource.type] || 'bg-gray-500')} />
                <span>{resource.type}</span>
              </button>
            ))}
          </div>
        )}
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

      {campaignError && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-4 space-y-3">
          <div className="flex gap-3">
            <RiErrorWarningFill className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="text-sm font-semibold text-red-300">Campaign failed</div>
              <p className="text-sm text-red-200/90 mt-1">{campaignError}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCloseCampaignError}
              className="px-4 py-2 rounded-lg bg-red-700/50 hover:bg-red-700/70 border border-red-600/50 text-red-100 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-colors">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={schematic.length === 0 || submitCampaign.isPending}
          className={cn(
            'flex-1 px-4 py-2 rounded font-medium transition-colors',
            schematic.length > 0 && !submitCampaign.isPending ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          )}
        >
          {submitCampaign.isPending ? <Spinner size="sm" /> : 'Create Campaign'}
        </button>
      </div>
    </div>
  );
} 