'use client';

import { ResourceTrack } from './ResourceTrack';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { ResourceTrackType } from '@server/prisma/prisma.client';
import { trpc } from '@sectors/app/trpc';
import { getResourcePriceForResourceType, getSectorResourceForSectorName } from '@server/data/constants';
import { useGame } from './GameContext';
import { useMemo } from 'react';
import { SectorName } from '@server/prisma/prisma.client';

export function ResourceTracksContainer() {
  const { gameId } = useGame();
  // Only query if gameId is valid
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  const { data: resources, isLoading: resourcesLoading } = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );

  // Fetch factories and sectors for breakdown calculation
  const { data: factories } = trpc.factory.getGameFactories.useQuery(
    { gameId: isValidGameId ? gameId : '' },
    { enabled: isValidGameId }
  );

  const { data: sectors } = trpc.sector.listSectors.useQuery(
    { where: { gameId: isValidGameId ? gameId : '' } },
    { enabled: isValidGameId }
  );

  // Calculate breakdown: factories vs research milestones per sector resource
  const resourceBreakdown = useMemo(() => {
    if (!factories || !sectors || !resources) return new Map<ResourceType, { factories: number; researchMilestones: number }>();

    const breakdown = new Map<ResourceType, { factories: number; researchMilestones: number }>();

    // Count factories per sector (each factory consumes 1 sector resource)
    for (const factory of factories) {
      const sector = sectors.find(s => s.id === factory.sectorId);
      if (sector) {
        const sectorResourceType = getSectorResourceForSectorName(sector.sectorName as SectorName);
        if (sectorResourceType) {
          const current = breakdown.get(sectorResourceType) || { factories: 0, researchMilestones: 0 };
          breakdown.set(sectorResourceType, { ...current, factories: current.factories + 1 });
        }
      }
    }

    // Count research milestones per sector (Stage II, III, IV each consume 1 resource)
    for (const sector of sectors) {
      const sectorResourceType = getSectorResourceForSectorName(sector.sectorName as SectorName);
      if (!sectorResourceType) continue;

      const researchMarker = sector.researchMarker || 0;
      let researchStage = 1;
      if (researchMarker >= 16) {
        researchStage = 4;
      } else if (researchMarker >= 11) {
        researchStage = 3;
      } else if (researchMarker >= 6) {
        researchStage = 2;
      }

      // Each stage beyond Stage 1 consumed 1 resource (Stage 2 = 1, Stage 3 = 2, Stage 4 = 3)
      const researchMilestones = Math.max(0, researchStage - 1);

      const current = breakdown.get(sectorResourceType) || { factories: 0, researchMilestones: 0 };
      breakdown.set(sectorResourceType, { ...current, researchMilestones });
    }

    return breakdown;
  }, [factories, sectors, resources]);

  if (resourcesLoading) {
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
              const breakdown = resourceBreakdown.get(resource.type as ResourceType);
              // trackPosition is the actual number of resources consumed
              // Add it to breakdown if breakdown exists
              const breakdownWithTrackPosition = breakdown ? {
                ...breakdown,
                trackPosition: resource.trackPosition || 0,
              } : { factories: 0, researchMilestones: 0, trackPosition: resource.trackPosition || 0 };
              return (
                <ResourceTrack
                  key={resource.id}
                  title={`${resource.type.replace('_', ' ')} (Sector)`}
                  resourceType={resource.type as ResourceType}
                  track={priceTrack}
                  currentPrice={resource.price}
                  breakdown={breakdownWithTrackPosition}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 