'use client';

import { useState, useEffect } from 'react';
import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';
import { MarketingCampaignTier } from '@server/prisma/prisma.client';
import { Button, Spinner, Select, SelectItem } from '@nextui-org/react';
import { ResearchTrack } from '../../../Company/Research/ResearchTrack';
import { ModernOperationsLayout, ModernOperationsSection } from '../layouts';
import CompanyInfoV2 from '../../../Company/CompanyV2/CompanyInfoV2';
import { RiBuilding3Fill } from '@remixicon/react';

const RESEARCH_COSTS = {
  1: 100, // Phase I
  2: 200, // Phase II
  3: 300, // Phase III
  4: 400, // Phase IV
};

const MARKETING_CONFIG = {
  [MarketingCampaignTier.TIER_1]: {
    workers: 1,
    brandBonus: 1,
    cost: 100,
  },
  [MarketingCampaignTier.TIER_2]: {
    workers: 2,
    brandBonus: 2,
    cost: 200,
  },
  [MarketingCampaignTier.TIER_3]: {
    workers: 3,
    brandBonus: 3,
    cost: 300,
  },
};

export default function MarketingAndResearchPhase() {
  const { gameState, authPlayer, currentPhase, gameId } = useGame();
  const [showMarketingCreation, setShowMarketingCreation] = useState(false);
  const [selectedMarketingTier, setSelectedMarketingTier] = useState<MarketingCampaignTier | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Get all companies where the player is CEO
  const { data: playerCompanies, isLoading: companiesLoading } = trpc.company.listCompanies.useQuery({
    where: { gameId, ceoId: authPlayer?.id },
    orderBy: { name: 'asc' },
  });

  // Auto-select first company when companies are loaded and none is selected
  useEffect(() => {
    if (playerCompanies && playerCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(playerCompanies[0].id);
    }
  }, [playerCompanies, selectedCompanyId]);

  // Get currently selected company
  const currentCompany = playerCompanies?.find(c => c.id === selectedCompanyId);
  const hasCompanySelected = !!currentCompany;

  // Get current sector for research
  const currentSector = currentCompany ? gameState.sectors?.find(s => s.id === currentCompany.sectorId) : null;

  // Fetch worker allocation status (only if company selected)
  const { data: workforce } = trpc.modernOperations.getCompanyWorkforceStatus.useQuery({
    companyId: currentCompany?.id || '',
    gameId: gameState.id,
  }, {
    enabled: hasCompanySelected && !!currentCompany?.id,
  });

  // Fetch sector research progress (only if company selected)
  const { data: researchProgress } = trpc.modernOperations.getSectorResearchProgress.useQuery({
    sectorId: currentCompany?.sectorId || '',
    gameId: gameState.id,
  }, {
    enabled: hasCompanySelected && !!currentCompany?.sectorId,
  });

  const createMarketingCampaign = trpc.modernOperations.submitMarketingCampaign.useMutation({
    onSuccess: () => {
      setShowMarketingCreation(false);
      setSelectedMarketingTier(null);
    },
    onError: (error) => {
      console.error('Failed to create marketing campaign:', error);
      alert(`Error: ${error.message}`);
    },
  });

  const submitResearch = trpc.modernOperations.submitResearchAction.useMutation({
    onSuccess: () => {
      setIsResearching(false);
      setResearchResult(1); // Simplified - actual result comes from backend
    },
    onError: (error) => {
      setIsResearching(false);
      console.error('Failed to submit research:', error);
      alert(`Error: ${error.message}`);
    },
  });

  const handleCreateMarketingCampaign = async (tier: MarketingCampaignTier, slot: number = 1) => {
    if (!currentCompany) return;

    createMarketingCampaign.mutate({
      companyId: currentCompany.id,
      gameId: gameState.id,
      tier,
      slot,
    });
  };

  const handleResearch = async () => {
    if (!currentCompany || !currentSector) return;

    setIsResearching(true);
    submitResearch.mutate({
      companyId: currentCompany.id,
      gameId: gameState.id,
      sectorId: currentSector.id,
    });
  };

  const currentPhaseNumber = Math.ceil(Number(currentPhase?.name?.match(/\d+/)?.[0] || '1'));
  const researchCost = RESEARCH_COSTS[currentPhaseNumber as keyof typeof RESEARCH_COSTS] || 100;
  const canResearch = hasCompanySelected && currentCompany && currentCompany.cashOnHand >= researchCost;

  const sidebar = (
    <ModernOperationsSection title="Quick Info">
      <div className="space-y-4 text-sm text-gray-400">
        <div>
          <p className="font-medium text-gray-300 mb-2">Marketing Campaigns</p>
          <ul className="space-y-1 text-xs">
            <li>• Boost brand score</li>
            <li>• Requires workers</li>
            <li>• Costs cash</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-gray-300 mb-2">Research</p>
          <ul className="space-y-1 text-xs">
            <li>• Advance sector tech</li>
            <li>• Cost varies by phase</li>
            <li>• Random outcomes</li>
          </ul>
        </div>
        {hasCompanySelected && currentCompany && (
          <div className="pt-4 border-t border-gray-700">
            <CompanyInfoV2 companyId={currentCompany.id} isMinimal={true} />
          </div>
        )}
      </div>
    </ModernOperationsSection>
  );

  if (companiesLoading) {
    return (
      <ModernOperationsLayout
        title="Marketing & Research Phase"
        description="Create marketing campaigns and advance your research track"
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  if (!playerCompanies || playerCompanies.length === 0) {
    return (
      <ModernOperationsLayout
        title="Marketing & Research Phase"
        description="Create marketing campaigns and advance your research track"
      >
        <ModernOperationsSection>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">No Companies Available</p>
              <p className="text-gray-500 text-sm">
                You must be the CEO of a company to perform marketing and research actions.
              </p>
            </div>
          </div>
        </ModernOperationsSection>
      </ModernOperationsLayout>
    );
  }

  return (
    <ModernOperationsLayout
      title="Marketing & Research Phase"
      description="Create marketing campaigns and advance your research track"
      sidebar={sidebar}
    >
      <div className="space-y-6">
        {/* Company Selector */}
        <ModernOperationsSection title="Select Company">
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Select a company you are the CEO of to conduct marketing and research actions.
            </p>
            <Select
              label="Company"
              placeholder="Select a company"
              selectedKeys={currentCompany ? [currentCompany.id] : []}
              onSelectionChange={(keys) => {
                const selectedId = Array.from(keys)[0] as string;
                setSelectedCompanyId(selectedId || null);
              }}
              startContent={<RiBuilding3Fill size={18} />}
              classNames={{
                trigger: 'bg-gray-700/50 border-gray-600',
              }}
            >
              {playerCompanies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModernOperationsSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Marketing Section */}
          <ModernOperationsSection title="Marketing Campaigns">
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Create marketing campaigns to boost your brand and influence consumer behavior.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {Object.values(MarketingCampaignTier).map((tier: MarketingCampaignTier) => {
                  const config = MARKETING_CONFIG[tier];
                  const canAfford = hasCompanySelected && currentCompany && currentCompany.cashOnHand >= config.cost;
                  const isDisabled = !hasCompanySelected || !canAfford || createMarketingCampaign.isPending;
                  
                  return (
                    <div
                      key={tier}
                      className={`p-4 rounded-lg border transition-colors ${
                        !hasCompanySelected
                          ? 'border-gray-700 opacity-50 bg-gray-700/20 cursor-not-allowed'
                          : selectedMarketingTier === tier
                          ? 'border-purple-500 bg-purple-500/20 cursor-pointer'
                          : canAfford
                          ? 'border-gray-600 hover:border-purple-400 bg-gray-700/30 cursor-pointer'
                          : 'border-gray-700 opacity-50 bg-gray-700/20 cursor-not-allowed'
                      }`}
                      onClick={() => !isDisabled && canAfford && setSelectedMarketingTier(tier)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-200">
                            Campaign {tier.split('_')[1]}
                          </h3>
                          <div className="text-sm text-gray-400 space-y-1 mt-1">
                            <div>Workers: {config.workers}</div>
                            <div>Brand Bonus: +{config.brandBonus}</div>
                            <div>Cost: ${config.cost}</div>
                            {currentCompany && (
                              <div className={`mt-1 ${currentCompany.cashOnHand >= config.cost ? 'text-gray-400' : 'text-red-400'}`}>
                                Company Cash: ${currentCompany.cashOnHand}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          disabled={isDisabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) {
                              handleCreateMarketingCampaign(tier, 1); // Default to slot 1
                            }
                          }}
                        >
                          {createMarketingCampaign.isPending ? <Spinner size="sm" /> : 'Create'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ModernOperationsSection>

          {/* Research Section */}
          <ModernOperationsSection title="Research & Development">
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Invest in research to advance your sector's technology track and gain advantages.
              </p>
              
              <div className="space-y-3">
                <div className={`flex justify-between items-center p-3 rounded-lg ${
                  hasCompanySelected ? 'bg-gray-700/30' : 'bg-gray-700/20 opacity-50'
                }`}>
                  <div>
                    <div className="font-medium text-gray-200">Research Cost</div>
                    <div className="text-sm text-gray-400">Phase {currentPhaseNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-200">${researchCost}</div>
                    {currentCompany ? (
                      <div className={`text-sm ${currentCompany.cashOnHand >= researchCost ? 'text-gray-400' : 'text-red-400'}`}>
                        Company Cash: ${currentCompany.cashOnHand}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Select a company
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="font-medium text-gray-200 mb-2">Research Outcomes</h4>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>• Major Discovery: +2 spaces</div>
                    <div>• Minor Discovery: +1 space</div>
                    <div>• Failed Research: +0 spaces</div>
                  </div>
                </div>

                {researchResult !== null && (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        Research Complete!
                      </div>
                      <div className="text-sm text-green-300">
                        Advanced {researchResult} spaces on the research track
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  color="primary"
                  size="lg"
                  className="w-full"
                  disabled={!canResearch || isResearching || !hasCompanySelected}
                  onClick={handleResearch}
                >
                  {isResearching ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Researching...
                    </div>
                  ) : !hasCompanySelected ? (
                    'Select a Company First'
                  ) : (
                    'Conduct Research'
                  )}
                </Button>
              </div>
            </div>
          </ModernOperationsSection>
        </div>

        {/* Research Track Display */}
        {hasCompanySelected && currentCompany && (
          <ModernOperationsSection title="Research Track">
            <ResearchTrack
              currentProgress={currentCompany.researchProgress || 0}
              currentPhase={currentPhaseNumber}
              spaces={Array.from({ length: 20 }, (_, i) => ({
                id: `space-${i + 1}`,
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
          </ModernOperationsSection>
        )}
      </div>
    </ModernOperationsLayout>
  );
}

