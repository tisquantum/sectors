'use client';

import { ResourceTrack } from './ResourceTrack';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { ResourceTrackType } from '@server/prisma/prisma.client';
import { trpc } from '@sectors/app/trpc';
import { getResourcePriceForResourceType } from '@server/data/constants';
import { useGame } from './GameContext';

export function ResourceTracksContainer() {
  const { gameId } = useGame();
  // Only query if gameId is valid
  console.log('gameId', gameId);
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  console.log('isValidGameId', isValidGameId);
  const { data: resources, isLoading } = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );
  console.log('resources', resources);

  if (isLoading) {
    return <div className="p-4 text-gray-400">Loading resource tracks...</div>;
  }

  if (!resources || resources.length === 0) {
    return <div className="p-4 text-gray-400">No resource tracks available</div>;
  }

  // Separate resources into general and sector-specific
  const generalResources = resources.filter((r: any) => r.trackType === ResourceTrackType.GLOBAL);
  const sectorResources = resources.filter((r: any) => r.trackType === ResourceTrackType.SECTOR);

  return (
    <div className="p-4 space-y-6">
      {/* General Resources */}
      {generalResources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">General Resources</h3>
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
        </div>
      )}

      {/* Sector Resources */}
      {sectorResources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Sector Resources</h3>
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
        </div>
      )}
    </div>
  );
} 