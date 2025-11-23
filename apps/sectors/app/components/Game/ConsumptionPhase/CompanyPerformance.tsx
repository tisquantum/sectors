'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { CompanyPerformanceProps, Company } from './types';
import { trpc } from '@sectors/app/trpc';
import { ResourceIcon } from './ResourceIcon';
import { BASE_WORKER_SALARY } from '@server/data/constants';
import { useMemo } from 'react';

export function CompanyPerformance({ companies, gameId }: CompanyPerformanceProps) {
  // Fetch resource prices for reference
  const { data: resourcePrices } = trpc.resource.getAllResourcePrices.useQuery(
    { gameId: gameId || '' },
    { enabled: !!gameId }
  );

  // Create a map of resource type to price for quick lookup
  const resourcePriceMap = useMemo(() => {
    if (!resourcePrices) return new Map<string, number>();
    return new Map(resourcePrices.map(r => [r.type, r.price]));
  }, [resourcePrices]);

  // Calculate revenue per unit for a factory
  const calculateRevenuePerUnit = (factory: Company['factories'][0]) => {
    if (!resourcePriceMap.size) return 0;
    return factory.resources.reduce((sum, resourceType) => {
      return sum + (resourcePriceMap.get(resourceType) || 0);
    }, 0);
  };

  // Calculate expected revenue and costs for a factory
  const calculateFactoryFinancials = (factory: Company['factories'][0]) => {
    const revenuePerUnit = calculateRevenuePerUnit(factory);
    const totalRevenue = factory.consumersReceived * revenuePerUnit;
    // Worker costs - we need to get worker count from somewhere
    // For now, estimate based on factory size (FACTORY_I = 1 worker, FACTORY_II = 2, etc.)
    const estimatedWorkers = factory.size === 'FACTORY_I' ? 1 : 
                            factory.size === 'FACTORY_II' ? 2 :
                            factory.size === 'FACTORY_III' ? 3 : 4;
    const costs = estimatedWorkers * BASE_WORKER_SALARY;
    const expectedProfit = totalRevenue - costs;
    
    return {
      revenuePerUnit,
      totalRevenue,
      costs,
      expectedProfit,
    };
  };
  const calculateCompanyTotals = (company: Company) => {
    const totalConsumers = company.factories.reduce((sum, factory) => sum + factory.consumersReceived, 0);
    const totalMaxConsumers = company.factories.reduce((sum, factory) => sum + factory.maxConsumers, 0);
    const totalProfit = company.factories.reduce((sum, factory) => sum + factory.profit, 0);
    const efficiency = totalMaxConsumers > 0 ? (totalConsumers / totalMaxConsumers) * 100 : 0;
    
    return {
      totalConsumers,
      totalMaxConsumers,
      totalProfit,
      efficiency
    };
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    const aTotals = calculateCompanyTotals(a);
    const bTotals = calculateCompanyTotals(b);
    return bTotals.totalProfit - aTotals.totalProfit;
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-xl">Company Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Brand Score</th>
                  <th className="px-4 py-3">Total Consumers</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Efficiency</th>
                  <th className="px-4 py-3">Total Profit</th>
                </tr>
              </thead>
              <tbody>
                {sortedCompanies.map((company, index) => {
                  const totals = calculateCompanyTotals(company);
                  return (
                    <tr key={company.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="px-4 py-3 font-medium text-white">{company.name}</td>
                      <td className="px-4 py-3 text-gray-300">{company.sector}</td>
                      <td className="px-4 py-3 text-gray-300">{company.brandScore}</td>
                      <td className="px-4 py-3 text-green-400 font-semibold">{totals.totalConsumers}</td>
                      <td className="px-4 py-3 text-gray-300">{totals.totalMaxConsumers}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${totals.efficiency}%` }}
                            />
                          </div>
                          <span className="text-gray-300 text-xs">{totals.efficiency.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-green-400 font-bold">${totals.totalProfit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Factory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedCompanies.map((company) => {
          const totals = calculateCompanyTotals(company);
          return (
            <Card key={company.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{company.name}</CardTitle>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Total Profit</div>
                    <div className="text-lg font-bold text-green-400">${totals.totalProfit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Sector: {company.sector}</span>
                  <span>Brand Score: {company.brandScore}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-400">Consumers Received</div>
                    <div className="text-xl font-bold text-green-400">{totals.totalConsumers}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-gray-400">Capacity</div>
                    <div className="text-xl font-bold text-blue-400">{totals.totalMaxConsumers}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Factory Breakdown</h4>
                  {company.factories.map((factory) => {
                    const financials = calculateFactoryFinancials(factory);
                    const revenuePerUnit = calculateRevenuePerUnit(factory);
                    
                    return (
                      <div key={factory.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">
                            {factory.size.replace('_', ' ')}
                          </span>
                          <div className="text-right">
                            <div className="text-sm text-green-400 font-bold">
                              ${factory.profit}
                            </div>
                            {factory.profit === 0 && factory.consumersReceived > 0 && (
                              <div className="text-xs text-yellow-400 mt-0.5">
                                (Earnings pending)
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Resource prices */}
                        <div className="mb-2">
                          <div className="text-xs text-gray-400 mb-1">Resource Prices:</div>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {factory.resources.map((resourceType, idx) => {
                              const price = resourcePriceMap.get(resourceType) || 0;
                              return (
                                <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-600 rounded text-xs">
                                  <ResourceIcon resourceType={resourceType} size="w-3 h-3" />
                                  <span className="text-gray-300">${price}</span>
                                </div>
                              );
                            })}
                            {revenuePerUnit > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                = ${revenuePerUnit}/unit
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Revenue breakdown */}
                        {factory.consumersReceived > 0 && (
                          <div className="mb-2 pt-2 border-t border-gray-600">
                            <div className="text-xs space-y-1">
                              {factory.revenue !== undefined && factory.costs !== undefined ? (
                                // Show actual calculated values if available (from earnings call)
                                <>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Revenue:</span>
                                    <span className="text-green-400">
                                      ${factory.revenue}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Costs:</span>
                                    <span className="text-red-400">
                                      ${factory.costs}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-gray-300 font-medium pt-1 border-t border-gray-600">
                                    <span>Profit:</span>
                                    <span className={factory.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      ${factory.profit}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                // Show expected values if earnings call hasn't run yet
                                <>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Expected Revenue:</span>
                                    <span className="text-green-400">
                                      {factory.consumersReceived} × ${revenuePerUnit} = ${financials.totalRevenue}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Expected Costs:</span>
                                    <span className="text-red-400">
                                      ${financials.costs} (workers)
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-gray-300 font-medium pt-1 border-t border-gray-600">
                                    <span>Expected Profit:</span>
                                    <span className={financials.expectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      ${financials.expectedProfit}
                                    </span>
                                  </div>
                                  <div className="text-xs text-yellow-400 italic mt-1">
                                    * Calculated during Earnings Call phase
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{factory.consumersReceived}/{factory.maxConsumers} consumers</span>
                          <span>{((factory.consumersReceived / factory.maxConsumers) * 100).toFixed(1)}% capacity</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(factory.consumersReceived / factory.maxConsumers) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 