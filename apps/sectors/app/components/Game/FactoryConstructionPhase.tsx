import React from 'react';
import { useGame } from './GameContext';
import { trpc } from '@sectors/app/trpc';
import { ModernCompany } from '../Company/CompanyV2/ModernCompany';
import { FactoryCreation } from '../Company/Factory';
import { ResourceTrack } from './ResourceTrack';
import { ResourceType } from '@/components/Company/Factory/Factory.types';
import { SectorName } from '@server/prisma/prisma.client';
import CompanyInfoV2 from '../Company/CompanyV2/CompanyInfoV2';

// Mock data for resource tracks - this would come from the backend
const generateTrack = (length: number, basePrice: number, increment: number): number[] => {
  const track = [];
  let currentPrice = basePrice;
  for (let i = 0; i < length; i++) {
    track.push(currentPrice);
    if (i % 3 === 0 && i > 0) {
      currentPrice += increment + 1;
    } else {
      currentPrice += increment;
    }
  }
  return track.reverse();
};

// General resource tracks (available to all sectors)
const generalResourceTracks = {
  TRIANGLE: {
    track: generateTrack(15, 8, 2),
    currentPrice: 12,
    resourceType: 'TRIANGLE' as ResourceType,
  },
  SQUARE: {
    track: generateTrack(20, 5, 1),
    currentPrice: 8,
    resourceType: 'SQUARE' as ResourceType,
  },
  CIRCLE: {
    track: generateTrack(25, 4, 1),
    currentPrice: 6,
    resourceType: 'CIRCLE' as ResourceType,
  },
};

// Sector-specific resource tracks
const sectorResourceTracks = {
  [SectorName.MATERIALS]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 14,
    resourceType: 'MATERIALS' as ResourceType,
  },
  [SectorName.INDUSTRIALS]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 12,
    resourceType: 'INDUSTRIALS' as ResourceType,
  },
  [SectorName.CONSUMER_DISCRETIONARY]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 16,
    resourceType: 'CONSUMER_DISCRETIONARY' as ResourceType,
  },
  [SectorName.CONSUMER_STAPLES]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 10,
    resourceType: 'CONSUMER_STAPLES' as ResourceType,
  },
  [SectorName.CONSUMER_CYCLICAL]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 18,
    resourceType: 'CONSUMER_CYCLICAL' as ResourceType,
  },
  [SectorName.CONSUMER_DEFENSIVE]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 8,
    resourceType: 'CONSUMER_DEFENSIVE' as ResourceType,
  },
  [SectorName.ENERGY]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 20,
    resourceType: 'ENERGY' as ResourceType,
  },
  [SectorName.HEALTHCARE]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 22,
    resourceType: 'HEALTHCARE' as ResourceType,
  },
  [SectorName.TECHNOLOGY]: {
    track: generateTrack(12, 10, 2),
    currentPrice: 24,
    resourceType: 'TECHNOLOGY' as ResourceType,
  },
};

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

  if (isLoading) return <div>Loading your companies...</div>;
  if (!companies || companies.length === 0) return <div>You do not own any companies eligible for factory construction.</div>;
  console.log('companies you own',companies);
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
            {Object.entries(generalResourceTracks).map(([resourceName, data]) => (
              <ResourceTrack
                key={resourceName}
                title={resourceName}
                resourceType={data.resourceType}
                track={data.track}
                currentPrice={data.currentPrice}
              />
            ))}
          </div>
        </div>

        {/* Sector Resource Tracks */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Sector Resource Tracks</h2>
          <p className="text-gray-400 mb-4">These resources are specific to each sector and can only be used by factories in that sector.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors?.map((sector) => {
              const sectorTrack = sectorResourceTracks[sector.sectorName as SectorName];
              if (!sectorTrack) return null;
              
              return (
                <ResourceTrack
                  key={sector.id}
                  title={`${sector.name} (${sector.sectorName.replace('_', ' ')})`}
                  resourceType={sectorTrack.resourceType}
                  track={sectorTrack.track}
                  currentPrice={sectorTrack.currentPrice}
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