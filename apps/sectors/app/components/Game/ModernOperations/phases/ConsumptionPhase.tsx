'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { useModernOperations } from '../hooks';
import { ModernOperationsLayout, ModernOperationsSection } from '../layouts';
import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';
import { FACTORY_CUSTOMER_LIMITS } from '@server/data/constants';
import { ConsumerFlowPerSector } from '../../ConsumptionPhase/ConsumerFlowPerSector';
import { CompanyPerformance } from '../../ConsumptionPhase/CompanyPerformance';
import { ConsumerFlowLog } from '../../ConsumptionPhase/ConsumerFlowLog';
import { Spinner } from '@nextui-org/react';
import type { Sector, Company, FlowLogEntry } from '../../ConsumptionPhase/types';

/**
 * Consumption Phase - Refactored to use real backend data
 * Shows consumer distribution results from the consumption phase
 */
export function ConsumptionPhase() {
  const [activeTab, setActiveTab] = useState('flow');
  const { gameId, currentTurn, gameState } = useGame();
  const { productionData, sectors, consumptionBags, isLoading } = useModernOperations();

  // Get production data with relations for current turn
  const { data: productionWithRelations, isLoading: productionLoading } = trpc.factoryProduction.getGameTurnProduction.useQuery(
    {
      gameId,
      gameTurnId: currentTurn?.id || '',
    },
    { enabled: !!gameId && !!currentTurn?.id }
  );

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
      const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size] || 0;
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
      } else {
        // Add factory to company
        companyData.factories.push({
          id: factory.id,
          size: factory.size,
          resources: factory.resourceTypes || [],
          consumersReceived: production.customersServed,
          maxConsumers: maxCustomers,
          profit: production.profit || 0,
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

  // If no production data yet, show empty state
  if (!productionWithRelations || productionWithRelations.length === 0) {
    return (
      <ModernOperationsLayout
        title="Consumption Phase"
        description="Consumer flow distribution based on factory schematics and brand scores"
      >
        <ModernOperationsSection>
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">No consumption data available yet</p>
            <p className="text-gray-500 text-sm">
              Production records will appear here after the consumption phase resolves.
            </p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flow">Consumer Flow</TabsTrigger>
          <TabsTrigger value="performance">Company Performance</TabsTrigger>
          <TabsTrigger value="log">Flow Log</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-4">
          {sectorsData.length > 0 ? (
            <ConsumerFlowPerSector 
              sectors={sectorsData}
              companies={companiesData}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No factories served customers in this turn
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          {companiesData.length > 0 ? (
            <CompanyPerformance companies={companiesData} />
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

