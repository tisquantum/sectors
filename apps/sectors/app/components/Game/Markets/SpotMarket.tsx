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
export function SpotMarket({
  handleOrder,
  forwardedRef,
}: SpotMarketProps = {}) {
  const { gameId } = useGame();

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
        {Object.keys(companiesBySector).map((sectorId) => (
          <ModernOperationsSection
            key={sectorId}
            title={companiesBySector[sectorId].sector.name}
          >
            <div className="flex flex-wrap gap-4">
              {companiesBySector[sectorId].companies.map(
                (company: any) => (
                  <Card key={company.id} className="min-w-[300px]">
                    <CardBody>
                      <CompanyInfoV2 companyId={company.id} showBarChart />
                    </CardBody>
                  </Card>
                )
              )}
            </div>
          </ModernOperationsSection>
        ))}
      </div>
    </ModernOperationsLayout>
  );
}

