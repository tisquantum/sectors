'use client';

import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { FACTORY_CUSTOMER_LIMITS, BASE_WORKER_SALARY } from '@server/data/constants';
import { ModernOperationsLayout, ModernOperationsSection } from '../layouts';
import { Spinner } from '@nextui-org/react';
import { ResourceIcon } from '../../ConsumptionPhase/ResourceIcon';
import { useMemo } from 'react';
import { LineChart } from '@tremor/react';
import { sectorColors } from '@server/data/gameData';
import { StockAction } from '@server/prisma/prisma.client';

export function EarningsCallPhase() {
  const { gameState, gameId, currentTurn, currentPhase } = useGame();

  // Fetch real production data for the current turn
  const { data: productionData, isLoading } = trpc.factoryProduction.getGameTurnProduction.useQuery({
    gameId,
    gameTurnId: currentTurn?.id || '',
  }, { enabled: !!gameId && !!currentTurn?.id });

  // Fetch resource prices for detailed breakdown
  const { data: resourcePrices } = trpc.resource.getAllResourcePrices.useQuery(
    { gameId: gameId || '' },
    { enabled: !!gameId }
  );

  // Fetch companies with stock history to show stock performance
  const { data: companiesWithStockHistory } = trpc.company.listCompaniesWithSectorAndStockHistory.useQuery(
    { where: { gameId } },
    { enabled: !!gameId }
  );

  // Create a map of resource type to price for quick lookup
  const resourcePriceMap = useMemo(() => {
    if (!resourcePrices) return new Map<string, number>();
    return new Map(resourcePrices.map(r => [r.type, r.price]));
  }, [resourcePrices]);

  if (isLoading) {
    return (
      <ModernOperationsLayout
        title="Earnings Call"
        description="Loading earnings data..."
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  if (!productionData || productionData.length === 0) {
    return (
      <ModernOperationsLayout
        title="Earnings Call"
        description="Net profit breakdown from consumption phase after operating expenses"
      >
        <ModernOperationsSection>
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">No production data available for this turn</p>
            <p className="text-gray-500 text-sm">
              Production data will appear here after the consumption phase resolves.
            </p>
          </div>
        </ModernOperationsSection>
      </ModernOperationsLayout>
    );
  }

  // Group production records by company
  const companiesMap = productionData.reduce((acc, record) => {
    const companyId = record.companyId;
    if (!acc[companyId]) {
      acc[companyId] = {
        company: record.Company,
        productions: [],
      };
    }
    acc[companyId].productions.push(record);
    return acc;
  }, {} as Record<string, { company: any; productions: any[] }>);

  // Calculate stock price steps based on profit (same logic as backend)
  const calculateStockPriceSteps = (profit: number): number => {
    if (profit > 500) return 3;
    if (profit > 200) return 2;
    if (profit > 0) return 1;
    if (profit < -200) return -2;
    if (profit < 0) return -1;
    return 0;
  };

  const companies = Object.values(companiesMap).map(({ company, productions }) => {
    const totalProfit = productions.reduce((sum, p) => sum + p.profit, 0);
    const stockPriceSteps = calculateStockPriceSteps(totalProfit);
    
    // Find stock history entry for this phase with PRODUCTION action
    const stockHistoryEntry = companiesWithStockHistory
      ?.find(c => c.id === company.id)
      ?.StockHistory?.find(
        sh => sh.phaseId === currentPhase?.id && sh.action === StockAction.PRODUCTION
      );

    return {
      id: company.id,
      name: company.name,
      sector: company.Sector?.sectorName || company.Sector?.name || 'Unknown',
      brandScore: company.brandScore || 0,
      productions,
      totalRevenue: productions.reduce((sum, p) => sum + p.revenue, 0),
      totalCosts: productions.reduce((sum, p) => sum + p.costs, 0),
      totalProfit,
      totalCustomers: productions.reduce((sum, p) => sum + p.customersServed, 0),
      stockPriceSteps,
      stockHistoryEntry,
      currentStockPrice: company.currentStockPrice || 0,
      stockHistory: companiesWithStockHistory?.find(c => c.id === company.id)?.StockHistory || [],
    };
  });

  // Calculate summary statistics
  const totalRevenue = companies.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalCosts = companies.reduce((sum, c) => sum + c.totalCosts, 0);
  const totalProfit = companies.reduce((sum, c) => sum + c.totalProfit, 0);
  const totalConsumers = companies.reduce((sum, c) => sum + c.totalCustomers, 0);

  // Sort companies by net profit
  const sortedCompanies = [...companies].sort((a, b) => b.totalProfit - a.totalProfit);

  const sidebar = (
    <ModernOperationsSection title="About Earnings">
      <div className="space-y-3 text-sm text-gray-400">
        <div>
          <p className="font-medium text-gray-300 mb-1">Revenue</p>
          <p className="text-xs">Customers served × unit price from consumption phase</p>
        </div>
        <div>
          <p className="font-medium text-gray-300 mb-1">Costs</p>
          <p className="text-xs">Worker salaries based on workforce track position</p>
        </div>
        <div>
          <p className="font-medium text-gray-300 mb-1">Profit</p>
          <p className="text-xs">Revenue - Costs (affects stock price adjustment)</p>
        </div>
      </div>
    </ModernOperationsSection>
  );

  return (
    <ModernOperationsLayout
      title="Earnings Call"
      description="Net profit breakdown from consumption phase after operating expenses"
      sidebar={sidebar}
    >
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${totalProfit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Net Profit</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">${totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">${totalCosts.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Operating Costs</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{totalConsumers}</div>
              <div className="text-sm text-gray-400">Total Customers Served</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Earnings Breakdown */}
      <div className="space-y-6">
        {sortedCompanies.map((company) => (
          <Card key={company.id} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-xl">{company.name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span>Sector: {company.sector.replace('_', ' ')}</span>
                    <span>Brand Score: {company.brandScore}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Net Profit</div>
                  <div className={`text-2xl font-bold ${company.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${company.totalProfit.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Revenue: ${company.totalRevenue.toLocaleString()} | 
                    Costs: ${company.totalCosts.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Factory Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300">Factory Performance</h4>
                  {company.productions.map((production) => {
                    const factory = production.Factory;
                    const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size as keyof typeof FACTORY_CUSTOMER_LIMITS] || 0;
                    
                    return (
                      <div key={production.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-300">
                              {factory.size.replace('_', ' ')} (Slot {factory.slot})
                            </span>
                            <span className="text-xs text-gray-400">
                              {factory.workers} worker{factory.workers !== 1 ? 's' : ''}
                            </span>
                            {!factory.isOperational && (
                              <span className="px-2 py-1 bg-yellow-900 text-yellow-200 rounded text-xs">
                                Under Construction
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${production.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${production.profit.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Net Profit
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="bg-gray-600 rounded p-2">
                            <div className="text-gray-400">Revenue</div>
                            <div className="text-blue-400 font-semibold">${production.revenue.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-600 rounded p-2">
                            <div className="text-gray-400">Costs</div>
                            <div className="text-red-400 font-semibold">${production.costs.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-600 rounded p-2">
                            <div className="text-gray-400">Customers</div>
                            <div className="text-purple-400 font-semibold">
                              {production.customersServed}/{maxCustomers}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Math Breakdown */}
                        <div className="mt-4 pt-4 border-t border-gray-600 bg-gray-800/50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-gray-300 mb-3">Calculation Breakdown:</div>
                          
                          {/* Revenue Calculation */}
                          <div className="space-y-2 text-xs">
                            <div className="text-gray-400 font-medium">Revenue Calculation:</div>
                            <div className="pl-2 space-y-1">
                              <div className="text-gray-500">Revenue per unit = Sum of resource prices:</div>
                              <div className="pl-2 flex flex-wrap items-center gap-1.5">
                                {factory.resourceTypes && factory.resourceTypes.length > 0 ? (
                                  (factory.resourceTypes as string[]).map((resourceType: string, idx: number) => {
                                    const price = resourcePriceMap.get(resourceType) || 0;
                                    return (
                                      <span key={idx} className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-700 rounded">
                                        <ResourceIcon resourceType={resourceType} size="w-3 h-3" />
                                        <span className="text-gray-300">${price}</span>
                                        {idx < factory.resourceTypes.length - 1 && (
                                          <span className="text-gray-500 ml-1">+</span>
                                        )}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-gray-500">No resources</span>
                                )}
                                {factory.resourceTypes && factory.resourceTypes.length > 0 && (
                                  <span className="text-gray-400">
                                    = ${(factory.resourceTypes as string[]).reduce((sum: number, rt: string) => sum + (resourcePriceMap.get(rt) || 0), 0)}/unit
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-400 pt-1">
                                Total Revenue = {production.customersServed} customers × ${(factory.resourceTypes as string[])?.reduce((sum: number, rt: string) => sum + (resourcePriceMap.get(rt) || 0), 0) || 0}/unit = <span className="text-blue-400 font-semibold">${production.revenue}</span>
                              </div>
                            </div>

                            {/* Costs Calculation */}
                            <div className="pt-2 border-t border-gray-700">
                              <div className="text-gray-400 font-medium">Costs Calculation:</div>
                              <div className="pl-2 text-gray-400 pt-1">
                                {(() => {
                                  const actualSalaryPerWorker = factory.workers > 0 ? (production.costs / factory.workers) : 0;
                                  return (
                                    <>
                                      Worker Costs = {factory.workers} workers × ${actualSalaryPerWorker.toFixed(0)}/worker = <span className="text-red-400 font-semibold">${production.costs}</span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Profit Calculation */}
                            <div className="pt-2 border-t border-gray-700">
                              <div className="text-gray-400 font-medium">Profit Calculation:</div>
                              <div className="pl-2 text-gray-300 pt-1">
                                Profit = Revenue - Costs
                              </div>
                              <div className="pl-2 text-gray-300 pt-1">
                                Profit = <span className="text-blue-400">${production.revenue}</span> - <span className="text-red-400">${production.costs}</span> = <span className={`font-bold ${production.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${production.profit}</span>
                              </div>
                              {production.profit < 0 && (
                                <div className="pl-2 text-yellow-400 italic mt-1 text-xs">
                                  ⚠️ Negative profit: Costs exceed revenue. Consider increasing customers served or reducing workers.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Company Summary */}
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-400">Total Revenue</div>
                      <div className="text-lg font-bold text-blue-400">${company.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Total Costs</div>
                      <div className="text-lg font-bold text-red-400">${company.totalCosts.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Profit Margin</div>
                      <div className="text-lg font-bold text-green-400">
                        {company.totalRevenue > 0 
                          ? ((company.totalProfit / company.totalRevenue) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Performance */}
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-sm font-semibold text-gray-300 mb-4">Stock Performance</h4>
                  
                  {/* Stock Movement Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-xs text-gray-400 mb-1">Current Stock Price</div>
                      <div className="text-xl font-bold text-white">${company.currentStockPrice.toLocaleString()}</div>
                    </div>
                    {company.stockHistoryEntry && (
                      <div className="bg-gray-600 rounded p-3">
                        <div className="text-xs text-gray-400 mb-1">Stock Movement</div>
                        <div className={`text-xl font-bold ${company.stockPriceSteps > 0 ? 'text-green-400' : company.stockPriceSteps < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {company.stockPriceSteps > 0 ? '+' : ''}{company.stockPriceSteps} {company.stockPriceSteps === 1 ? 'space' : 'spaces'}
                        </div>
                      </div>
                    )}
                    {company.stockPriceSteps !== 0 && !company.stockHistoryEntry && (
                      <div className="bg-gray-600 rounded p-3">
                        <div className="text-xs text-gray-400 mb-1">Expected Movement</div>
                        <div className={`text-xl font-bold ${company.stockPriceSteps > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {company.stockPriceSteps > 0 ? '+' : ''}{company.stockPriceSteps} {company.stockPriceSteps === 1 ? 'space' : 'spaces'}
                        </div>
                      </div>
                    )}
                    {company.stockPriceSteps === 0 && (
                      <div className="bg-gray-600 rounded p-3">
                        <div className="text-xs text-gray-400 mb-1">Stock Movement</div>
                        <div className="text-sm text-gray-500 italic">No movement</div>
                      </div>
                    )}
                  </div>

                  {/* Stock Chart */}
                  {company.stockHistory && company.stockHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-xs font-medium text-gray-300 mb-3">Stock Price History</div>
                      <div className="h-64 w-full bg-gray-800/50 rounded-lg p-3">
                        <LineChart
                          data={company.stockHistory
                            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                            .filter(sh => sh.price !== 0)
                            .map((sh, index) => ({
                              phaseId: `${index + 1} ${sh.Phase.name}`,
                              stockPrice: sh.price,
                            }))}
                          index="phaseId"
                          categories={['stockPrice']}
                          yAxisLabel="Stock Price"
                          xAxisLabel="Phase"
                          colors={[sectorColors[company.sector] || '#3b82f6']}
                          valueFormatter={(number) => `$${number.toLocaleString()}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ModernOperationsLayout>
  );
}

