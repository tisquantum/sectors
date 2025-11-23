'use client';

import { ResourceTrack } from '../ResourceTrack';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { ResourceTrackType } from '@server/prisma/prisma.client';
import { trpc } from '@sectors/app/trpc';
import { getResourcePriceForResourceType } from '@server/data/constants';
import { ModernOperationsLayout, ModernOperationsSection } from '../ModernOperations/layouts';
import { Spinner } from '@nextui-org/react';

interface ResourceMarketProps {
  gameId: string;
}

/**
 * Resource Market - Shows resource tracks for modern operations
 * Displays general and sector-specific resource tracks with current prices
 */
export function ResourceMarket({ gameId }: ResourceMarketProps) {
  // Only query if gameId is a valid non-empty string
  // Handle case where gameId might be null/undefined from context during initial render
  const isValidGameId = gameId && typeof gameId === 'string' && gameId.length > 0 && gameId !== 'null' && gameId !== 'undefined';
  
  const { data: resources, isLoading } = trpc.resource.getGameResources.useQuery(
    {
      gameId: isValidGameId ? (gameId as string) : '',
    },
    {
      // Don't retry if gameId is invalid
      retry: false,
    }
  );

  console.log('resources', resources);
  
  // Don't render anything if gameId is invalid - show loading until valid
  if (!isValidGameId) {
    return (
      <ModernOperationsLayout
        title="Resource Market"
        description="Resource tracks and pricing"
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  if (isLoading) {
    return (
      <ModernOperationsLayout
        title="Resource Market"
        description="Resource tracks and pricing"
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <ModernOperationsLayout
        title="Resource Market"
        description="Resource tracks and pricing"
      >
        <div className="text-center py-12 text-gray-400">
          No resource tracks available
        </div>
      </ModernOperationsLayout>
    );
  }

  // Separate resources into general and sector-specific
  const generalResources = resources.filter(
    (r: any) => r.trackType === ResourceTrackType.GLOBAL
  );
  const sectorResources = resources.filter(
    (r: any) => r.trackType === ResourceTrackType.SECTOR
  );

  return (
    <ModernOperationsLayout
      title="Resource Market"
      description="Resource tracks and pricing for factory construction"
    >
      <div className="space-y-6">
        {/* General Resources */}
        {generalResources.length > 0 && (
          <ModernOperationsSection title="General Resources">
            <p className="text-gray-400 mb-4 text-sm">
              These resources are available to all sectors for factory construction.
            </p>
            <div className="space-y-4">
              {generalResources.map((resource: any) => {
                const priceTrack = getResourcePriceForResourceType(resource.type);
                return (
                  <ResourceTrack
                    key={resource.id}
                    title={resource.type}
                    resourceType={resource.type as ResourceType}
                    track={priceTrack}
                    currentPrice={resource.price}
                  />
                );
              })}
            </div>
          </ModernOperationsSection>
        )}

        {/* Sector Resources */}
        {sectorResources.length > 0 && (
          <ModernOperationsSection title="Sector Resources">
            <p className="text-gray-400 mb-4 text-sm">
              These resources are specific to each sector and can only be used by factories in that sector.
            </p>
            <div className="space-y-4">
              {sectorResources.map((resource: any) => {
                const priceTrack = getResourcePriceForResourceType(resource.type);
                return (
                  <ResourceTrack
                    key={resource.id}
                    title={`${resource.type.replace('_', ' ')} (Sector)`}
                    resourceType={resource.type as ResourceType}
                    track={priceTrack}
                    currentPrice={resource.price}
                  />
                );
              })}
            </div>
          </ModernOperationsSection>
        )}
      </div>
    </ModernOperationsLayout>
  );
}

