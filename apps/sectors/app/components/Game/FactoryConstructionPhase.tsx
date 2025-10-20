import React from 'react';
import { useGame } from './GameContext';
import { trpc } from '@sectors/app/trpc';
import { ModernCompany } from '../Company/CompanyV2/ModernCompany';
import { FactoryCreation } from '../Company/Factory';
import { ResourceTrack } from './ResourceTrack';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { SectorName, ResourceTrackType } from '@server/prisma/prisma.client';
import CompanyInfoV2 from '../Company/CompanyV2/CompanyInfoV2';
import { 
  RESOURCE_PRICES_CIRCLE,
  RESOURCE_PRICES_SQUARE,
  RESOURCE_PRICES_TRIANGLE,
  getResourcePriceForResourceType,
} from '@server/data/constants';

const FactoryConstructionPhase = () => {
  const { gameId, authPlayer, currentPhase } = useGame();
  
  // Get companies where the current player is CEO
  const { data: companies, isLoading } = trpc.company.listCompanies.useQuery({
    where: { gameId, ceoId: authPlayer?.id },
    orderBy: { name: 'asc' },
  });

  // Get sectors for the game
  const { data: sectors } = trpc.sector.listSectors.useQuery({
    where: { gameId },
  });

  // Fetch real resource data from backend
  const { data: resources, isLoading: resourcesLoading } = trpc.resource.getGameResources.useQuery({
    gameId,
  });

  if (isLoading || resourcesLoading) return <div>Loading...</div>;
  if (!companies || companies.length === 0) return <div>You do not own any companies eligible for factory construction.</div>;

  // Separate resources into general and sector-specific
  const generalResources = resources?.filter(r => r.trackType === ResourceTrackType.GLOBAL) || [];
  const sectorResources = resources?.filter(r => r.trackType === ResourceTrackType.SECTOR) || [];
  return (
    <div className="p-6 rounded-lg shadow-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Factory Construction</h1>
        <p className="text-gray-400 mb-6">You may construct one factory for each of your companies this phase.</p>
      </div>

      {/* Resource Tracks Section */}
      <div className="space-y-6">
        {/* General Resource Tracks */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">General Resource Tracks</h2>
          <p className="text-gray-400 mb-4">These resources are available to all sectors for factory construction.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {generalResources.map((resource) => {
              // Get the price track for this resource type
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

        {/* Sector Resource Tracks */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Sector Resource Tracks</h2>
          <p className="text-gray-400 mb-4">These resources are specific to each sector and can only be used by factories in that sector.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectorResources.map((resource) => {
              const sector = sectors?.find(s => {
                // Match resource type to sector (e.g., HEALTHCARE resource → Healthcare sector)
                return s.sectorName === resource.type;
              });
              
              if (!sector) return null;

              // Get the price track for this resource type
              const priceTrack = getResourcePriceForResourceType(resource.type);
              
              return (
                <ResourceTrack
                  key={resource.id}
                  title={`${sector.name}`}
                  resourceType={resource.type as ResourceType}
                  track={priceTrack}
                  currentPrice={resource.price}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Company Factory Construction */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Your Companies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col gap-4">
              <CompanyInfoV2 companyId={company.id} isMinimal={true} />
              <ModernCompany companyId={company.id} gameId={gameId} currentPhase={currentPhase?.id} />
              <FactoryCreation
                companyId={company.id}
                gameId={gameId}
                factorySize={'FACTORY_I'}
                onClose={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FactoryConstructionPhase; 