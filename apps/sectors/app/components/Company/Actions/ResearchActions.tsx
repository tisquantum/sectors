'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { api } from '@/trpc/react';

interface ResearchActionsProps {
  companyId: string;
  gameId: string;
  phase: number;
  availableWorkers: number;
  availableCash: number;
  onActionComplete?: () => void;
}

const RESEARCH_COSTS = {
  1: 100, // Phase I
  2: 200, // Phase II
  3: 300, // Phase III
  4: 400, // Phase IV
};

export function ResearchActions({
  companyId,
  gameId,
  phase,
  availableWorkers,
  availableCash,
  onActionComplete,
}: ResearchActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const research = api.research.research.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      onActionComplete?.();
    },
    onError: (error) => {
      setIsLoading(false);
      console.error('Failed to research:', error);
    },
  });

  const handleResearch = async () => {
    setIsLoading(true);
    research.mutate({
      companyId,
      gameId,
    });
  };

  const canResearch = availableCash >= RESEARCH_COSTS[phase as keyof typeof RESEARCH_COSTS];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="font-semibold">Research Action</h4>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <div>Cost: ${RESEARCH_COSTS[phase as keyof typeof RESEARCH_COSTS]}</div>
          <div>Effect: Draw a research card from the deck</div>
          <div>Possible Outcomes:</div>
          <ul className="list-inside list-disc">
            <li>Major Discovery (+2)</li>
            <li>Minor Discovery (+1)</li>
            <li>Failed Research (0)</li>
          </ul>
          <div className="mt-2">
            <p className="font-medium">Research Track Benefits:</p>
            <ul className="list-inside list-disc">
              <li>First to reach milestones: Major rewards</li>
              <li>Subsequent companies: Minor rewards</li>
              <li>Advances sector technology track</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleResearch}
          disabled={!canResearch || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Researching...' : 'Research'}
        </Button>
      </div>
    </div>
  );
} 