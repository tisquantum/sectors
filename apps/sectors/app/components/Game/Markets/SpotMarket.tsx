'use client';

import React from 'react';
import { useGame } from '../GameContext';
import { trpc } from '@sectors/app/trpc';
import {
  CompanyStatus,
} from '@server/prisma/prisma.client';
import { organizeCompaniesBySector } from '@sectors/app/helpers';
import { ModernOperationsLayout, ModernOperationsSection } from '../ModernOperations/layouts';
import { Spinner, Card, CardBody } from '@nextui-org/react';
import CompanyInfoV2 from '../../Company/CompanyV2/CompanyInfoV2';

interface SpotMarketProps {
  handleOrder?: (company: any, isIpo?: boolean) => void;
  forwardedRef?: HTMLDivElement | null;
}

/**
 * Companies View - Shows companies broken down by sector
 * Simplified view without order placement functionality
 */
function sectorTotalDemand(
  sector:
    | { demand?: number | null; demandBonus?: number | null }
    | undefined
): number {
  if (!sector) return 0;
  return (sector.demand ?? 0) + (sector.demandBonus ?? 0);
}

export function SpotMarket({
  handleOrder,
  forwardedRef,
}: SpotMarketProps = {}) {
  const { gameId, gameState } = useGame();

  // Fetch companies - optimized with caching
  const { data: companies, isLoading: isLoadingCompanies } =
    trpc.company.listCompaniesWithRelations.useQuery(
      {
        where: { gameId, status: { not: CompanyStatus.BANKRUPT } },
      },
      {
        staleTime: 10000, // 10 seconds
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: !!gameId,
      }
    );

  if (isLoadingCompanies) {
    return (
      <ModernOperationsLayout
        title="Companies"
        description="View all companies organized by sector"
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <ModernOperationsLayout
        title="Companies"
        description="View all companies organized by sector"
      >
        <div className="text-center py-12 text-gray-400">
          No companies available
        </div>
      </ModernOperationsLayout>
    );
  }

  const companiesBySector = organizeCompaniesBySector(companies);

  return (
    <ModernOperationsLayout
      title="Companies"
      description="View all companies organized by sector"
    >
      <div className="space-y-6">
        {/* Companies by Sector */}
        {Object.keys(companiesBySector).map((sectorId) => {
          const bundle = companiesBySector[sectorId];
          const liveSector = gameState?.sectors?.find((s) => s.id === sectorId);
          const demand = sectorTotalDemand(liveSector ?? bundle.sector);
          const companyCount = bundle.companies.length;
          const th2 = liveSector?.demandThreshold2Reached === true;
          const th4 = liveSector?.demandThreshold4Reached === true;
          const th8 = liveSector?.demandThreshold8Reached === true;

          return (
          <ModernOperationsSection
            key={sectorId}
            title={
              <div className="space-y-2 w-full">
                <div>{bundle.sector.name}</div>
                <div className="text-sm font-normal text-gray-400 space-y-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
                    <span>
                      Sector demand:{" "}
                      <span className="text-gray-200 font-medium">{demand}</span>
                    </span>
                    <span>
                      Companies:{" "}
                      <span className="text-gray-200 font-medium">
                        {companyCount}
                      </span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    New company thresholds (demand 2 / 4 / 8):{" "}
                    <span className="text-gray-300">
                      {th2 ? "2 ✓" : "2 ○"} · {th4 ? "4 ✓" : "4 ○"} ·{" "}
                      {th8 ? "8 ✓" : "8 ○"}
                    </span>
                  </div>
                </div>
              </div>
            }
          >
            <div className="flex flex-wrap gap-4">
              {companiesBySector[sectorId].companies.map(
                (company: any) => (
                  <Card key={company.id} className="min-w-[300px]">
                    <CardBody>
                      <CompanyInfoV2 companyId={company.id} />
                    </CardBody>
                  </Card>
                )
              )}
            </div>
          </ModernOperationsSection>
          );
        })}
      </div>
    </ModernOperationsLayout>
  );
}

