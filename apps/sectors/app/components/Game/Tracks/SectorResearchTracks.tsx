'use client';

import { trpc } from '@sectors/app/trpc';
import { useGame } from '../GameContext';
import { ModernOperationsSection } from '../ModernOperations/layouts';
import { ResearchTrack } from '../../Company/Research/ResearchTrack';
import { sectorColors } from '@server/data/gameData';
import { Sector, Company } from '@server/prisma/prisma.client';
import { Spinner, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import { RiInformationLine } from '@remixicon/react';

/**
 * Sector Research Tracks Component
 * 
 * Displays research progress tracks for each sector showing:
 * - Sector-level research progress (20 spaces, 4 stages)
 * - Individual company progress within each sector
 * - Rewards at milestones (spaces 5, 10, 15, 20)
 * - Research stage demand bonuses (Stage 1: +0, Stage 2: +2, Stage 3: +3, Stage 4: +5)
 * 
 * Each sector has one shared research track. Companies in that sector
 * advance research by allocating workers to research actions. Sector progress
 * advances as companies complete research milestones.
 * 
 * Research stages provide demand bonuses to the sector's baseline demand:
 * - Stage 1 (0-3): +0 demand
 * - Stage 2 (4-6): +2 demand
 * - Stage 3 (7-9): +3 demand
 * - Stage 4 (10-12): +5 demand
 */
export function SectorResearchTracks() {
  const { gameId } = useGame();

  const { data: sectors, isLoading: sectorsLoading } = trpc.sector.listSectors.useQuery(
    {
      where: { gameId },
      orderBy: { name: 'asc' },
    },
    { enabled: !!gameId }
  );

  const { data: companies, isLoading: companiesLoading } = trpc.company.listCompanies.useQuery(
    {
      where: { gameId },
      orderBy: { name: 'asc' },
    },
    { enabled: !!gameId }
  );

  const isLoading = sectorsLoading || companiesLoading;

  if (isLoading) {
    return (
      <ModernOperationsSection title="Sector Research Tracks">
        <div className="flex items-center justify-center h-32">
          <Spinner size="sm" />
        </div>
      </ModernOperationsSection>
    );
  }

  if (!sectors || !companies) {
    return null;
  }

  // Group companies by sector
  const companiesBySector = companies.reduce(
    (acc: Record<string, Company[]>, company: Company) => {
      if (company.sectorId) {
        if (!acc[company.sectorId]) {
          acc[company.sectorId] = [];
        }
        acc[company.sectorId].push(company);
      }
      return acc;
    },
    {}
  );

  // Filter sectors to only show those with companies in the game
  const activeSectors = sectors.filter(
    (sector: Sector) => companiesBySector[sector.id] && companiesBySector[sector.id].length > 0
  );

  if (activeSectors.length === 0) {
    return (
      <ModernOperationsSection title="Sector Research Tracks">
        <p className="text-gray-400 text-center py-4">
          No sectors with companies found
        </p>
      </ModernOperationsSection>
    );
  }

  // Create a 12-space track with rewards at specific milestones (every 3 steps)
  const createResearchSpaces = (sectorProgress: number) => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: `sector-space-${i + 1}`,
      number: i + 1,
      phase: Math.ceil((i + 1) / 3),
      isUnlocked: i < sectorProgress,
      hasReward: [3, 6, 9, 12].includes(i + 1),
      reward: [3, 6, 9, 12].includes(i + 1)
        ? {
            type: i + 1 === 12 ? ('MARKET_FAVOR' as const) : ('GRANT' as const),
            amount: i + 1 === 12 ? 2 : 1,
          }
        : undefined,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Research Info Header */}
      <div className="mb-4 pb-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-200">Sector Research Tracks</h3>
          <Popover placement="right" showArrow>
            <PopoverTrigger>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-300 transition-colors"
                aria-label="Research information"
              >
                <RiInformationLine size={18} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-gray-900 border border-gray-700 max-w-md">
              <div className="p-4 space-y-3">
                <div className="text-sm font-semibold text-white mb-2">Research Actions Explained</div>
                <div className="text-xs space-y-2 text-gray-300">
                  <p>
                    <strong className="text-white">Primary Function: Unlock Factory Production Tiers</strong>
                  </p>
                  <p>
                    The main purpose of research is to unlock higher tiers for factory production. As your sector advances through research stages, companies gain access to larger, more efficient factories that can serve more customers and generate greater profits.
                  </p>
                  <p>
                    <strong className="text-white">Factory Tier Unlocking:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Stage 1 (0-3):</strong> Only Factory I available</li>
                    <li><strong>Stage 2 (4-6):</strong> Factory I and Factory II unlocked</li>
                    <li><strong>Stage 3 (7-9):</strong> Factory II and Factory III unlocked</li>
                    <li><strong>Stage 4 (10-12+):</strong> Factory III and Factory IV unlocked</li>
                  </ul>
                  <p>
                    <strong className="text-white">How Research Works:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Each sector has a shared research track with 12 spaces (4 stages of 3 spaces each)</li>
                    <li>Companies in a sector contribute to that sector&apos;s overall research progress</li>
                    <li>Research progress advances when companies complete research milestones</li>
                    <li>Each research action costs cash and requires available workers</li>
                  </ul>
                  <p>
                    <strong className="text-white">Additional Benefits:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Demand Bonuses:</strong> As sectors reach research stages, they gain demand bonuses:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                        <li>Stage 1 (0-3): +0 demand</li>
                        <li>Stage 2 (4-6): +2 demand</li>
                        <li>Stage 3 (7-9): +3 demand</li>
                        <li>Stage 4 (10-12): +5 demand</li>
                      </ul>
                    </li>
                  </ul>
                  <p className="pt-2 mt-2 border-t border-gray-700 text-gray-400 italic">
                    Note: Research progress is shared across all companies in a sector, so multiple companies can contribute to advancing the same research track.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {activeSectors.map((sector: Sector) => {
        const sectorCompanies = companiesBySector[sector.id] || [];
        const sectorColor = sectorColors[sector.name] || '#ffffff';
        
        // Calculate sector progress: use researchMarker if available, otherwise sum company progress
        // This ensures the track shows progress even if researchMarker hasn't been updated yet
        const sectorMarker = sector.researchMarker || 0;
        const totalCompanyProgress = sectorCompanies.reduce(
          (sum, company) => sum + (company.researchProgress || 0),
          0
        );
        // Use the higher of the two to ensure we show progress (researchMarker should be updated, but fallback to sum)
        const sectorProgress = Math.max(sectorMarker, totalCompanyProgress);
        
        // Calculate research stage for demand bonus display (every 3 steps: Stage 1=0-3, Stage 2=4-6, Stage 3=7-9, Stage 4=10-12)
        const researchStage = Math.min(Math.floor(sectorProgress / 3) + 1, 4);

        return (
          <div
            key={sector.id}
            className="p-4 rounded-lg shadow-lg border"
            style={{
              backgroundColor: `${sectorColor}15`,
              borderColor: `${sectorColor}50`,
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold" style={{ color: sectorColor }}>
                {sector.name}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Sector Progress:</span>
                  <span className="px-2 py-1 bg-gray-700/50 rounded font-semibold text-gray-200">
                    {sectorProgress}/12
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Demand Bonus:</span>
                  <span className="px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-xs font-semibold text-green-300">
                    {researchStage === 1 ? '+0' : researchStage === 2 ? '+2' : researchStage === 3 ? '+3' : '+5'}
                  </span>
                </div>
              </div>
            </div>

            {/* Research Track */}
            <div className="mb-3">
              <ResearchTrack
                spaces={createResearchSpaces(sectorProgress)}
                currentProgress={sectorProgress}
                currentStage={Math.ceil(sectorProgress / 5) || 1}
              />
            </div>

            {/* Company Progress Markers */}
            {sectorCompanies.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-700/50">
                <div className="text-xs text-gray-400 mb-2">Company Progress:</div>
                <div className="space-y-1">
                  {sectorCompanies.map((company: Company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: sectorColor,
                          }}
                        />
                        <span className="text-gray-300">{company.name}</span>
                      </div>
                      <span className="text-gray-400">
                        {company.researchProgress || 0}/12
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

