'use client';

import { Tab, Tabs } from '@nextui-org/react';
import { useGame } from './GameContext';
import { Spinner } from '@nextui-org/react';
import { OperationMechanicsVersion } from '@server/prisma/prisma.client';
import { ConsumptionPhase as ModernConsumptionPhase } from './ModernOperations/phases';
import { EarningsCallPhase as ModernEarningsCallPhase } from './ModernOperations/phases';
import { MarketingAndResearchPhase as ModernMarketingAndResearchPhase } from './ModernOperations/phases';
import { MarketingAndResearchResolvePhase as ModernMarketingAndResearchResolvePhase } from './ModernOperations/phases';
import { ResourceTracksContainer } from './ResourceTracksContainer';

/**
 * Operations View - Modern Operations
 * Shows consumption phase, earnings, and marketing/research in separate tabs
 */
export function OperationsView() {
  const { gameState, gameId } = useGame();

  if (!gameState || !gameId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Only show for modern operations
  if (gameState.operationMechanicsVersion !== OperationMechanicsVersion.MODERN) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Operations view is only available for modern operations games.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Tabs aria-label="Operations" className="w-full">
        {/* Consumption & Earnings Section */}
        <Tab key="consumption" title="Consumption Phase">
          <div className="w-full h-full p-4">
            <ModernConsumptionPhase />
          </div>
        </Tab>

        <Tab key="earnings" title="Earnings Call">
          <div className="w-full h-full p-4">
            <ModernEarningsCallPhase />
          </div>
        </Tab>

        <Tab key="resource-tracks" title="Resource Tracks">
          <div className="w-full h-full">
            <ResourceTracksContainer />
          </div>
        </Tab>

        {/* Marketing & Research Section */}
        <Tab key="marketing-research" title="Marketing & Research">
          <div className="w-full h-full p-4">
            <ModernMarketingAndResearchPhase />
          </div>
        </Tab>

        <Tab key="marketing-research-resolve" title="Marketing & Research Resolve">
          <div className="w-full h-full p-4">
            <ModernMarketingAndResearchResolvePhase />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

