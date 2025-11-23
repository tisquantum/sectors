'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { ResourceIcon } from './ResourceIcon';
import { ConsumerFlowPerSectorProps } from './types';
import { trpc } from '@sectors/app/trpc';
import { BASE_WORKER_SALARY } from '@server/data/constants';
import { useMemo } from 'react';

export function ConsumerFlowPerSector({ sectors, companies, gameId }: ConsumerFlowPerSectorProps) {
  // Fetch resource prices for calculating pending profit
  const { data: resourcePrices } = trpc.resource.getAllResourcePrices.useQuery(
    { gameId: gameId || '' },
    { enabled: !!gameId }
  );

  // Create a map of resource type to price for quick lookup
  const resourcePriceMap = useMemo(() => {
    if (!resourcePrices) return new Map<string, number>();
    return new Map(resourcePrices.map(r => [r.type, r.price]));
  }, [resourcePrices]);

  // Calculate pending profit for a factory
  const calculatePendingProfit = (factory: typeof companies[0]['factories'][0]) => {
    if (!resourcePriceMap.size || factory.consumersReceived === 0) return null;
    
    // Calculate revenue per unit
    const revenuePerUnit = factory.resources.reduce((sum, resourceType) => {
      return sum + (resourcePriceMap.get(resourceType) || 0);
    }, 0);
    
    // Calculate total revenue
    const totalRevenue = factory.consumersReceived * revenuePerUnit;
    
    // Estimate worker costs based on factory size
    const estimatedWorkers = factory.size === 'FACTORY_I' ? 1 : 
                            factory.size === 'FACTORY_II' ? 2 :
                            factory.size === 'FACTORY_III' ? 3 : 4;
    const costs = estimatedWorkers * BASE_WORKER_SALARY;
    
    // Calculate expected profit
    const expectedProfit = totalRevenue - costs;
    
    return expectedProfit;
  };
  return (
    <div className="space-y-6">
      {sectors.map((sector) => {
        const sectorCompanies = companies.filter(company => company.sector === sector.name);
        
        return (
          <Card key={sector.id} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-xl">{sector.name} Sector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Consumer Profiles */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300">Consumer Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sector.consumerProfiles.map((profile, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          {profile.factorySize.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-green-400 font-bold">
                          {profile.consumerCount} consumers
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile.resources.map((resource, resIndex) => (
                          <ResourceIcon 
                            key={resIndex} 
                            resourceType={resource} 
                            size="w-4 h-4"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Factories */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300">Company Factories</h3>
                <div className="space-y-4">
                  {sectorCompanies.map((company) => (
                    <div key={company.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{company.name}</h4>
                          <p className="text-sm text-gray-400">Brand Score: {company.brandScore}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {company.factories.map((factory) => {
                          const pendingProfit = calculatePendingProfit(factory);
                          const showPendingProfit = factory.profit === 0 && factory.consumersReceived > 0 && pendingProfit !== null;
                          
                          return (
                          <div key={factory.id} className="bg-gray-600 rounded-lg p-3 border border-gray-500">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-300">
                                {factory.size.replace('_', ' ')}
                              </span>
                              <div className="text-right">
                                <div className="text-sm text-green-400 font-bold">
                                  {factory.consumersReceived}/{factory.maxConsumers}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ${factory.profit} profit
                                </div>
                                {showPendingProfit && (
                                  <div className="text-xs text-yellow-400 mt-0.5">
                                    (Pending: ${pendingProfit})
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {factory.resources.map((resource, resIndex) => (
                                <ResourceIcon 
                                  key={resIndex} 
                                  resourceType={resource} 
                                  size="w-3 h-3"
                                />
                              ))}
                            </div>
                            <div className="w-full bg-gray-500 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(factory.consumersReceived / factory.maxConsumers) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 