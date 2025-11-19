import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from './GameContext';
import { trpc } from '@sectors/app/trpc';
import { ModernCompany } from '../Company/CompanyV2/ModernCompany';
import { FactoryCreation, ConstructionOrders } from '../Company/Factory';
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
import { Tabs, Tab, Button, Spinner } from '@nextui-org/react';
import { RiBuilding3Fill, RiPriceTag3Fill } from '@remixicon/react';

const FactoryConstructionPhase = () => {
  const { gameId, authPlayer, currentPhase } = useGame();
  
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; size: 'FACTORY_I' | 'FACTORY_II' | 'FACTORY_III' | 'FACTORY_IV' } | null>(null);
  const [showFactoryCreation, setShowFactoryCreation] = useState(false);
  
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
  // Only query if gameId is valid
  const isValidGameId = !!gameId && typeof gameId === 'string' && gameId.length > 0;
  const { data: resources, isLoading: resourcesLoading } = trpc.resource.getGameResources.useQuery(
    {
      gameId: isValidGameId ? gameId : '',
    },
    { enabled: isValidGameId }
  );

  if (isLoading || resourcesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">You do not own any companies eligible for factory construction.</p>
        </div>
      </div>
    );
  }

  // Separate resources into general and sector-specific
  const generalResources = resources?.filter(r => r.trackType === ResourceTrackType.GLOBAL) || [];
  const sectorResources = resources?.filter(r => r.trackType === ResourceTrackType.SECTOR) || [];

  const handleOpenFactoryCreation = (companyId: string, factorySize: 'FACTORY_I' | 'FACTORY_II' | 'FACTORY_III' | 'FACTORY_IV' = 'FACTORY_I') => {
    setSelectedCompany({ id: companyId, size: factorySize });
    setShowFactoryCreation(true);
  };

  const handleCloseFactoryCreation = () => {
    setShowFactoryCreation(false);
    setSelectedCompany(null);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Factory Construction</h1>
          <p className="text-gray-400">You may construct multiple factories for your companies this phase (limited by available slots and cash).</p>
        </div>

        <Tabs aria-label="Factory Construction Tabs" className="w-full">
          <Tab
            key="companies"
            title={
              <div className="flex items-center gap-2">
                <RiBuilding3Fill size={18} />
                <span>Your Companies</span>
              </div>
            }
          >
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="space-y-3">
                      <CompanyInfoV2 companyId={company.id} isMinimal={true} />
                      
                      {/* Factory Slots Preview */}
                      <div className="pt-2 border-t border-gray-700">
                        <ModernCompany
                          companyId={company.id}
                          gameId={gameId}
                          currentPhase={currentPhase?.id}
                        />
                      </div>

                      {/* Outstanding Orders & History */}
                      <div className="pt-2 border-t border-gray-700">
                        <ConstructionOrders companyId={company.id} gameId={gameId} />
                      </div>

                      {/* Build Factory Button */}
                      <Button
                        onClick={() => handleOpenFactoryCreation(company.id, 'FACTORY_I')}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
                        startContent={<RiBuilding3Fill size={18} />}
                      >
                        Build Factory
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tab>

          <Tab
            key="resources"
            title={
              <div className="flex items-center gap-2">
                <RiPriceTag3Fill size={18} />
                <span>Resource Tracks</span>
              </div>
            }
          >
            <div className="mt-6 space-y-6">
              {/* General Resource Tracks */}
              {generalResources.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">General Resource Tracks</h2>
                  <p className="text-gray-400 mb-4 text-sm">These resources are available to all sectors for factory construction.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generalResources.map((resource) => {
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

              {/* Sector Resource Tracks */}
              {sectorResources.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Sector Resource Tracks</h2>
                  <p className="text-gray-400 mb-4 text-sm">These resources are specific to each sector and can only be used by factories in that sector.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectorResources.map((resource) => {
                      const sector = sectors?.find(s => {
                        return s.sectorName === resource.type;
                      });
                      
                      if (!sector) return null;

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
              )}
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Factory Creation Modal */}
      {showFactoryCreation && selectedCompany && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="animate-in fade-in-0 zoom-in-95 duration-200">
            <FactoryCreation
              companyId={selectedCompany.id}
              gameId={gameId}
              factorySize={selectedCompany.size}
              onClose={handleCloseFactoryCreation}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FactoryConstructionPhase; 