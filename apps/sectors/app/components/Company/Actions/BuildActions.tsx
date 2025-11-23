'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { FactorySize, FactoryBlueprintType } from '@prisma/client';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';

interface BuildActionsProps {
  companyId: string;
  gameId: string;
  phase: number;
  availableWorkers: number;
  availableCash: number;
  onActionComplete?: () => void;
}

const FACTORY_CONFIG = {
  [FactorySize.I]: {
    workers: 1,
    resources: 1,
    sectorResources: 1,
    maxCustomers: 3,
  },
  [FactorySize.II]: {
    workers: 2,
    resources: 2,
    sectorResources: 1,
    maxCustomers: 4,
  },
  [FactorySize.III]: {
    workers: 3,
    resources: 3,
    sectorResources: 1,
    maxCustomers: 5,
  },
  [FactorySize.IV]: {
    workers: 4,
    resources: 4,
    sectorResources: 1,
    maxCustomers: 6,
  },
};

export function BuildActions({
  companyId,
  gameId,
  phase,
  availableWorkers,
  availableCash,
  onActionComplete,
}: BuildActionsProps) {
  const [selectedSize, setSelectedSize] = useState<FactorySize | null>(null);
  const [selectedBlueprint, setSelectedBlueprint] = useState<FactoryBlueprintType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const buildFactory = api.factory.buildFactory.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setSelectedSize(null);
      setSelectedBlueprint(null);
      onActionComplete?.();
    },
    onError: (error) => {
      setIsLoading(false);
      console.error('Failed to build factory:', error);
    },
  });

  const handleBuildFactory = async () => {
    if (!selectedSize || !selectedBlueprint) return;

    setIsLoading(true);
    buildFactory.mutate({
      companyId,
      gameId,
      size: selectedSize,
      blueprintType: selectedBlueprint,
    });
  };

  const canBuildFactory = (size: FactorySize) => {
    const config = FACTORY_CONFIG[size];
    return (
      availableWorkers >= config.workers &&
      phase >= Object.values(FactorySize).indexOf(size) + 1
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Object.values(FactorySize).map((size) => (
          <Card
            key={size}
            className={cn(
              'cursor-pointer p-4 transition-colors',
              selectedSize === size
                ? 'border-primary bg-primary/10'
                : canBuildFactory(size)
                ? 'hover:border-primary/50'
                : 'opacity-50'
            )}
            onClick={() => canBuildFactory(size) && setSelectedSize(size)}
          >
            <h4 className="font-semibold">Factory {size}</h4>
            <div className="mt-2 text-sm text-muted-foreground">
              <div>Workers: {FACTORY_CONFIG[size].workers}</div>
              <div>Resources: {FACTORY_CONFIG[size].resources}</div>
              <div>Sector Resources: {FACTORY_CONFIG[size].sectorResources}</div>
              <div>Max Customers: {FACTORY_CONFIG[size].maxCustomers}</div>
            </div>
          </Card>
        ))}
      </div>

      {selectedSize && (
        <div className="mt-4">
          <h4 className="mb-2 font-semibold">Select Blueprint</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(FactoryBlueprintType).map((type) => (
              <Card
                key={type}
                className={cn(
                  'cursor-pointer p-4 transition-colors',
                  selectedBlueprint === type
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedBlueprint(type)}
              >
                <h5 className="font-semibold">{type}</h5>
                <div className="mt-2 text-sm text-muted-foreground">
                  {/* Add blueprint details here */}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleBuildFactory}
          disabled={!selectedSize || !selectedBlueprint || isLoading}
        >
          {isLoading ? 'Building...' : 'Build Factory'}
        </Button>
      </div>
    </div>
  );
} 