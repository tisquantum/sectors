'use client';

import React, { useEffect, useState } from 'react';
import { useGame } from '../GameContext';
import { trpc } from '@sectors/app/trpc';
import {
  CompanyStatus,
  OperationMechanicsVersion,
  OrderType,
  PhaseName,
  ShareLocation,
  Share,
} from '@server/prisma/prisma.client';
import { organizeCompaniesBySector } from '@sectors/app/helpers';
import { isCurrentPhaseInteractive } from '@sectors/app/helpers';
import { sectorColors } from '@server/data/gameData';
import { StockHistoryWithPhase } from '@server/prisma/prisma.types';
import CompanyCard from '../../Company/StockOrderCompanyCard';
import { Drawer } from 'vaul';
import { Button } from '@nextui-org/react';
import PlayerOrderInput from '../../Player/PlayerOrderInput';
import { LineChart } from '@tremor/react';
import { Tabs, Tab } from '@nextui-org/react';
import OrderResults from '../OrderResults';
import { ModernOperationsLayout, ModernOperationsSection } from '../ModernOperations/layouts';
import { Spinner } from '@nextui-org/react';
import CompanyInfo from '../../Company/CompanyInfo';

interface SpotMarketProps {
  handleOrder?: (company: any, isIpo?: boolean) => void;
  forwardedRef?: HTMLDivElement | null;
}

/**
 * Spot Market - Stock Trading Interface
 * Cleaned up version focused on stock orders only
 */
export function SpotMarket({
  handleOrder,
  forwardedRef,
}: SpotMarketProps = {}) {
  const { gameId, currentPhase, gameState, authPlayer } = useGame();
  const [showOrderInput, setShowOrderInput] = useState(false);
  const [focusedOrder, setFocusedOrder] = useState<any>(null);
  const [selectedCompanyOrder, setSelectedCompanyOrder] = useState<
    { company: any; isIpo: boolean } | undefined
  >(undefined);

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

  // Fetch player orders - only when needed
  const {
    data: playerOrdersConcealed,
    isLoading: isLoadingOrders,
    refetch: refetchPlayerOrdersConcealed,
  } = trpc.playerOrder.listPlayerOrdersConcealed.useQuery(
    {
      where: { stockRoundId: currentPhase?.stockRoundId },
    },
    {
      enabled: currentPhase?.name === PhaseName.STOCK_ACTION_REVEAL && !!currentPhase?.stockRoundId,
      staleTime: 5000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const {
    data: playerOrdersRevealed,
    isLoading: isLoadingPlayerOrdersRevealed,
  } = trpc.playerOrder.listPlayerOrdersWithPlayerRevealed.useQuery(
    {
      where: {
        stockRoundId: currentPhase?.stockRoundId,
      },
      gameId,
    },
    {
      enabled: !!currentPhase?.stockRoundId && !!gameId,
      staleTime: 5000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Fetch phases for stock round - only when needed
  const {
    data: phasesOfStockRound,
    refetch: refetchPhasesOfStockRound,
  } = trpc.phase.listPhases.useQuery(
    {
      where: {
        stockRoundId: currentPhase?.stockRoundId,
        name: PhaseName.STOCK_ACTION_ORDER,
      },
      orderBy: { createdAt: 'asc' },
    },
    {
      enabled: !!currentPhase?.stockRoundId,
      staleTime: 10000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const isInteractive = isCurrentPhaseInteractive(currentPhase?.name);
  const isRevealRound = currentPhase?.name === PhaseName.STOCK_ACTION_REVEAL;

  // Refetch on phase change - debounced to prevent excessive calls
  useEffect(() => {
    if (!currentPhase?.id) return;
    
    const timeoutId = setTimeout(() => {
      if (currentPhase?.name === PhaseName.STOCK_ACTION_REVEAL) {
        refetchPlayerOrdersConcealed();
      }
      refetchPhasesOfStockRound();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentPhase?.id, currentPhase?.name, refetchPhasesOfStockRound, refetchPlayerOrdersConcealed]);

  if (isLoadingCompanies || isLoadingOrders) {
    return (
      <ModernOperationsLayout
        title="Spot Market"
        description="Stock trading interface"
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
        title="Spot Market"
        description="Stock trading interface"
      >
        <div className="text-center py-12 text-gray-400">
          No companies available for trading
        </div>
      </ModernOperationsLayout>
    );
  }

  const orders = playerOrdersConcealed ?? [];
  const companiesBySector = organizeCompaniesBySector(companies);

  const handleDisplayOrderInput = (company: any, isIpo?: boolean) => {
    if (handleOrder) {
      handleOrder(company, isIpo);
    }
    setFocusedOrder(company);
    setSelectedCompanyOrder({ company, isIpo: isIpo ?? false });
  };

  const companyCardButtonClicked = () => {
    setShowOrderInput(false);
  };

  const handleCompanySelect = (company: any, isIpo: boolean) => {
    setSelectedCompanyOrder({ company, isIpo });
  };

  const valueFormatter = (number: number) => {
    return '$ ' + new Intl.NumberFormat('us').format(number).toString();
  };

  return (
    <>
      <ModernOperationsLayout
        title="Spot Market"
        description="Place orders for company shares in IPO or Open Market"
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
                    <div
                      key={company.id}
                      className="flex"
                      style={{
                        backgroundColor: sectorColors[company.Sector.name],
                      }}
                    >
                      <CompanyCard
                        company={company}
                        orders={orders.filter(
                          (order) => order.companyId === company.id
                        )}
                        isRevealRound={isRevealRound}
                        isInteractive={isInteractive}
                        focusedOrder={focusedOrder}
                        currentPhase={currentPhase}
                        playerOrdersRevealed={
                          playerOrdersRevealed?.filter(
                            (order) => order.companyId === company.id
                          ) || []
                        }
                        phasesOfStockRound={phasesOfStockRound || []}
                        isOrderInputOpen={showOrderInput}
                        handleButtonSelect={companyCardButtonClicked}
                        handleCompanySelect={handleCompanySelect}
                      />
                    </div>
                  )
                )}
              </div>
            </ModernOperationsSection>
          ))}
        </div>
      </ModernOperationsLayout>

      {/* Order Drawer */}
      <Drawer.Portal container={forwardedRef}>
        <Drawer.Overlay className="z-40 fixed inset-0 bg-black/40" />
        <Drawer.Content className="z-50 bg-slate-900 flex flex-col rounded-t-[10px] h-full w-[400px] fixed bottom-0 right-0">
          {selectedCompanyOrder && (
            <div className="h-full relative bg-slate-900 p-4 overflow-y-scroll scrollbar">
              <div className="flex flex-col justify-center items-center">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {selectedCompanyOrder.isIpo
                    ? `IPO Order ${selectedCompanyOrder.company.Share.filter(
                        (share: Share) => share.location === ShareLocation.IPO
                      ).length}`
                    : `Open Market Order ${selectedCompanyOrder.company.Share.filter(
                        (share: Share) => share.location === ShareLocation.OPEN_MARKET
                      ).length}`}
                </h2>

                {currentPhase?.name === PhaseName.STOCK_ACTION_ORDER && (
                  <PlayerOrderInput
                    currentOrder={selectedCompanyOrder.company}
                    handleCancel={() => {}}
                    isIpo={selectedCompanyOrder.isIpo}
                    handlePlayerInputConfirmed={companyCardButtonClicked}
                  />
                )}

                {gameState?.playerOrdersConcealed && currentPhase && (
                  <div>
                    <OrderResults
                      playerOrdersConcealed={orders.filter(
                        (order) =>
                          order.companyId === selectedCompanyOrder.company.id
                      )}
                      playerOrdersRevealed={
                        playerOrdersRevealed?.filter(
                          (order) =>
                            order.companyId === selectedCompanyOrder.company.id
                        ) || []
                      }
                      currentPhase={currentPhase}
                      phasesOfStockRound={phasesOfStockRound || []}
                      isRevealRound={isRevealRound}
                    />
                  </div>
                )}

                <Tabs className="mt-4">
                  <Tab key="company-info" title="Company Info">
                    <div className="h-96">
                      <CompanyInfo
                        companyId={selectedCompanyOrder.company.id}
                        showBarChart
                      />
                    </div>
                  </Tab>
                  <Tab key="stock-chart" title="Stock Chart">
                    <div className="h-96 w-80">
                      <LineChart
                        className="w-full"
                        data={selectedCompanyOrder.company.StockHistory.filter(
                          (stockHistory: StockHistoryWithPhase) => stockHistory.price !== 0
                        ).map((stockHistory: StockHistoryWithPhase, index: number) => ({
                          phaseId: `${index + 1} ${stockHistory.Phase.name}`,
                          stockPrice: stockHistory.price,
                          stockAction: stockHistory.action,
                          steps: stockHistory.stepsMoved,
                        }))}
                        index="phaseId"
                        categories={['stockPrice']}
                        yAxisLabel="Stock Price"
                        xAxisLabel="Stock Price Updated"
                        colors={[
                          sectorColors[
                            selectedCompanyOrder.company.Sector.name
                          ],
                        ]}
                        valueFormatter={valueFormatter}
                      />
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </div>
          )}
          <Drawer.Close asChild>
            <Button>Close drawer</Button>
          </Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </>
  );
}

