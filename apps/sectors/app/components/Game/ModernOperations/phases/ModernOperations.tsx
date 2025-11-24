"use client";

import { useState, useMemo, useEffect } from "react";
import { useGame } from "../../GameContext";
import { trpc } from "@sectors/app/trpc";
import { Spinner } from "@nextui-org/react";
import { RiVipCrown2Fill } from "@remixicon/react";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../../../Player/PlayerAvatar";
import CompanyInfoV2 from "../../../Company/CompanyV2/CompanyInfoV2";
import { ModernCompany } from "../../../Company/CompanyV2/ModernCompany";
import { ResearchTrack } from "../../../Company/Research/ResearchTrack";
import { ModernOperationsLayout, ModernOperationsSection } from "../layouts";
import { SectorResearchTracks } from "../../Tracks";

/**
 * ModernOperations Phase Component
 *
 * Shows all companies the player owns with CompanyInfoV2 components.
 * Displays factory/marketing/research slots for each company.
 * Only allows operation if the player is CEO.
 */
export default function ModernOperations() {
  const { gameId, authPlayer, currentPhase } = useGame();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
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

  // Get current phase number for research track
  const currentPhaseNumber = currentPhase?.name?.match(/\d+/)?.[0]
    ? Math.ceil(Number(currentPhase.name.match(/\d+/)?.[0]))
    : 1;

  // Auto-select first company if none selected
  useEffect(() => {
    if (playerCompanies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(playerCompanies[0].id);
    }
  }, [playerCompanies, selectedCompanyId]);

  const selectedCompany = playerCompanies.find(
    (c) => c.id === selectedCompanyId
  );

  if (playersLoading || companiesLoading) {
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

  return (
    <ModernOperationsLayout
      title="Modern Operations"
      description="Build factories, create marketing campaigns, and advance your research track"
    >
      <div className="space-y-6">
        {/* Company Selection Grid */}
        <ModernOperationsSection title="Your Companies">
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Select a company you own to view or operate. You can only operate
              companies where you are the CEO.
            </p>

            {playerCompanies.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                You don&apos;t own any companies yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerCompanies.map((company) => {
                  const isSelected = selectedCompanyId === company.id;
                  const isCEO = company.isCEO;

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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModernOperationsSection>

        {/* Selected Company Operations */}
        {selectedCompany && (
          <ModernOperationsSection title="Company Operations">
            {selectedCompany.isCEO ? (
              <ModernCompany
                companyId={selectedCompany.id}
                gameId={gameId}
                isCEO={true}
              />
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400">
                  You are not the CEO of this company. Only the CEO can perform operations actions.
                  {selectedCompany.ceoPlayer && (
                    <span className="block mt-2 text-sm text-gray-300">
                      CEO: <strong>{selectedCompany.ceoPlayer.nickname}</strong>
                    </span>
                  )}
                </p>
                {/* Show read-only view */}
                <div className="mt-4">
                  <ModernCompany
                    companyId={selectedCompany.id}
                    gameId={gameId}
                    isCEO={false}
                  />
                </div>
              </div>
            )}
          </ModernOperationsSection>
        )}

        {/* Research Track */}
        <SectorResearchTracks />
      </div>
    </ModernOperationsLayout>
  );
}
