'use client';

import { Tab, Tabs } from '@nextui-org/react';
import type { Key } from 'react';
import { useGame } from './GameContext';
import { Spinner } from '@nextui-org/react';
import { SpotMarket } from './Markets/SpotMarket';
import Derivatives from './Derivatives';

type MarketsViewProps = {
  selectedTabKey: string;
  onTabChange: (key: string) => void;
};

/**
 * Companies View - Stock trading and derivatives
 * Shows stock trading and derivatives (Resource Market moved to Economy)
 */
export function MarketsView({ selectedTabKey, onTabChange }: MarketsViewProps) {
  const { gameState, gameId } = useGame();

  if (!gameState || !gameId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Tabs
        aria-label="Companies"
        className="w-full"
        selectedKey={selectedTabKey}
        onSelectionChange={(key: Key) => onTabChange(String(key))}
      >
        {/* Companies - Organized by Sector */}
        <Tab key="companies" title="Companies">
          <SpotMarket />
        </Tab>

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

