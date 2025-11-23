'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';

interface GeneralActionsProps {
  companyId: string;
  gameId: string;
  availableCash: number;
  availablePrestige: number;
  onActionComplete?: () => void;
}

interface Action {
  id: string;
  name: string;
  description: string;
  cost: number;
  prestigeCost?: number;
  requiresConfirmation?: boolean;
}

const GENERAL_ACTIONS: Action[] = [
  {
    id: 'share-buyback',
    name: 'Share Buyback',
    description: 'Buy back a share from the open market. This share is taken out of rotation from the game.',
    cost: 0,
    requiresConfirmation: true,
  },
  {
    id: 'share-issue',
    name: 'Share Issue',
    description: 'Issue 2 shares to the open market.',
    cost: 0, // Cost is current share price
    requiresConfirmation: true,
  },
  {
    id: 'increase-price',
    name: 'Increase Unit Price',
    description: 'Increase the unit price of the company\'s product by 10. The company loses 1 demand.',
    cost: 0,
  },
  {
    id: 'decrease-price',
    name: 'Decrease Unit Price',
    description: 'Decrease the unit price of the company\'s product by 10.',
    cost: 0,
  },
  {
    id: 'expansion',
    name: 'Expansion',
    description: 'Increase company size (base operational costs per OR) to meet higher demand and increase supply.',
    cost: 300,
  },
  {
    id: 'downsize',
    name: 'Downsize',
    description: 'Reduce company size (base operational costs per OR) to lower operation costs and decrease supply.',
    cost: 50,
  },
  {
    id: 'loan',
    name: 'Loan',
    description: 'Take out a loan of $250 to increase cash on hand. Be careful, loans must be paid back with interest at 0.1% per turn. This action can only be taken once per game.',
    cost: 0,
    requiresConfirmation: true,
  },
  {
    id: 'veto',
    name: 'Veto',
    description: 'The company does nothing this turn. Pick this to ensure the company will not act on any other proposal. Additionally, the next turn, this company\'s operating costs are 50% less.',
    cost: 0,
    requiresConfirmation: true,
  },
];

export function GeneralActions({
  companyId,
  gameId,
  availableCash,
  availablePrestige,
  onActionComplete,
}: GeneralActionsProps) {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const executeAction = api.company.executeAction.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setSelectedAction(null);
      setShowConfirmation(false);
      onActionComplete?.();
    },
    onError: (error) => {
      setIsLoading(false);
      console.error('Failed to execute action:', error);
    },
  });

  const handleAction = async (action: Action) => {
    if (action.requiresConfirmation) {
      setSelectedAction(action);
      setShowConfirmation(true);
      return;
    }

    setIsLoading(true);
    executeAction.mutate({
      companyId,
      gameId,
      actionId: action.id,
    });
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    executeAction.mutate({
      companyId,
      gameId,
      actionId: selectedAction.id,
    });
  };

  const canExecuteAction = (action: Action) => {
    if (action.prestigeCost && availablePrestige < action.prestigeCost) {
      return false;
    }
    return availableCash >= action.cost;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GENERAL_ACTIONS.map((action) => (
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
                {action.cost > 0 && <div>Cost: ${action.cost}</div>}
                {action.prestigeCost && (
                  <div>Prestige Cost: {action.prestigeCost}</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showConfirmation && selectedAction && (
        <Card className="p-4">
          <h4 className="font-semibold">Confirm Action</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to execute {selectedAction.name}?
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