'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';

interface SectorActionsProps {
  companyId: string;
  gameId: string;
  sectorName: string;
  availableCash: number;
  availablePrestige: number;
  onActionComplete?: () => void;
}

interface SectorAction {
  id: string;
  name: string;
  description: string;
  cashCost: number;
  prestigeCost: number;
  requiresConfirmation?: boolean;
}

const SECTOR_ACTIONS: SectorAction[] = [
  {
    id: 'visionary',
    name: 'Visionary',
    description: 'Draw 2 research cards and the company gains +1 demand permanently.',
    cashCost: 400,
    prestigeCost: 3,
  },
  {
    id: 'strategic-reserve',
    name: 'Strategic Reserve',
    description: 'The company has no production cost next turn and revenue is increased by 10%.',
    cashCost: 400,
    prestigeCost: 3,
  },
  {
    id: 'rapid-expansion',
    name: 'Rapid Expansion',
    description: 'The company expands two levels.',
    cashCost: 400,
    prestigeCost: 3,
  },
  {
    id: 'fast-track-approval',
    name: 'Fast-track Approval',
    description: 'Take up to 3 consumers from each other sector and add them to the Healthcare sector. The company gets +2 temporary demand.',
    cashCost: 400,
    prestigeCost: 3,
  },
  {
    id: 'price-freeze',
    name: 'Price Freeze',
    description: 'During the marketing action resolve round, the company stock price will move a maximum of 2 spaces next turn.',
    cashCost: 400,
    prestigeCost: 3,
  },
  {
    id: 're-brand',
    name: 'Re-Brand',
    description: 'The company gains +1 temporary demand, +1 permanent demand, and a $40 increase in price.',
    cashCost: 400,
    prestigeCost: 3,
  },
  {
    id: 'surge-pricing',
    name: 'Surge Pricing',
    description: 'Next turn, company revenue is increased by 20%.',
    cashCost: 400,
    prestigeCost: 3,
  },
];

export function SectorActions({
  companyId,
  gameId,
  sectorName,
  availableCash,
  availablePrestige,
  onActionComplete,
}: SectorActionsProps) {
  const [selectedAction, setSelectedAction] = useState<SectorAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const executeSectorAction = api.company.executeSectorAction.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setSelectedAction(null);
      setShowConfirmation(false);
      onActionComplete?.();
    },
    onError: (error) => {
      setIsLoading(false);
      console.error('Failed to execute sector action:', error);
    },
  });

  const handleAction = async (action: SectorAction) => {
    if (action.requiresConfirmation) {
      setSelectedAction(action);
      setShowConfirmation(true);
      return;
    }

    setIsLoading(true);
    executeSectorAction.mutate({
      companyId,
      gameId,
      actionId: action.id,
    });
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    executeSectorAction.mutate({
      companyId,
      gameId,
      actionId: selectedAction.id,
    });
  };

  const canExecuteAction = (action: SectorAction) => {
    return availableCash >= action.cashCost && availablePrestige >= action.prestigeCost;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="font-semibold">Sector Actions - {sectorName}</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Sector actions require both cash and prestige to execute. These actions provide powerful
          benefits specific to your sector.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTOR_ACTIONS.map((action) => (
          <Card
            key={action.id}
            className={cn(
              'cursor-pointer p-4 transition-colors',
              canExecuteAction(action)
                ? 'hover:border-primary/50'
                : 'opacity-50'
            )}
            onClick={() => canExecuteAction(action) && handleAction(action)}
          >
            <h4 className="font-semibold">{action.name}</h4>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{action.description}</p>
              <div className="mt-2">
                <div>Cash Cost: ${action.cashCost}</div>
                <div>Prestige Cost: {action.prestigeCost}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showConfirmation && selectedAction && (
        <Card className="p-4">
          <h4 className="font-semibold">Confirm Sector Action</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to execute {selectedAction.name}? This will cost ${selectedAction.cashCost} and {selectedAction.prestigeCost} prestige.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmation(false);
                setSelectedAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isLoading}
            >
              {isLoading ? 'Executing...' : 'Confirm'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
} 