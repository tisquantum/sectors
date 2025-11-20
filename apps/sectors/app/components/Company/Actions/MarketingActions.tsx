'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { MarketingCampaignTier, OperationMechanicsVersion, ResourceType } from '@prisma/client';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';
import { trpc } from '@sectors/app/trpc';
import { useGame } from '../../Game/GameContext';

interface MarketingActionsProps {
  companyId: string;
  gameId: string;
  phase: number;
  availableWorkers: number;
  availableCash: number;
  operationMechanicsVersion?: OperationMechanicsVersion;
  onActionComplete?: () => void;
}

const MARKETING_CONFIG = {
  [MarketingCampaignTier.TIER_1]: {
    workers: 1,
    brandBonus: 1,
    resourceBonus: 1,
    cost: 100,
  },
  [MarketingCampaignTier.TIER_2]: {
    workers: 2,
    brandBonus: 2,
    resourceBonus: 2,
    cost: 200,
  },
  [MarketingCampaignTier.TIER_3]: {
    workers: 3,
    brandBonus: 3,
    resourceBonus: 3,
    cost: 300,
  },
};

export function MarketingActions({
  companyId,
  gameId,
  phase,
  availableWorkers,
  availableCash,
  operationMechanicsVersion = OperationMechanicsVersion.MODERN,
  onActionComplete,
}: MarketingActionsProps) {
  const { gameState } = useGame();
  const [selectedTier, setSelectedTier] = useState<MarketingCampaignTier | null>(null);
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Fetch resources for selection
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  const { data: resourcesData } = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );

  // Filter available resources: only TRIANGLE, SQUARE, CIRCLE, and the company's sector resource
  const baseResources: ResourceType[] = [ResourceType.TRIANGLE, ResourceType.SQUARE, ResourceType.CIRCLE];
  const sectorResource = companySector ? getSectorResourceType(companySector.sectorName) : null;
  const allowedResources = sectorResource 
    ? [...baseResources, sectorResource]
    : baseResources;
  
  // Filter the fetched resources to only show allowed ones
  const resources = resourcesData
    ?.filter(r => allowedResources.includes(r.type as ResourceType))
    ?.map(r => r.type as ResourceType) || [];

  const createCampaign = api.marketing.createCampaign.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setSelectedTier(null);
      setSelectedResources([]);
      onActionComplete?.();
    },
    onError: (error) => {
      setIsLoading(false);
      console.error('Failed to create campaign:', error);
      alert(`Failed to create campaign: ${error.message}`);
    },
  });

  const getRequiredResourceCount = (tier: MarketingCampaignTier): number => {
    switch (tier) {
      case MarketingCampaignTier.TIER_1: return 1;
      case MarketingCampaignTier.TIER_2: return 2;
      case MarketingCampaignTier.TIER_3: return 3;
      default: return 0;
    }
  };

  const handleTierSelect = (tier: MarketingCampaignTier) => {
    setSelectedTier(tier);
    // Reset resources when tier changes
    setSelectedResources([]);
  };

  const handleResourceToggle = (resourceType: ResourceType) => {
    if (!selectedTier) return;
    
    const requiredCount = getRequiredResourceCount(selectedTier);
    const isSelected = selectedResources.includes(resourceType);
    
    if (isSelected) {
      setSelectedResources(prev => prev.filter(r => r !== resourceType));
    } else if (selectedResources.length < requiredCount) {
      setSelectedResources(prev => [...prev, resourceType]);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedTier) return;

    const requiredCount = getRequiredResourceCount(selectedTier);
    if (selectedResources.length !== requiredCount) {
      alert(`Please select exactly ${requiredCount} resource(s) for ${selectedTier}`);
      return;
    }

    setIsLoading(true);
    createCampaign.mutate({
      companyId,
      gameId,
      tier: selectedTier,
      operationMechanicsVersion,
      resourceTypes: selectedResources,
    });
  };

  const canCreateCampaign = (tier: MarketingCampaignTier) => {
    const config = MARKETING_CONFIG[tier];
    return (
      availableWorkers >= config.workers &&
      availableCash >= config.cost &&
      phase >= Object.values(MarketingCampaignTier).indexOf(tier) + 1
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Object.values(MarketingCampaignTier).map((tier) => (
          <Card
            key={tier}
            className={cn(
              'cursor-pointer p-4 transition-colors',
              selectedTier === tier
                ? 'border-primary bg-primary/10'
                : canCreateCampaign(tier)
                ? 'hover:border-primary/50'
                : 'opacity-50'
            )}
            onClick={() => canCreateCampaign(tier) && handleTierSelect(tier)}
          >
            <h4 className="font-semibold">Campaign {tier}</h4>
            <div className="mt-2 text-sm text-muted-foreground">
              <div>Workers: {MARKETING_CONFIG[tier].workers}</div>
              <div>Brand Bonus: +{MARKETING_CONFIG[tier].brandBonus}</div>
              <div>Resource Bonus: +{MARKETING_CONFIG[tier].resourceBonus}</div>
              <div>Cost: ${MARKETING_CONFIG[tier].cost}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card className="p-4">
          <h4 className="font-semibold">Marketing Campaign Details</h4>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            <p>
              Marketing campaigns provide brand bonuses and resource bonuses that decay over time.
              Each campaign requires workers to maintain and will degrade one turn at a time.
            </p>
            <div className="mt-2">
              <p className="font-medium">Campaign Effects:</p>
              <ul className="list-inside list-disc">
                <li>Brand Bonus: Reduces perceived price for customer attraction</li>
                <li>Resource Bonus: Adds temporary resources to sector consumption bag</li>
                <li>Campaigns degrade one turn at a time</li>
                <li>Workers are required to maintain the campaign</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Resource Selection */}
      {selectedTier && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">
            Select {getRequiredResourceCount(selectedTier)} Resource(s) for Consumption Bag:
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {resources.map((resourceType) => {
              const isSelected = selectedResources.includes(resourceType);
              const canSelect = selectedResources.length < getRequiredResourceCount(selectedTier);
              return (
                <button
                  key={resourceType}
                  onClick={() => handleResourceToggle(resourceType)}
                  disabled={!canSelect && !isSelected}
                  className={cn(
                    'p-2 rounded border text-xs transition-colors',
                    isSelected
                      ? 'bg-primary/20 border-primary text-primary'
                      : canSelect
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      : 'border-gray-700 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {resourceType}
                </button>
              );
            })}
          </div>
          {selectedResources.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedResources.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleCreateCampaign}
          disabled={!selectedTier || isLoading || selectedResources.length !== (selectedTier ? getRequiredResourceCount(selectedTier) : 0)}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  );
} 