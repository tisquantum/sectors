'use client';

import { useState } from 'react';
import { useGame } from './GameContext';
import { trpc } from '../../trpc';
import { MarketingCampaignTier, OperationMechanicsVersion } from '@server/prisma/prisma.client';
import { Button, Card, CardBody, CardHeader, Divider, Spinner } from '@nextui-org/react';
import { MarketingCreation } from '../Company/Marketing/MarketingCreation';
import { ResearchTrack } from '../Company/Research/ResearchTrack';

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

export default function MarketingAndResearchAction() {
  const { gameState, authPlayer, currentPhase } = useGame();
  const [showMarketingCreation, setShowMarketingCreation] = useState(false);
  const [selectedMarketingTier, setSelectedMarketingTier] = useState<MarketingCampaignTier | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<number | null>(null);

  // Get the current company (assuming the auth player is the CEO)
  const currentCompany = gameState.Company.find(company => company.ceoId === authPlayer?.id);
  
  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No company found for current player</p>
      </div>
    );
  }

  // Get current sector for research
  const currentSector = gameState.sectors?.find(s => s.id === currentCompany.sectorId);

  // Fetch worker allocation status
  const { data: workforce } = trpc.modernOperations.getCompanyWorkforceStatus.useQuery({
    companyId: currentCompany.id,
    gameId: gameState.id,
  });

  // Fetch sector research progress
  const { data: researchProgress } = trpc.modernOperations.getSectorResearchProgress.useQuery({
    sectorId: currentCompany.sectorId,
    gameId: gameState.id,
  }, {
    enabled: !!currentCompany.sectorId,
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

  const handleCreateMarketingCampaign = (tier: MarketingCampaignTier) => {
    if (!currentCompany || !authPlayer) return;
    
    // Open the marketing creation modal with the selected tier
    setSelectedMarketingTier(tier);
    setShowMarketingCreation(true);
  };

  const handleResearch = async () => {
    if (!currentCompany || !currentSector || !authPlayer) return;

    setIsResearching(true);
    submitResearch.mutate({
      companyId: currentCompany.id,
      gameId: gameState.id,
      playerId: authPlayer.id,
      sectorId: currentSector.id,
    });
  };

  // Calculate research cost based on sector research stage (researchMarker)
  const sectorResearchMarker = currentSector?.researchMarker || 0;
  const researchStage = Math.min(Math.floor(sectorResearchMarker / 5) + 1, 4);
  const researchCost = RESEARCH_COSTS[researchStage as keyof typeof RESEARCH_COSTS] || 100;
  const canResearch = currentCompany.cashOnHand >= researchCost;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-200 mb-2">Marketing & Research Phase</h1>
        <p className="text-gray-400">
          Create marketing campaigns and advance your research track
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketing Section */}
        <Card className="bg-gray-800/50 border border-gray-700">
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold text-gray-200">Marketing Campaigns</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-gray-400 text-sm">
              Create marketing campaigns to boost your brand and influence consumer behavior.
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              {Object.values(MarketingCampaignTier).map((tier: MarketingCampaignTier) => {
                const config = MARKETING_CONFIG[tier];
                const canAfford = currentCompany.cashOnHand >= config.cost;
                
                return (
                  <Card
                    key={tier}
                    className={`cursor-pointer transition-colors ${
                      selectedMarketingTier === tier
                        ? 'border-purple-500 bg-purple-500/20'
                        : canAfford
                        ? 'border-gray-600 hover:border-purple-400'
                        : 'border-gray-700 opacity-50'
                    }`}
                    onClick={() => canAfford && setSelectedMarketingTier(tier)}
                  >
                    <CardBody className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-200">
                            Campaign {tier.split('_')[1]}
                          </h3>
                          <div className="text-sm text-gray-400 space-y-1">
                            <div>Workers: {config.workers}</div>
                            <div>Brand Bonus: +{config.brandBonus}</div>
                            <div>Cost: ${config.cost}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          disabled={!canAfford}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateMarketingCampaign(tier);
                          }}
                        >
                          Create
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Research Section */}
        <Card className="bg-gray-800/50 border border-gray-700">
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold text-gray-200">Research & Development</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-gray-400 text-sm">
              Invest in research to advance your sector&apos;s technology track and gain advantages.
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <div className="font-medium text-gray-200">Research Cost</div>
                  <div className="text-sm text-gray-400">Stage {researchStage} (Progress: {sectorResearchMarker}/20)</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-200">${researchCost}</div>
                  <div className="text-sm text-gray-400">
                    Company Cash: ${currentCompany.cashOnHand}
                  </div>
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
                disabled={!canResearch || isResearching}
                onClick={handleResearch}
              >
                {isResearching ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Researching...
                  </div>
                ) : (
                  'Conduct Research'
                )}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Research Track Display */}
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardHeader className="pb-3">
          <h2 className="text-xl font-semibold text-gray-200">Research Track</h2>
        </CardHeader>
        <CardBody>
          <ResearchTrack
            currentProgress={currentCompany.researchProgress || 0}
            currentStage={researchStage}
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
        </CardBody>
      </Card>

      {/* Marketing Creation Modal */}
      {showMarketingCreation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <MarketingCreation
            companyId={currentCompany.id}
            gameId={gameState.id}
            onClose={() => setShowMarketingCreation(false)}
          />
        </div>
      )}
    </div>
  );
} 