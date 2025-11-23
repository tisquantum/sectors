'use client';

import { Tab, Tabs } from '@nextui-org/react';
import { useGame } from './GameContext';
import { Spinner } from '@nextui-org/react';
import { SpotMarket } from './Markets/SpotMarket';
import { ResourceMarket } from './Markets/ResourceMarket';
import Derivatives from './Derivatives';
import { OperationMechanicsVersion } from '@server/prisma/prisma.client';

/**
 * Markets View - Refactored and cleaned up
 * Shows stock trading, resource prices, and derivatives
 */
export function MarketsView() {
  const { gameState, gameId } = useGame();

  if (!gameState || !gameId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Ensure gameId is a valid string before rendering ResourceMarket
  const isValidGameId = gameId && typeof gameId === 'string' && gameId.length > 0;

  return (
    <div className="w-full h-full">
      <Tabs aria-label="Markets" className="w-full">
        {/* Spot Market - Stock Trading */}
        <Tab key="spot-market" title="Spot Market">
          <SpotMarket />
        </Tab>

        {/* Resource Market - Resource Tracks (Modern Operations) */}
        {gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN && isValidGameId && (
          <Tab key="resource-market" title="Resource Market">
            <ResourceMarket gameId={gameId} />
          </Tab>
        )}

        {/* Derivatives - Option Orders (if enabled) */}
        {gameState.useOptionOrders && (
          <Tab key="derivatives" title="Derivatives">
            <Derivatives isInteractive={true} />
          </Tab>
        )}
      </Tabs>
    </div>
  );
}

