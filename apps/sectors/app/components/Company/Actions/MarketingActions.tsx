'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { MarketingCampaignTier } from '@prisma/client';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';

interface MarketingActionsProps {
  companyId: string;
  gameId: string;
  phase: number;
  availableWorkers: number;
  availableCash: number;
  onActionComplete?: () => void;
}

const MARKETING_CONFIG = {
  [MarketingCampaignTier.I]: {
    workers: 1,
    brandBonus: 1,
    resourceBonus: 1,
    cost: 100,
  },
  [MarketingCampaignTier.II]: {
    workers: 2,
    brandBonus: 2,
    resourceBonus: 2,
    cost: 200,
  },
  [MarketingCampaignTier.III]: {
    workers: 3,
    brandBonus: 3,
    resourceBonus: 3,
    cost: 300,
  },
  [MarketingCampaignTier.IV]: {
    workers: 4,
    brandBonus: 4,
    resourceBonus: 4,
    cost: 400,
  },
};

export function MarketingActions({
  companyId,
  gameId,
  phase,
  availableWorkers,
  availableCash,
  onActionComplete,
}: MarketingActionsProps) {
  const [selectedTier, setSelectedTier] = useState<MarketingCampaignTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createCampaign = api.marketing.createCampaign.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setSelectedTier(null);
      onActionComplete?.();
    },
    onError: (error) => {
      setIsLoading(false);
      console.error('Failed to create campaign:', error);
    },
  });

  const handleCreateCampaign = async () => {
    if (!selectedTier) return;

    setIsLoading(true);
    createCampaign.mutate({
      companyId,
      gameId,
      tier: selectedTier,
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
            onClick={() => canCreateCampaign(tier) && setSelectedTier(tier)}
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

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleCreateCampaign}
          disabled={!selectedTier || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  );
} 