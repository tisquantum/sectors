'use client';

import { useGame } from '../../GameContext';
import { Card, Chip, Spinner, Popover, PopoverContent, PopoverTrigger } from '@nextui-org/react';
import { ResearchTrack } from '../../../Company/Research/ResearchTrack';
import { ModernOperationsLayout, ModernOperationsSection } from '../layouts';
import { useModernOperations } from '../hooks';
import { trpc } from '@sectors/app/trpc';
import { useMemo } from 'react';
import PlayerAvatar from '@sectors/app/components/Player/PlayerAvatar';
import { Player } from '@server/prisma/prisma.client';
import { RiInformationLine } from '@remixicon/react';

export default function MarketingAndResearchResolvePhase() {
  const { gameState, currentPhase, gameId } = useGame();
  const { researchProgress } = useModernOperations();

  // Get all companies that participated in this phase
  const companies = gameState.Company.filter(company => 
    company.status === 'ACTIVE' && company.isFloated
  );

  const currentPhaseNumber = Math.ceil(Number(currentPhase?.name?.match(/\d+/)?.[0] || '1'));

  // Fetch marketing campaigns for each company
  const companyCampaignQueries = companies.map(company =>
    trpc.marketing.getCompanyCampaigns.useQuery(
      {
        companyId: company.id,
        gameId,
      },
      { enabled: !!company.id && !!gameId }
    )
  );

  const companyBrandBonusQueries = companies.map(company =>
    trpc.marketing.getTotalBrandBonus.useQuery(
      {
        companyId: company.id,
        gameId,
      },
      { enabled: !!company.id && !!gameId }
    )
  );

  const isLoadingCampaigns = companyCampaignQueries.some(q => q.isLoading);
  const isLoadingBrandBonus = companyBrandBonusQueries.some(q => q.isLoading);

  // Create maps for quick lookup
  const campaignsByCompany = useMemo(() => {
    const map = new Map();
    companyCampaignQueries.forEach((query, index) => {
      if (query.data && companies[index]) {
        map.set(companies[index].id, query.data);
      }
    });
    return map;
  }, [companyCampaignQueries, companies]);

  const brandBonusByCompany = useMemo(() => {
    const map = new Map();
    companyBrandBonusQueries.forEach((query, index) => {
      if (query.data !== undefined && companies[index]) {
        map.set(companies[index].id, query.data);
      }
    });
    return map;
  }, [companyBrandBonusQueries, companies]);

  // Calculate total brand bonus across all companies
  const totalBrandBonus = useMemo(() => {
    return Array.from(brandBonusByCompany.values()).reduce((sum, bonus) => sum + bonus, 0);
  }, [brandBonusByCompany]);

  if (isLoadingCampaigns || isLoadingBrandBonus) {
    return (
      <ModernOperationsLayout
        title="Marketing & Research Results"
        description={`Phase ${currentPhaseNumber} - Resolving all marketing campaigns and research advances`}
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  return (
    <ModernOperationsLayout
      title="Marketing & Research Results"
      description={`Phase ${currentPhaseNumber} - Resolving all marketing campaigns and research advances`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Marketing Results */}
          <ModernOperationsSection 
            title={
              <div className="flex items-center gap-2">
                <span>Marketing Campaigns</span>
                <Popover placement="bottom">
                  <PopoverTrigger>
                    <div className="flex items-center cursor-pointer">
                      <RiInformationLine size={16} className="text-gray-400" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-4">
                    <div>
                      <p className="font-semibold mb-2">Marketing Campaign Rules:</p>
                      <ul className="space-y-1 list-disc list-inside text-sm">
                        <li><strong>Costs:</strong> Marketing I ($100), II ($200), III ($300), IV ($400) base cost</li>
                        <li><strong>Slot Penalties:</strong> Additional $0, $100, $200, $300, $400 for concurrent campaigns</li>
                        <li><strong>Brand Bonuses:</strong> +1 (I), +2 (II), +3 (III), +4 (IV) brand score per tier</li>
                        <li><strong>Consumption Markers:</strong> +1, +2, +3, +4 temporary markers added to sector bag</li>
                        <li><strong>Lifespan:</strong> ACTIVE (turn 1) → DECAYING (turn 2) → Expired (turn 3, deleted)</li>
                        <li><strong>Effect:</strong> Brand bonus reduces perceived price (attraction rating = unitPrice - brandBonus)</li>
                        <li><strong>Workers:</strong> Requires 1-4 workers depending on tier (returned when campaign expires)</li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            }
          >
            <div className="space-y-4">
              {companies.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No companies participated in marketing</p>
              ) : (
                companies.map((company) => {
                  const campaigns = campaignsByCompany.get(company.id) || [];
                  const brandBonus = brandBonusByCompany.get(company.id) || 0;
                  
                  return (
                    <div key={company.id} className="p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-200">{company.name}</h3>
                          <p className="text-sm text-gray-400">{company.stockSymbol}</p>
                        </div>
                        <Chip 
                          color="primary" 
                          variant="flat" 
                          size="sm"
                          avatar={<PlayerAvatar player={gameState.Player.find(p => p.id === company.ceoId) as Player} />}
                        >
                          {gameState.Player.find(p => p.id === company.ceoId)?.nickname || 'Unknown'}
                        </Chip>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Brand Score:</span>
                          <span className="text-gray-200 font-medium">
                            {company.brandScore || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Active Campaigns:</span>
                          <span className="text-gray-200 font-medium">
                            {campaigns.length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Brand Bonus:</span>
                          <span className="text-green-400 font-medium">
                            +{brandBonus}
                          </span>
                        </div>
                        {campaigns.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <div className="text-xs text-gray-400 mb-2">Campaign Details:</div>
                            <div className="space-y-1">
                              {campaigns.map((campaign: any) => (
                                <div key={campaign.id} className="flex justify-between text-xs">
                                  <span className="text-gray-400">
                                    {campaign.tier} (Slot {campaign.slot || 'N/A'})
                                  </span>
                                  <span className="text-green-400">
                                    +{campaign.brandBonus} bonus
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ModernOperationsSection>

          {/* Research Results */}
          <ModernOperationsSection 
            title={
              <div className="flex items-center gap-2">
                <span>Research Advances</span>
                <Popover placement="bottom">
                  <PopoverTrigger>
                    <div className="flex items-center cursor-pointer">
                      <RiInformationLine size={16} className="text-gray-400" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-4">
                    <div>
                      <p className="font-semibold mb-2">Research Rules:</p>
                      <ul className="space-y-1 list-disc list-inside text-sm">
                        <li><strong>Costs:</strong> Phase I ($100), II ($200), III ($300), IV ($400) per action</li>
                        <li><strong>Progress:</strong> Random result: +0, +1, or +2 spaces per research action</li>
                        <li><strong>Company Milestones:</strong></li>
                        <li className="ml-4">• Progress 5: +$200 grant (cash bonus)</li>
                        <li className="ml-4">• Progress 10: +1 market favor (stock boost)</li>
                        <li><strong>Sector Technology:</strong> Advances when total sector research hits milestones</li>
                        <li><strong>Workers:</strong> Requires 1-4 workers depending on phase (returned next turn)</li>
                        <li><strong>Effect:</strong> Individual company progress + shared sector progress</li>
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            }
          >
            <div className="space-y-4">
              {companies.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No companies participated in research</p>
              ) : (
                companies.map((company) => (
                  <div key={company.id} className="p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-200">{company.name}</h3>
                        <p className="text-sm text-gray-400">{company.stockSymbol}</p>
                      </div>
                      <Chip 
                        color="secondary" 
                        variant="flat" 
                        size="sm"
                        avatar={<PlayerAvatar player={gameState.Player.find(p => p.id === company.ceoId) as Player} />}
                      >{gameState.Player.find(p => p.id === company.ceoId)?.nickname || 'Unknown'}
                      </Chip>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Research Progress:</span>
                        <span className="text-gray-200 font-medium">
                          {company.researchProgress || 0} spaces
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sector:</span>
                        <span className="text-gray-200 font-medium">
                          {gameState.sectors?.find((s: any) => s.id === company.sectorId)?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ModernOperationsSection>
        </div>

        {/* Sector Research Tracks */}
        <ModernOperationsSection 
          title={
            <div className="flex items-center gap-2">
              <span>Sector Research Tracks</span>
              <Popover placement="bottom">
                <PopoverTrigger>
                  <div className="flex items-center cursor-pointer">
                    <RiInformationLine size={16} className="text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="p-4">
                  <div>
                    <p className="font-semibold mb-2">Research Track Rules:</p>
                    <ul className="space-y-1 list-disc list-inside text-sm">
                      <li><strong>Track Structure:</strong> 20 spaces per sector (4 phases of 5 spaces each)</li>
                      <li><strong>Technology Levels:</strong> Unlock factory slots based on total sector research:</li>
                      <li className="ml-4">• Level 1 (5+ research): 2 factory slots unlocked</li>
                      <li className="ml-4">• Level 2 (15+ research): 3 factory slots unlocked</li>
                      <li className="ml-4">• Level 3 (30+ research): 4 factory slots unlocked</li>
                      <li className="ml-4">• Level 4 (50+ research): 5 factory slots unlocked</li>
                      <li><strong>Shared Progress:</strong> All companies in a sector contribute to the same track</li>
                      <li><strong>Markers:</strong> Research marker shows current sector-wide progress (0-20)</li>
                      <li><strong>Rewards:</strong> Rewards at spaces 5, 10, 15, and 20 (grants and market favors)</li>
                      <li><strong>Factory Slots:</strong> Technology level determines maximum factory slots per company</li>
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          }
        >
          <div className="space-y-6">
            {gameState.sectors?.map((sector: any) => {
              const sectorProgress = researchProgress.find((rp: any) => rp.sectorId === sector.id);
              
              return (
                <div key={sector.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-200">{sector.name}</h3>
                    <div className="flex gap-2">
                      <Chip size="sm" color="primary" variant="flat">
                        Technology Level: {sector.technologyLevel || 0}
                      </Chip>
                      <Chip size="sm" color="secondary" variant="flat">
                        Research Marker: {sector.researchMarker || sectorProgress?.researchMarker || 0}
                      </Chip>
                    </div>
                  </div>
                  
                  <ResearchTrack
                    currentProgress={sector.researchMarker || sectorProgress?.researchMarker || 0}
                    currentPhase={currentPhaseNumber}
                    spaces={Array.from({ length: 20 }, (_, i) => ({
                      id: `sector-${sector.id}-space-${i + 1}`,
                      number: i + 1,
                      phase: Math.ceil((i + 1) / 5),
                      isUnlocked: i < 20,
                      hasReward: (i + 1) % 5 === 0,
                      reward: (i + 1) % 5 === 0 ? {
                        type: 'GRANT' as const,
                        amount: Math.ceil((i + 1) / 5) * 100,
                      } : undefined,
                    }))}
                  />
                  
                  <div className="text-sm text-gray-400">
                    Companies in this sector: {
                      companies.filter(c => c.sectorId === sector.id).length
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </ModernOperationsSection>

        {/* Summary */}
        <ModernOperationsSection title="Phase Summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-gray-200">
                {companies.length}
              </div>
              <div className="text-sm text-gray-400">Companies Participated</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                +{totalBrandBonus}
              </div>
              <div className="text-sm text-gray-400">Total Brand Bonus</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {companies.reduce((sum, c) => sum + (c.researchProgress || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Research Progress</div>
            </div>
          </div>
        </ModernOperationsSection>
      </div>
    </ModernOperationsLayout>
  );
}

