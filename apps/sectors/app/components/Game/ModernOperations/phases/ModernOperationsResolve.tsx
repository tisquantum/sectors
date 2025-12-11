"use client";

import { useState, useMemo, useEffect } from "react";
import { useGame } from "../../GameContext";
import { trpc } from "@sectors/app/trpc";
import { Spinner, Chip, Popover, PopoverContent, PopoverTrigger, Switch, Tab, Tabs } from "@nextui-org/react";
import { RiVipCrown2Fill, RiInformationLine, RiMegaphoneFill, RiTestTubeFill } from "@remixicon/react";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../../../Player/PlayerAvatar";
import CompanyInfoV2 from "../../../Company/CompanyV2/CompanyInfoV2";
import { ModernOperationsLayout, ModernOperationsSection } from "../layouts";
import { SectorResearchTracks } from "../../Tracks";
import { ResourceTracksContainer } from "../../ResourceTracksContainer";

/**
 * ModernOperationsResolve Phase Component
 *
 * Shows all companies the player owns with CompanyInfoV2 components.
 * Displays resolved marketing campaigns and research advances for the selected company.
 * Similar structure to ModernOperations but shows resolved results instead of operations.
 */
export default function ModernOperationsResolve() {
  const { gameId, authPlayer, currentPhase, currentTurn } = useGame();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  const currentPhaseNumber = Math.ceil(
    Number(currentPhase?.name?.match(/\d+/)?.[0] || "1")
  );

  // Get all players with shares in the game
  const { data: playersWithShares, isLoading: playersLoading } =
    trpc.player.playersWithShares.useQuery({
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
    const authPlayerWithShares = playersWithShares.find(
      (p) => p.id === authPlayer.id
    );
    if (!authPlayerWithShares) return [];

    // Get company IDs where player has shares (excluding shorted shares)
    const companyIdsWithShares = new Set(
      authPlayerWithShares.Share.filter(
        (share) => share.location === "PLAYER" && !share.shortOrderId
      ).map((share) => share.companyId)
    );

    // Return companies with their CEO info
    return allCompanies
      .filter((company) => companyIdsWithShares.has(company.id))
      .map((company) => {
        const isCEO = company.ceoId === authPlayer.id;
        const ceoPlayer = playersWithShares.find((p) => p.id === company.ceoId);
        return {
          ...company,
          isCEO,
          ceoPlayer: ceoPlayer || null,
        };
      });
  }, [playersWithShares, allCompanies, authPlayer]);

  // All companies with CEO info
  const allCompaniesWithCEO = useMemo(() => {
    if (!playersWithShares || !allCompanies || !authPlayer) return [];
    return allCompanies.map((company) => {
      const isCEO = company.ceoId === authPlayer.id;
      const ceoPlayer = playersWithShares.find((p) => p.id === company.ceoId);
      return {
        ...company,
        isCEO,
        ceoPlayer: ceoPlayer || null,
      };
    });
  }, [playersWithShares, allCompanies, authPlayer]);

  // Companies to display based on filter
  const displayedCompanies = showAllCompanies ? allCompaniesWithCEO : playerCompanies;

  // Auto-select first company if none selected
  useEffect(() => {
    if (displayedCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(displayedCompanies[0].id);
    }
  }, [displayedCompanies, selectedCompanyId]);

  const selectedCompany = displayedCompanies.find(
    (c) => c.id === selectedCompanyId
  );

  // Fetch marketing campaigns for selected company
  const { data: marketingCampaigns, isLoading: isLoadingCampaigns } =
    trpc.marketing.getCompanyCampaigns.useQuery(
      {
        companyId: selectedCompanyId || "",
        gameId,
      },
      { enabled: !!selectedCompanyId && !!gameId }
    );

  // Fetch brand bonus for selected company
  const { data: brandBonus, isLoading: isLoadingBrandBonus } =
    trpc.marketing.getTotalBrandBonus.useQuery(
      {
        companyId: selectedCompanyId || "",
        gameId,
      },
      { enabled: !!selectedCompanyId && !!gameId }
    );

  // Fetch resolved research orders for selected company
  const { data: resolvedOrders, isLoading: isLoadingResearch } =
    trpc.modernOperations.getResolvedResearchOrders.useQuery(
      {
        companyId: selectedCompanyId || "",
        gameId,
        gameTurnId: currentTurn?.id,
      },
      {
        enabled: !!selectedCompanyId && !!gameId && !!currentTurn?.id,
      }
    );

  const isLoading =
    playersLoading ||
    companiesLoading ||
    isLoadingCampaigns ||
    isLoadingBrandBonus ||
    isLoadingResearch;

  if (isLoading) {
    return (
      <ModernOperationsLayout
        title="Operations Resolve"
        description={`Phase ${currentPhaseNumber} - View resolved marketing campaigns and research advances`}
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  if (!authPlayer) {
    return (
      <ModernOperationsLayout
        title="Operations Resolve"
        description={`Phase ${currentPhaseNumber} - View resolved marketing campaigns and research advances`}
      >
        <ModernOperationsSection>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-gray-400 text-lg mb-2">Not Logged In</p>
            <p className="text-gray-500 text-sm">
              Please log in to view resolved operations.
            </p>
          </div>
        </ModernOperationsSection>
      </ModernOperationsLayout>
    );
  }

  if (playerCompanies.length === 0) {
    return (
      <ModernOperationsLayout
        title="Operations Resolve"
        description={`Phase ${currentPhaseNumber} - View resolved marketing campaigns and research advances`}
      >
        <ModernOperationsSection>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">
                No Companies Owned
              </p>
              <p className="text-gray-500 text-sm">
                You must own shares in a company to view its resolved operations.
              </p>
            </div>
          </div>
        </ModernOperationsSection>
      </ModernOperationsLayout>
    );
  }

  return (
    <ModernOperationsLayout
      title="Operations Resolve"
      description={`Phase ${currentPhaseNumber} - View resolved marketing campaigns and research advances`}
    >
      <div className="space-y-6">
        {/* Company Selection Grid */}
        <ModernOperationsSection title={showAllCompanies ? "All Companies" : "Your Companies"}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Select a company to view its resolved marketing campaigns and research advances.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Your Companies</span>
                <Switch
                  isSelected={showAllCompanies}
                  onValueChange={setShowAllCompanies}
                  size="sm"
                />
                <span className="text-sm text-gray-400">All Companies</span>
              </div>
            </div>

            {displayedCompanies.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {showAllCompanies 
                  ? "No companies found."
                  : "You don&apos;t own any companies yet."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedCompanies.map((company) => {
                  const isSelected = selectedCompanyId === company.id;

                  return (
                    <div
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={cn(
                        "relative rounded-lg border transition-all cursor-pointer overflow-hidden",
                        isSelected
                          ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500"
                          : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                      )}
                    >
                      <div className="p-4">
                        <CompanyInfoV2 companyId={company.id} />
                      </div>

                      {/* CEO Indicator */}
                      {company.isCEO ? (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-green-400 text-xs font-semibold">
                          <RiVipCrown2Fill size={14} />
                          <span>You are CEO</span>
                        </div>
                      ) : company.ceoPlayer ? (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-gray-400 text-xs">
                          <span>CEO:</span>
                          <PlayerAvatar player={company.ceoPlayer} size="sm" />
                          <span className="text-gray-300">
                            {company.ceoPlayer.nickname}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 text-gray-500 text-xs">
                          CEO: Unknown
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModernOperationsSection>

        {/* Selected Company Results */}
        {selectedCompany && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Marketing Results */}
            <ModernOperationsSection
              title={
                <div className="flex items-center gap-2">
                  <RiMegaphoneFill size={18} className="text-purple-400" />
                  <span>Marketing Campaigns</span>
                  <Popover placement="bottom">
                    <PopoverTrigger>
                      <div className="flex items-center cursor-pointer">
                        <RiInformationLine size={16} className="text-gray-400" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-4">
                      <div>
                        <p className="font-semibold mb-2">
                          Marketing Campaign Rules:
                        </p>
                        <ul className="space-y-1 list-disc list-inside text-sm">
                          <li>
                            <strong>Costs:</strong> Marketing I ($100), II ($200),
                            III ($300), IV ($400) base cost
                          </li>
                          <li>
                            <strong>Brand Bonuses:</strong> +1 (I), +2 (II), +3
                            (III), +4 (IV) brand score per tier
                          </li>
                          <li>
                            <strong>Effect:</strong> Brand bonus reduces perceived
                            price
                          </li>
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Brand Score:</span>
                      <span className="text-gray-200 font-medium">
                        {selectedCompany.brandScore || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Active Campaigns:</span>
                      <span className="text-gray-200 font-medium">
                        {marketingCampaigns?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Brand Bonus:</span>
                      <span className="text-green-400 font-medium">
                        +{brandBonus || 0}
                      </span>
                    </div>
                    {marketingCampaigns && marketingCampaigns.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="text-xs text-gray-400 mb-2">
                          Campaign Details:
                        </div>
                        <div className="space-y-2">
                          {marketingCampaigns.map((campaign: any) => (
                            <div
                              key={campaign.id}
                              className="flex justify-between text-xs items-center p-2 bg-purple-500/10 rounded"
                            >
                              <div>
                                <div className="text-gray-300 font-medium">
                                  {campaign.tier.replace("TIER_", "")} (Slot{" "}
                                  {campaign.slot || "N/A"})
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {campaign.workers} workers
                                </div>
                              </div>
                              <span className="text-green-400 font-semibold">
                                +{campaign.brandBonus} bonus
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ModernOperationsSection>

            {/* Research Results */}
            <ModernOperationsSection
              title={
                <div className="flex items-center gap-2">
                  <RiTestTubeFill size={18} className="text-blue-400" />
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
                          <li>
                            <strong>Costs:</strong> Phase I ($100), II ($200), III
                            ($300), IV ($400) per action
                          </li>
                          <li>
                            <strong>Progress:</strong> Random result: +0, +1, or +2
                            spaces per research action
                          </li>
                          <li>
                            <strong>Company Milestones:</strong>
                          </li>
                          <li className="ml-4">• Progress 5: +$200 grant</li>
                          <li className="ml-4">• Progress 10: +1 market favor</li>
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Research Progress:</span>
                      <span className="text-gray-200 font-medium">
                        {selectedCompany.researchProgress || 0} spaces
                      </span>
                    </div>
                    {resolvedOrders && resolvedOrders.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="text-xs text-gray-400 mb-2">
                          Research Orders Resolved:
                        </div>
                        <div className="space-y-2">
                          {resolvedOrders.map((order) => (
                            <div
                              key={order.id}
                              className={cn(
                                "flex justify-between text-xs items-center p-2 rounded",
                                order.failureReason
                                  ? "bg-red-500/10"
                                  : "bg-blue-500/10"
                              )}
                            >
                              <div>
                                <div className="text-gray-300 font-medium">
                                  Research Order
                                </div>
                                {order.failureReason ? (
                                  <div className="text-red-400 text-xs mt-1">
                                    {order.failureReason}
                                  </div>
                                ) : (
                                  <div className="text-gray-500 text-xs">
                                    Cost: ${order.cost}
                                  </div>
                                )}
                              </div>
                              {!order.failureReason &&
                                order.researchProgressGain !== null && (
                                  <span className="text-green-400 font-semibold">
                                    +{order.researchProgressGain} progress
                                  </span>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ModernOperationsSection>
          </div>
        )}

        {/* Research & Resources Tabs */}
        <ModernOperationsSection title="Research & Resources">
          <Tabs aria-label="Research and Resources" className="w-full">
            <Tab key="research" title="Research">
              <div className="w-full h-full p-4">
                <SectorResearchTracks />
              </div>
            </Tab>
            <Tab key="resource-tracks" title="Resource Tracks">
              <div className="w-full h-full p-4">
                <ResourceTracksContainer />
              </div>
            </Tab>
          </Tabs>
        </ModernOperationsSection>
      </div>
    </ModernOperationsLayout>
  );
}
