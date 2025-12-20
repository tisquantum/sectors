'use client';

import { useGame } from './GameContext';
import { trpc } from '@sectors/app/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { FACTORY_CUSTOMER_LIMITS } from '@server/data/constants';
import { ResourceType } from '@server/prisma/prisma.client';

export function EarningsCall() {
  const { gameState, gameId, currentTurn } = useGame();

  // Fetch real production data for the current turn
  const { data: productionData, isLoading } = trpc.factoryProduction.getGameTurnProduction.useQuery({
    gameId,
    gameTurnId: currentTurn.id,
  }, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5000, // 5 seconds
  });

  if (isLoading) return <div className="text-gray-400">Loading earnings data...</div>;
  if (!productionData || productionData.length === 0) {
    return <div className="text-gray-400 p-4">No production data available for this turn.</div>;
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

  const companies = Object.values(companiesMap).map(({ company, productions }) => ({
    id: company.id,
    name: company.name,
    sector: company.Sector.sectorName,
    brandScore: company.brandScore,
    productions,
    totalRevenue: productions.reduce((sum, p) => sum + p.revenue, 0),
    totalCosts: productions.reduce((sum, p) => sum + p.costs, 0),
    totalProfit: productions.reduce((sum, p) => sum + p.profit, 0),
    totalCustomers: productions.reduce((sum, p) => sum + p.customersServed, 0),
  }));

  // Calculate summary statistics
  const totalRevenue = companies.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalCosts = companies.reduce((sum, c) => sum + c.totalCosts, 0);
  const totalProfit = companies.reduce((sum, c) => sum + c.totalProfit, 0);
  const totalConsumers = companies.reduce((sum, c) => sum + c.totalCustomers, 0);

  // Sort companies by net profit
  const sortedCompanies = [...companies].sort((a, b) => b.totalProfit - a.totalProfit);

  return (
    <div className="w-full h-full p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Earnings Call</h1>
        <p className="text-gray-400">
          Net profit breakdown from consumption phase after operating expenses
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size as keyof typeof FACTORY_CUSTOMER_LIMITS];
                    
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

                        {/* Resource Types */}
                        {factory.resourceTypes && factory.resourceTypes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <div className="text-xs text-gray-400 mb-1">Resources:</div>
                            <div className="flex gap-2">
                              {factory.resourceTypes.map((type: ResourceType, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                                  {type.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">About Earnings Call</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong>Revenue:</strong> Customers served × unit price (from factory performance in CONSUMPTION_PHASE)
            </p>
            <p>
              <strong>Costs:</strong> Worker salaries based on current workforce track position
            </p>
            <p>
              <strong>Profit:</strong> Revenue - Costs (affects stock price adjustment)
            </p>
            <p className="text-gray-400 text-xs mt-3">
              💡 Factories with exact customer counts from historical FactoryProduction records ensure accurate earnings!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 