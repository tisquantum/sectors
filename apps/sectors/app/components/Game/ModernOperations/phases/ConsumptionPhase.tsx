'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { useModernOperations } from '../hooks';
import { ModernOperationsLayout, ModernOperationsSection } from '../layouts';
import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';
import { FACTORY_CUSTOMER_LIMITS } from '@server/data/constants';
import { ConsumerFlowPerSector } from '../../ConsumptionPhase/ConsumerFlowPerSector';
import { CompanyPerformance } from '../../ConsumptionPhase/CompanyPerformance';
import { ConsumerFlowLog } from '../../ConsumptionPhase/ConsumerFlowLog';
import { AnimatedConsumptionFlow } from '../../ConsumptionPhase/AnimatedConsumptionFlow';
import { Spinner } from '@nextui-org/react';
import type { Sector, Company, FlowLogEntry } from '../../ConsumptionPhase/types';
import { ResourceIcon } from '../../ConsumptionPhase/ResourceIcon';

/**
 * Consumption Phase - Refactored to use real backend data
 * Shows consumer distribution results from the consumption phase
 */
export function ConsumptionPhase() {
  const [activeTab, setActiveTab] = useState('flow');
  const { gameId, currentTurn, gameState } = useGame();
  const { productionData, sectors, consumptionBags, isLoading, refetch: refetchModernOps } = useModernOperations();

  // Get tRPC utils for invalidating queries
  const trpcUtils = trpc.useUtils();

  // Get current phase to detect transitions
  const { currentPhase } = useGame();

  // Get production data with relations for current turn
  // Refetch when phase changes to ensure we get fresh data after resolution
  const { data: productionWithRelations, isLoading: productionLoading, refetch: refetchProduction } = trpc.factoryProduction.getGameTurnProduction.useQuery(
    {
      gameId,
      gameTurnId: currentTurn?.id || '',
    },
    { 
      enabled: !!gameId && !!currentTurn?.id,
      // Prevent excessive refetching
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5000, // 5 seconds - data is relatively stable
    }
  );

  // Refetch all data when navigating to Consumption Phase
  // Use a ref to track if we've already refetched for this phase
  const lastRefetchedPhaseIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentPhase?.id || !gameId || !currentTurn?.id) return;
    
    // Only refetch once per phase change
    if (currentPhase?.name === 'CONSUMPTION_PHASE' && lastRefetchedPhaseIdRef.current !== currentPhase.id) {
      lastRefetchedPhaseIdRef.current = currentPhase.id;
      refetchProduction();
      // Refetch all modern operations data (consumption bags, sectors, etc.)
      refetchModernOps.consumptionBags();
      refetchModernOps.sectors();
    }
  }, [currentPhase?.id, currentPhase?.name, gameId, currentTurn?.id, refetchProduction, refetchModernOps]);

  // Refetch production data when phase transitions to EARNINGS_CALL
  // (This is when production records are created from consumption phase resolution)
  const earningsCallRefetchRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentPhase?.name === 'EARNINGS_CALL' && currentTurn?.id && currentPhase.id !== earningsCallRefetchRef.current) {
      earningsCallRefetchRef.current = currentPhase.id;
      // Production records should now exist, refetch to show results
      refetchProduction();
    }
  }, [currentPhase?.id, currentPhase?.name, currentTurn?.id, refetchProduction]);

  // Get operational factories for preview (when phase hasn't resolved yet)
  // MUST be called before any conditional returns to follow React hooks rules
  const { data: allFactoriesData } = trpc.factory.getGameFactories.useQuery(
    { gameId },
    { 
      enabled: !!gameId && (!productionWithRelations || productionWithRelations.length === 0),
      refetchOnMount: false, // Prevent excessive refetching
      refetchOnWindowFocus: false,
      staleTime: 5000, // 5 seconds
    }
  );

  // Filter to operational factories
  const operationalFactories = useMemo(() => {
    if (!allFactoriesData) return [];
    return allFactoriesData.filter(f => f.isOperational);
  }, [allFactoriesData]);

  console.log('operationalFactories', operationalFactories);
  console.log('productionWithRelations', productionWithRelations);

  // Transform production data into the format expected by child components
  const transformedData = useMemo(() => {
    if (!productionWithRelations || !gameState?.sectors || !gameState?.Company) {
      return { sectorsData: [], companiesData: [], flowLog: [] };
    }

    // Group production records by sector
    const sectorsMap = new Map<string, Sector>();
    const companiesMap = new Map<string, Company>();

    // Initialize sectors
    gameState.sectors.forEach((sector: any) => {
      sectorsMap.set(sector.id, {
        id: sector.id,
        name: sector.name || sector.sectorName || 'Unknown',
        consumerProfiles: [],
      });
    });

    // Process production records (only those with customers served)
    productionWithRelations
      .filter((p: any) => p.customersServed > 0)
      .forEach((production: any) => {
        const factory = production.Factory;
        const company = production.Company;
        const sectorId = factory?.sectorId;
        
        if (!factory || !company || !sectorId) return;
      
      // Get sector
      const sector = sectorsMap.get(sectorId);
      if (!sector) return;

      // Create consumer profile for this factory
      const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size as keyof typeof FACTORY_CUSTOMER_LIMITS] || 0;
      const consumerProfile = {
        factorySize: factory.size,
        resources: factory.resourceTypes || [],
        consumerCount: production.customersServed,
      };

      // Add consumer profile to sector (group by factory size and resources)
      const existingProfile = sector.consumerProfiles.find(
        (p) => p.factorySize === consumerProfile.factorySize &&
        JSON.stringify(p.resources.sort()) === JSON.stringify(consumerProfile.resources.sort())
      );

      if (existingProfile) {
        existingProfile.consumerCount += consumerProfile.consumerCount;
      } else {
        sector.consumerProfiles.push(consumerProfile);
      }

      // Build company data
      if (!companiesMap.has(company.id)) {
        const sector = gameState.sectors.find((s: any) => s.id === company.sectorId);
        companiesMap.set(company.id, {
          id: company.id,
          name: company.name,
          brandScore: company.brandScore || 0,
          sector: sector?.name || sector?.sectorName || 'Unknown',
          factories: [],
        });
      }

      const companyData = companiesMap.get(company.id)!;
      
      // Check if factory already exists in company (in case of duplicates)
      const existingFactory = companyData.factories.find(f => f.id === factory.id);
      if (existingFactory) {
        // Update existing factory data (could happen if multiple production records exist)
        existingFactory.consumersReceived += production.customersServed;
        existingFactory.profit += (production.profit || 0);
        existingFactory.revenue = (existingFactory.revenue || 0) + (production.revenue || 0);
        existingFactory.costs = (existingFactory.costs || 0) + (production.costs || 0);
      } else {
        // Add factory to company
        companyData.factories.push({
          id: factory.id,
          size: factory.size,
          resources: factory.resourceTypes || [],
          consumersReceived: production.customersServed,
          maxConsumers: maxCustomers,
          profit: production.profit || 0,
          revenue: production.revenue || 0,
          costs: production.costs || 0,
        });
      }
    });

    // Convert maps to arrays
    const sectorsData = Array.from(sectorsMap.values()).filter(s => s.consumerProfiles.length > 0);
    const companiesData = Array.from(companiesMap.values()).filter(c => c.factories.length > 0);

    // Generate flow log from production data
    // Create one log entry per customer served for more detailed tracking
    const flowLog: FlowLogEntry[] = [];
    productionWithRelations
      .filter((p: any) => p.customersServed > 0 && p.Factory && p.Company)
      .forEach((production: any) => {
        const factory = production.Factory;
        const company = production.Company;
        const resourceStr = factory.resourceTypes?.join(', ') || '';
        
        // Create one log entry per customer
        for (let i = 0; i < production.customersServed; i++) {
          flowLog.push({
            id: `${production.id}-${i}`,
            consumerProfile: `${factory.size} - [${resourceStr}]`,
            destination: `${company.name} ${factory.size.replace('_', ' ')} (Slot ${factory.slot})`,
            reason: `Customer ${i + 1}/${production.customersServed} - Brand Score: ${company.brandScore || 0}`,
            timestamp: production.createdAt || new Date().toISOString(),
          });
        }
      });
    
    // Sort by timestamp
    flowLog.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return { sectorsData, companiesData, flowLog };
  }, [productionWithRelations, gameState?.sectors, gameState?.Company]);

  if (isLoading || productionLoading) {
    return (
      <ModernOperationsLayout
        title="Consumption Phase"
        description="Loading consumption results..."
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  // If no production data yet, show preview state with consumption bags and factories
  if (!productionWithRelations || productionWithRelations.length === 0) {
    // Sidebar: Show consumption bag summary
    const previewSidebar = consumptionBags.length > 0 && (
      <ModernOperationsSection title="Consumption Bags Summary">
        <div className="space-y-3">
          {gameState?.sectors?.map((sector: any) => {
            const sectorMarkers = consumptionBags.filter((m: any) => m.sectorId === sector.id);
            const permanent = sectorMarkers.filter((m: any) => m.isPermanent).length;
            const temporary = sectorMarkers.filter((m: any) => !m.isPermanent).length;
            const sectorConsumers = sector.consumers || 0;
            const sectorFactories = operationalFactories.filter((f: any) => f.sectorId === sector.id);
            
            return (
              <div key={sector.id} className="bg-gray-700/30 rounded-lg p-3">
                <div className="font-medium text-gray-200 mb-1">{sector.name}</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Customers:</span>
                    <span className="text-white font-semibold">{sectorConsumers}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Total Markers:</span>
                    <span className="text-white font-semibold">{sectorMarkers.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Permanent:</span>
                    <span className="text-green-400">{permanent}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Temporary:</span>
                    <span className="text-yellow-400">{temporary}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Operational Factories:</span>
                    <span className="text-blue-400">{sectorFactories.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ModernOperationsSection>
    );

    return (
      <ModernOperationsLayout
        title="Consumption Phase"
        description="Consumer flow distribution based on factory schematics and brand scores"
        sidebar={previewSidebar}
      >
        <ModernOperationsSection>
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400 mt-0.5">ℹ️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-300 mb-2">Consumption Phase Pending</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    The consumption phase has not resolved yet. When all players ready up or the timer expires, 
                    customers will be drawn from consumption bags and assigned to factories based on:
                  </p>
                  <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                    <li>Attraction rating (unit price - brand score)</li>
                    <li>Factory capacity limits</li>
                    <li>Resource type matching</li>
                    <li>Factory complexity (tie-breaker)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Consumption Bags Preview */}
            {consumptionBags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Consumption Bags</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gameState?.sectors?.map((sector: any) => {
                    const sectorMarkers = consumptionBags.filter((m: any) => m.sectorId === sector.id);
                    if (sectorMarkers.length === 0) return null;
                    
                    const permanent = sectorMarkers.filter((m: any) => m.isPermanent);
                    const temporary = sectorMarkers.filter((m: any) => !m.isPermanent);
                    
                    return (
                      <div key={sector.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                        <div className="font-medium text-white mb-3">{sector.name}</div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-400 mb-2">
                              Permanent Markers ({permanent.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {permanent.map((marker: any) => (
                                <ResourceIcon
                                  key={marker.id}
                                  resourceType={marker.resourceType}
                                  size="w-6 h-6"
                                />
                              ))}
                            </div>
                          </div>
                          {temporary.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-400 mb-2">
                                Temporary Markers ({temporary.length})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {temporary.map((marker: any) => (
                                  <ResourceIcon
                                    key={marker.id}
                                    resourceType={marker.resourceType}
                                    size="w-6 h-6"
                                    title={`${marker.resourceType} (Temporary)`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
                            <div className="flex justify-between mb-1">
                              <span>Customers:</span>
                              <span className="text-white">{sector.consumers || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Operational Factories:</span>
                              <span className="text-blue-400">
                                {operationalFactories.filter((f: any) => f.sectorId === sector.id).length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Factories Preview */}
            {operationalFactories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Available Factories</h3>
                <div className="space-y-4">
                  {gameState?.sectors?.map((sector: any) => {
                    const sectorFactories = operationalFactories.filter((f: any) => f.sectorId === sector.id);
                    if (sectorFactories.length === 0) return null;
                    
                    return (
                      <div key={sector.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                        <div className="font-medium text-white mb-3">{sector.name}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sectorFactories.map((factory: any) => {
                            const company = factory.company || gameState?.Company?.find((c: any) => c.id === factory.companyId);
                            const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size as keyof typeof FACTORY_CUSTOMER_LIMITS] || 0;
                            
                            return (
                              <div key={factory.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-300">
                                    {company?.name || 'Unknown'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {factory.size.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mb-2">
                                  Brand Score: {company?.brandScore || 0}
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {factory.resourceTypes?.map((resource: string, idx: number) => (
                                    <ResourceIcon key={idx} resourceType={resource} size="w-4 h-4" />
                                  ))}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Capacity: {maxCustomers} customers
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {consumptionBags.length === 0 && operationalFactories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No consumption data available yet</p>
                <p className="text-gray-500 text-sm">
                  Production records will appear here after the consumption phase resolves.
                </p>
              </div>
            )}
          </div>
        </ModernOperationsSection>
      </ModernOperationsLayout>
    );
  }

  const { sectorsData, companiesData, flowLog } = transformedData;

  // Sidebar: Show consumption bag summary
  const sidebar = consumptionBags.length > 0 && (
    <ModernOperationsSection title="Consumption Bags Summary">
      <div className="space-y-3">
        {gameState?.sectors?.map((sector: any) => {
          const sectorMarkers = consumptionBags.filter((m: any) => m.sectorId === sector.id);
          const permanent = sectorMarkers.filter((m: any) => m.isPermanent).length;
          const temporary = sectorMarkers.filter((m: any) => !m.isPermanent).length;
          
          return (
            <div key={sector.id} className="bg-gray-700/30 rounded-lg p-3">
              <div className="font-medium text-gray-200 mb-1">{sector.name}</div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Total Markers:</span>
                  <span className="text-white font-semibold">{sectorMarkers.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Permanent:</span>
                  <span className="text-green-400">{permanent}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Temporary:</span>
                  <span className="text-yellow-400">{temporary}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModernOperationsSection>
  );

  return (
    <ModernOperationsLayout
      title="Consumption Phase"
      description="Consumer flow distribution based on factory schematics and brand scores"
      sidebar={sidebar}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="animation">Animation</TabsTrigger>
          <TabsTrigger value="flow">Consumer Flow</TabsTrigger>
          <TabsTrigger value="performance">Company Performance</TabsTrigger>
          <TabsTrigger value="log">Flow Log</TabsTrigger>
        </TabsList>

        <TabsContent value="animation" className="mt-4">
          {sectorsData.length > 0 && flowLog.length > 0 ? (
            <AnimatedConsumptionFlow
              sectors={gameState?.sectors || []}
              companies={companiesData}
              flowLog={flowLog}
              consumptionBags={consumptionBags}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No consumption data available for animation
            </div>
          )}
        </TabsContent>

        <TabsContent value="flow" className="mt-4">
          {sectorsData.length > 0 ? (
            <ConsumerFlowPerSector 
              sectors={sectorsData}
              companies={companiesData}
              gameId={gameId}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No factories served customers in this turn
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          {companiesData.length > 0 ? (
            <CompanyPerformance companies={companiesData} gameId={gameId} />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No company performance data available
            </div>
          )}
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          {flowLog.length > 0 ? (
            <ConsumerFlowLog flowLog={flowLog} />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No flow log entries available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ModernOperationsLayout>
  );
}

