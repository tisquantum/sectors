"use client";

import { useState, useEffect, useMemo } from "react";
import { useGame } from "../../GameContext";
import { trpc } from "@sectors/app/trpc";
import {
  MarketingCampaignTier,
  ResourceType,
  OperationMechanicsVersion,
} from "@server/prisma/prisma.client";
import {
  Button,
  Spinner,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { ResearchTrack } from "../../../Company/Research/ResearchTrack";
import { ModernOperationsLayout, ModernOperationsSection } from "../layouts";
import CompanyInfoV2 from "../../../Company/CompanyV2/CompanyInfoV2";
import { ConsumptionBagViewer } from "../ConsumptionBagViewer";
import { RiBuilding3Fill, RiVipCrown2Fill } from "@remixicon/react";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../../../Player/PlayerAvatar";

const RESEARCH_COSTS = {
  1: 100, // Stage 1 (researchMarker 0-5)
  2: 200, // Stage 2 (researchMarker 6-10)
  3: 300, // Stage 3 (researchMarker 11-15)
  4: 400, // Stage 4 (researchMarker 16-20)
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
  const [selectedMarketingTier, setSelectedMarketingTier] =
    useState<MarketingCampaignTier | null>(null);
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>(
    []
  );
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const {
    isOpen: isErrorModalOpen,
    onOpen: onErrorModalOpen,
    onOpenChange: onErrorModalOpenChange,
  } = useDisclosure();
  const {
    isOpen: isResourceModalOpen,
    onOpen: onResourceModalOpen,
    onOpenChange: onResourceModalOpenChange,
  } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Get tRPC utils for invalidating queries
  const trpcUtils = trpc.useUtils();

  // Get all companies where the player has shares (owns)
  const { data: playersWithShares } = trpc.player.playersWithShares.useQuery({
    where: { gameId },
  });

  // Get all companies in the game
  const { data: allCompanies, isLoading: companiesLoading } =
    trpc.company.listCompanies.useQuery({
      where: { gameId },
      orderBy: { name: "asc" },
    });

  // Find companies the player owns shares in
  const playerCompanies = useMemo(() => {
    if (!playersWithShares || !allCompanies || !authPlayer) return [];
    const authPlayerWithShares = playersWithShares.find(p => p.id === authPlayer.id);
    if (!authPlayerWithShares) return [];
    
    // Get company IDs where player has shares
    const companyIdsWithShares = new Set(
      authPlayerWithShares.Share
        .filter(share => share.location === 'PLAYER' && !share.shortOrderId)
        .map(share => share.companyId)
    );
    
    // Return companies with their CEO info
    return allCompanies
      .filter(company => companyIdsWithShares.has(company.id))
      .map(company => {
        const isCEO = company.ceoId === authPlayer.id;
        const ceoPlayer = playersWithShares.find(p => p.id === company.ceoId);
        return {
          ...company,
          isCEO,
          ceoPlayer: ceoPlayer || null,
        };
      });
  }, [playersWithShares, allCompanies, authPlayer]);

  // Auto-select first company when companies are loaded and none is selected
  useEffect(() => {
    if (playerCompanies && playerCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(playerCompanies[0].id);
    }
  }, [playerCompanies, selectedCompanyId]);

  // Get currently selected company
  const currentCompany = playerCompanies?.find(
    (c) => c.id === selectedCompanyId
  );
  const hasCompanySelected = !!currentCompany;
  const canOperateCompany = currentCompany?.isCEO === true;

  // Get current sector for research and resource filtering
  const currentSector = currentCompany
    ? gameState.sectors?.find((s) => s.id === currentCompany.sectorId)
    : null;

  // Fetch worker allocation status (only if company selected)
  const { data: workforce } =
    trpc.modernOperations.getCompanyWorkforceStatus.useQuery(
      {
        companyId: currentCompany?.id || "",
        gameId: gameState.id,
      },
      {
        enabled: hasCompanySelected && !!currentCompany?.id,
      }
    );

  // Fetch sector research progress (only if company selected)
  const { data: researchProgress } =
    trpc.modernOperations.getSectorResearchProgress.useQuery(
      {
        sectorId: currentCompany?.sectorId || "",
        gameId: gameState.id,
      },
      {
        enabled: hasCompanySelected && !!currentCompany?.sectorId,
      }
    );

  const createMarketingCampaign =
    trpc.modernOperations.submitMarketingCampaign.useMutation({
      onSuccess: async () => {
        setShowMarketingCreation(false);
        setSelectedMarketingTier(null);
        setSelectedResources([]);
        onResourceModalOpenChange();
        
        // Invalidate queries to refresh the UI
        if (currentCompany) {
          await Promise.all([
            trpcUtils.marketing.getCompanyCampaigns.invalidate({
              companyId: currentCompany.id,
              gameId: gameState.id,
            }),
            trpcUtils.marketing.getTotalBrandBonus.invalidate({
              companyId: currentCompany.id,
              gameId: gameState.id,
            }),
            trpcUtils.company.listCompanies.invalidate({
              where: { gameId, ceoId: authPlayer?.id },
            }),
          ]);
        }
      },
      onError: (error) => {
        console.error("Failed to create marketing campaign:", error);
        setErrorMessage(error.message || "Failed to create marketing campaign");
        onErrorModalOpen();
      },
    });

  const submitResearch = trpc.modernOperations.submitResearchAction.useMutation(
    {
      onSuccess: () => {
        setIsResearching(false);
        setResearchResult(1); // Simplified - actual result comes from backend
      },
      onError: (error) => {
        setIsResearching(false);
        console.error("Failed to submit research:", error);
        setErrorMessage(error.message || "Failed to submit research");
        onErrorModalOpen();
      },
    }
  );

  const handleCreateMarketingCampaign = async (
    tier: MarketingCampaignTier,
    slot: number = 1
  ) => {
    if (!currentCompany || !authPlayer) return;

    const requiredCount = getRequiredResourceCount(tier);
    if (selectedResources.length !== requiredCount) {
      setErrorMessage(
        `Please select exactly ${requiredCount} resource(s) for ${tier}`
      );
      onErrorModalOpen();
      return;
    }

    createMarketingCampaign.mutate({
      companyId: currentCompany.id,
      gameId: gameState.id,
      playerId: authPlayer.id,
      tier,
      slot,
      resourceTypes: selectedResources,
    });
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
  // Research track has 20 spaces divided into 4 stages of 5 spaces each
  // Stage 1: 0-5 ($100), Stage 2: 6-10 ($200), Stage 3: 11-15 ($300), Stage 4: 16-20 ($400)
  const sectorResearchMarker = currentSector?.researchMarker || 0;
  const researchStage = Math.min(Math.floor(sectorResearchMarker / 5) + 1, 4);
  const researchCost =
    RESEARCH_COSTS[researchStage as keyof typeof RESEARCH_COSTS] || 100;
  const canResearch =
    hasCompanySelected &&
    currentCompany &&
    currentCompany.cashOnHand >= researchCost;

  // Fetch marketing campaigns for selected company
  const { data: campaigns } = trpc.marketing.getCompanyCampaigns.useQuery(
    {
      companyId: currentCompany?.id || "",
      gameId: gameState.id,
    },
    { enabled: hasCompanySelected && !!currentCompany?.id }
  );

  // Fetch brand bonus for selected company
  const { data: totalBrandBonus } = trpc.marketing.getTotalBrandBonus.useQuery(
    {
      companyId: currentCompany?.id || "",
      gameId: gameState.id,
    },
    { enabled: hasCompanySelected && !!currentCompany?.id }
  );

  // Fetch resources for selection
  const isValidGameId =
    !!gameId && typeof gameId === "string" && gameId.length > 0;
  const { data: resourcesData } = trpc.resource.getGameResources.useQuery(
    { gameId: isValidGameId ? gameId : "" },
    { enabled: isValidGameId }
  );

  // Helper function to get sector resource type
  const getSectorResourceType = (sectorName: string): ResourceType | null => {
    switch (sectorName) {
      case "MATERIALS":
        return ResourceType.MATERIALS;
      case "INDUSTRIALS":
        return ResourceType.INDUSTRIALS;
      case "CONSUMER_DISCRETIONARY":
        return ResourceType.CONSUMER_DISCRETIONARY;
      case "CONSUMER_STAPLES":
        return ResourceType.CONSUMER_STAPLES;
      case "CONSUMER_CYCLICAL":
        return ResourceType.CONSUMER_CYCLICAL;
      case "CONSUMER_DEFENSIVE":
        return ResourceType.CONSUMER_DEFENSIVE;
      case "ENERGY":
        return ResourceType.ENERGY;
      case "HEALTHCARE":
        return ResourceType.HEALTHCARE;
      case "TECHNOLOGY":
        return ResourceType.TECHNOLOGY;
      default:
        return null;
    }
  };

  // Filter available resources: only TRIANGLE, SQUARE, CIRCLE, and the company's sector resource
  const baseResources: ResourceType[] = [
    ResourceType.TRIANGLE,
    ResourceType.SQUARE,
    ResourceType.CIRCLE,
  ];
  const sectorResource = currentSector
    ? getSectorResourceType(currentSector.sectorName)
    : null;
  const allowedResources = sectorResource
    ? [...baseResources, sectorResource]
    : baseResources;

  // Filter the fetched resources to only show allowed ones
  const availableResources =
    resourcesData
      ?.filter((r) => allowedResources.includes(r.type as ResourceType))
      ?.map((r) => r.type as ResourceType) || [];

  const getRequiredResourceCount = (tier: MarketingCampaignTier): number => {
    switch (tier) {
      case MarketingCampaignTier.TIER_1:
        return 1;
      case MarketingCampaignTier.TIER_2:
        return 2;
      case MarketingCampaignTier.TIER_3:
        return 3;
      default:
        return 0;
    }
  };

  const handleResourceToggle = (resourceType: ResourceType) => {
    if (!selectedMarketingTier) return;

    const requiredCount = getRequiredResourceCount(selectedMarketingTier);
    const isSelected = selectedResources.includes(resourceType);

    if (isSelected) {
      setSelectedResources((prev) => prev.filter((r) => r !== resourceType));
    } else if (selectedResources.length < requiredCount) {
      setSelectedResources((prev) => [...prev, resourceType]);
    }
  };

  const handleOpenResourceSelection = (tier: MarketingCampaignTier) => {
    setSelectedMarketingTier(tier);
    setSelectedResources([]);
    onResourceModalOpen();
  };

  const sidebar = (
    <ModernOperationsSection title="Quick Info">
      <div className="space-y-4 text-sm text-gray-400">
        {hasCompanySelected && currentCompany && (
          <>
            <div>
              <p className="font-medium text-gray-300 mb-2">
                Marketing Campaigns
              </p>
              <ul className="space-y-1 text-xs">
                <li>• Boost brand score</li>
                <li>• Requires workers</li>
                <li>• Costs cash</li>
                {campaigns && campaigns.length > 0 && (
                  <>
                    <li className="text-purple-300 mt-2">
                      Active: {campaigns.length} campaign
                      {campaigns.length !== 1 ? "s" : ""}
                    </li>
                    <li className="text-purple-300">
                      Total Brand Bonus: +{totalBrandBonus || 0}
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-300 mb-2">Research</p>
              <ul className="space-y-1 text-xs">
                <li>• Advance sector tech</li>
                <li>• Cost varies by phase</li>
                <li>• Random outcomes</li>
                {currentCompany && (
                  <>
                    <li className="text-blue-300 mt-2">
                      Progress: {currentCompany.researchProgress || 0} spaces
                    </li>
                    {researchProgress && (
                      <li className="text-blue-300">
                        Sector Tech: Level{" "}
                        {researchProgress.technologyLevel || 0}
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
            <div className="pt-4 border-t border-gray-700">
              <CompanyInfoV2 companyId={currentCompany.id} isMinimal={true} />
            </div>
          </>
        )}
        {!hasCompanySelected && (
          <>
            <div>
              <p className="font-medium text-gray-300 mb-2">
                Marketing Campaigns
              </p>
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
          </>
        )}
      </div>
    </ModernOperationsSection>
  );

  if (companiesLoading) {
    return (
      <ModernOperationsLayout
        title="Modern Operations"
        description="Build factories, create marketing campaigns, and advance your research track"
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  // Still show the layout even if no companies - user can see the phase

  return (
    <ModernOperationsLayout
      title="Modern Operations"
      description="Build factories, create marketing campaigns, and advance your research track"
      sidebar={sidebar}
    >
      <div className="space-y-6">
        {/* Company Selector - Show all companies you own */}
        <ModernOperationsSection title="Your Companies">
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Select a company you own to view or operate. You can only operate companies where you are the CEO.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerCompanies.map((company) => {
                const isSelected = selectedCompanyId === company.id;
                const isCEO = company.isCEO;
                
                return (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={cn(
                      "relative rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500"
                        : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                    )}
                  >
                    <div className="p-4">
                      <CompanyInfoV2 companyId={company.id} isMinimal={true} />
                      
                      {/* CEO Indicator */}
                      {isCEO ? (
                        <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                          <RiVipCrown2Fill size={16} />
                          <span>You are CEO</span>
                        </div>
                      ) : company.ceoPlayer ? (
                        <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
                          <span>CEO:</span>
                          <PlayerAvatar player={company.ceoPlayer} size="sm" />
                          <span className="text-gray-300">
                            {company.ceoPlayer.nickname}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-gray-500 text-sm">
                          CEO: Unknown
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {playerCompanies.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                You don&apos;t own any companies yet.
              </div>
            )}
          </div>
        </ModernOperationsSection>

        {/* Show operating controls only if CEO */}
        {hasCompanySelected && !canOperateCompany && (
          <ModernOperationsSection title="Cannot Operate">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400">
                You are not the CEO of this company. Only the CEO can perform marketing and research actions.
                {currentCompany?.ceoPlayer && (
                  <span className="block mt-2 text-sm text-gray-300">
                    CEO: <strong>{currentCompany.ceoPlayer.nickname}</strong>
                  </span>
                )}
              </p>
            </div>
          </ModernOperationsSection>
        )}

        {/* Operating controls - only shown if CEO */}
        {hasCompanySelected && canOperateCompany && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Marketing Section */}
            <ModernOperationsSection title="Marketing Campaigns">
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Create marketing campaigns to boost your brand and influence
                consumer behavior.
              </p>

              <div className="grid grid-cols-1 gap-3">
                 {Object.values(MarketingCampaignTier).map(
                   (tier: MarketingCampaignTier) => {
                     const config = MARKETING_CONFIG[tier];
                     const canAfford =
                       hasCompanySelected &&
                       currentCompany &&
                       currentCompany.cashOnHand >= config.cost;
                     const isDisabled =
                       !hasCompanySelected ||
                       !canAfford ||
                       createMarketingCampaign.isPending;

                    return (
                      <div
                        key={tier}
                        className={`p-4 rounded-lg border transition-colors ${
                          !hasCompanySelected
                            ? "border-gray-700 opacity-50 bg-gray-700/20 cursor-not-allowed"
                            : selectedMarketingTier === tier
                            ? "border-purple-500 bg-purple-500/20 cursor-pointer"
                            : canAfford
                            ? "border-gray-600 hover:border-purple-400 bg-gray-700/30 cursor-pointer"
                            : "border-gray-700 opacity-50 bg-gray-700/20 cursor-not-allowed"
                        }`}
                        onClick={() =>
                          !isDisabled &&
                          canAfford &&
                          setSelectedMarketingTier(tier)
                        }
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-200">
                              Campaign {tier.split("_")[1]}
                            </h3>
                             <div className="text-sm text-gray-400 space-y-1 mt-1">
                               <div>Workers: {config.workers}</div>
                               <div>Brand Bonus: +{config.brandBonus}</div>
                               <div>Cost: ${config.cost}</div>
                               {currentCompany && (
                                 <div
                                   className={`mt-1 ${
                                     currentCompany.cashOnHand >= config.cost
                                       ? "text-gray-400"
                                       : "text-red-400"
                                   }`}
                                 >
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
                                handleOpenResourceSelection(tier);
                              }
                            }}
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </ModernOperationsSection>

          {/* Research Section */}
          <ModernOperationsSection title="Research & Development">
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Invest in research to advance your sector&apos;s technology track and
                gain advantages.
              </p>

              <div className="space-y-3">
                <div
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    hasCompanySelected
                      ? "bg-gray-700/30"
                      : "bg-gray-700/20 opacity-50"
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-200">
                      Research Cost
                    </div>
                    <div className="text-sm text-gray-400">
                      Stage {researchStage} (Progress: {sectorResearchMarker}/20)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-200">
                      ${researchCost}
                    </div>
                    {currentCompany ? (
                      <div
                        className={`text-sm ${
                          currentCompany.cashOnHand >= researchCost
                            ? "text-gray-400"
                            : "text-red-400"
                        }`}
                      >
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
                  <h4 className="font-medium text-gray-200 mb-2">
                    Research Outcomes
                  </h4>
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
                  disabled={
                    !canResearch || isResearching || !hasCompanySelected
                  }
                  onClick={handleResearch}
                >
                  {isResearching ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Researching...
                    </div>
                  ) : !hasCompanySelected ? (
                    "Select a Company First"
                  ) : (
                    "Conduct Research"
                  )}
                </Button>
              </div>
            </div>
          </ModernOperationsSection>
          </div>
        )}

        {/* Research Track Display - Show for all selected companies */}
        {hasCompanySelected && currentCompany && (
          <ModernOperationsSection title="Research Track">
            <ResearchTrack
              currentProgress={currentCompany.researchProgress || 0}
              currentStage={researchStage}
              spaces={Array.from({ length: 20 }, (_, i) => ({
                id: `space-${i + 1}`,
                number: i + 1,
                phase: Math.ceil((i + 1) / 5),
                isUnlocked: i < 20,
                hasReward: (i + 1) % 5 === 0,
                reward:
                  (i + 1) % 5 === 0
                    ? {
                        type: "GRANT" as const,
                        amount: Math.ceil((i + 1) / 5) * 100,
                      }
                    : undefined,
              }))}
            />
          </ModernOperationsSection>
        )}
      </div>

      {/* Error Modal */}
      <Modal isOpen={isErrorModalOpen} onOpenChange={onErrorModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Error</ModalHeader>
              <ModalBody>
                <p className="text-red-400">{errorMessage}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Resource Selection Modal */}
      <Modal
        isOpen={isResourceModalOpen}
        onOpenChange={onResourceModalOpenChange}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Select Resources for Campaign{" "}
                {selectedMarketingTier?.split("_")[1]}
              </ModalHeader>
              <ModalBody>
                {selectedMarketingTier && currentCompany && currentSector && (
                  <>
                    <div className="flex flex-row gap-4">
                      {/* Company Info */}
                      <div className="mb-4 pb-4 border-b border-gray-700 flex flex-col">
                        <CompanyInfoV2 companyId={currentCompany.id} />
                      </div>

                      {/* Consumption Bag Viewer */}
                      <div className="mb-4 pb-4 border-b border-gray-700">
                        <ConsumptionBagViewer
                          sectorId={currentSector.id}
                          sectorName={currentSector.name}
                          gameId={gameState.id}
                        />
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4">
                      Select {getRequiredResourceCount(selectedMarketingTier)}{" "}
                      resource(s) to add to the consumption bag.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {availableResources.map((resourceType) => {
                        const isSelected =
                          selectedResources.includes(resourceType);
                        const canSelect =
                          selectedResources.length <
                          getRequiredResourceCount(selectedMarketingTier);
                        return (
                          <button
                            key={resourceType}
                            onClick={() => handleResourceToggle(resourceType)}
                            disabled={!canSelect && !isSelected}
                            className={cn(
                              "p-3 rounded-lg border text-sm transition-colors",
                              isSelected
                                ? "bg-purple-600/20 border-purple-500 text-purple-300"
                                : canSelect
                                ? "border-gray-600 hover:border-purple-400 hover:bg-gray-700/50 text-gray-200"
                                : "border-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                            )}
                          >
                            {resourceType}
                          </button>
                        );
                      })}
                    </div>
                    {selectedResources.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                        <p className="text-sm text-gray-300 mb-2">
                          Selected Resources:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedResources.map((resourceType) => (
                            <span
                              key={resourceType}
                              className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded text-sm"
                            >
                              {resourceType}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    if (selectedMarketingTier) {
                      handleCreateMarketingCampaign(selectedMarketingTier, 1);
                    }
                  }}
                  disabled={
                    !selectedMarketingTier ||
                    selectedResources.length !==
                      getRequiredResourceCount(selectedMarketingTier) ||
                    createMarketingCampaign.isPending
                  }
                >
                  {createMarketingCampaign.isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    "Create Campaign"
                  )}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </ModernOperationsLayout>
  );
}
