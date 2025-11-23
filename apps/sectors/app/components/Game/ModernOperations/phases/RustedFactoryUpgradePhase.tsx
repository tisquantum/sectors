'use client';

import { useGame } from '../../GameContext';
import { trpc } from '@sectors/app/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { ModernOperationsLayout, ModernOperationsSection } from '../layouts';
import { Spinner, Badge } from '@nextui-org/react';
import { FactorySize, CompanyStatus } from '@server/prisma/prisma.client';
import { useMemo } from 'react';
import CompanyInfo from '../../../Company/CompanyInfo';
import { getSectorResourceForSectorName } from '@server/data/constants';
import { ResourceType } from '@server/prisma/prisma.client';

// Helper to get required resources for a factory size
const getRequiredResourcesForFactory = (size: FactorySize, sectorResourceType: ResourceType): Array<{ type: ResourceType; quantity: number }> => {
  const resources: Array<{ type: ResourceType; quantity: number }> = [];
  
  switch (size) {
    case FactorySize.FACTORY_I:
      resources.push({ type: ResourceType.TRIANGLE, quantity: 1 });
      break;
    case FactorySize.FACTORY_II:
      resources.push({ type: ResourceType.TRIANGLE, quantity: 1 });
      resources.push({ type: ResourceType.SQUARE, quantity: 1 });
      break;
    case FactorySize.FACTORY_III:
      resources.push({ type: ResourceType.TRIANGLE, quantity: 2 });
      resources.push({ type: ResourceType.SQUARE, quantity: 1 });
      resources.push({ type: ResourceType.CIRCLE, quantity: 1 });
      break;
    case FactorySize.FACTORY_IV:
      resources.push({ type: ResourceType.TRIANGLE, quantity: 2 });
      resources.push({ type: ResourceType.SQUARE, quantity: 2 });
      resources.push({ type: ResourceType.CIRCLE, quantity: 1 });
      break;
  }
  
  // Add sector-specific resource
  resources.push({ type: sectorResourceType, quantity: 1 });
  
  return resources;
};

interface RustedFactoryInfo {
  factoryId: string;
  companyId: string;
  companyName: string;
  sectorName: string;
  currentSize: FactorySize;
  slot: number;
  originalConstructionCost: number | null;
  requiredSize: FactorySize;
  upgradeCost: number;
  companyCash: number;
  companyStatus: CompanyStatus;
}

export function RustedFactoryUpgradePhase() {
  const { gameState, gameId, currentPhase } = useGame();

  // Fetch all factories
  const { data: allFactories, isLoading: factoriesLoading } = trpc.factory.getGameFactories.useQuery(
    { gameId: gameId || '' },
    { enabled: !!gameId }
  );

  // Fetch all companies with sectors
  const { data: companies, isLoading: companiesLoading } = trpc.company.listCompaniesWithSector.useQuery(
    { where: { gameId } },
    { enabled: !!gameId }
  );

  // Fetch all sectors
  const { data: sectors, isLoading: sectorsLoading } = trpc.sector.listSectors.useQuery(
    { where: { gameId } },
    { enabled: !!gameId }
  );

  // Fetch resource prices
  const { data: resourcePrices } = trpc.resource.getAllResourcePrices.useQuery(
    { gameId: gameId || '' },
    { enabled: !!gameId }
  );

  // Calculate slot phases based on research stage
  const getSlotPhasesForResearchStage = (stage: number): Array<{ min: FactorySize; max: FactorySize }> => {
    switch (stage) {
      case 1:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
        ];
      case 2:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
        ];
      case 3:
        return [
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_II },
          { min: FactorySize.FACTORY_II, max: FactorySize.FACTORY_III },
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
        ];
      case 4:
        return [
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_III },
          { min: FactorySize.FACTORY_III, max: FactorySize.FACTORY_IV },
          { min: FactorySize.FACTORY_IV, max: FactorySize.FACTORY_IV },
        ];
      default:
        return [
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
          { min: FactorySize.FACTORY_I, max: FactorySize.FACTORY_I },
        ];
    }
  };

  const getResearchStage = (researchMarker: number): number => {
    if (researchMarker >= 16) return 4;
    if (researchMarker >= 11) return 3;
    if (researchMarker >= 6) return 2;
    return 1;
  };

  // Calculate rusted factory information
  const rustedFactories = useMemo(() => {
    if (!allFactories || !companies || !sectors || !resourcePrices) return [];

    const resourcePriceMap = new Map(resourcePrices.map(r => [r.type, r.price]));
    const rusted: RustedFactoryInfo[] = [];

    // Group factories by company
    const factoriesByCompany = new Map<string, typeof allFactories>();
    for (const factory of allFactories) {
      if (!factoriesByCompany.has(factory.companyId)) {
        factoriesByCompany.set(factory.companyId, []);
      }
      factoriesByCompany.get(factory.companyId)!.push(factory);
    }

    for (const factory of allFactories) {
      if (!factory.isRusted) continue;

      const company = companies.find(c => c.id === factory.companyId);
      const sector = sectors.find(s => s.id === factory.sectorId);
      
      if (!company || !sector) continue;

      const researchStage = getResearchStage(sector.researchMarker || 0);
      const slotPhases = getSlotPhasesForResearchStage(researchStage);
      const slotIndex = factory.slot - 1;

      if (slotIndex < 0 || slotIndex >= slotPhases.length) continue;

      const slotPhase = slotPhases[slotIndex];
      const requiredSize = slotPhase.min;

      // Calculate upgrade cost
      const originalCost = factory.originalConstructionCost || 0;
      const refundAmount = Math.floor(originalCost * 0.5);

      // Get resource costs for new factory size
      const sectorResourceType = getSectorResourceForSectorName(sector.sectorName);
      const requiredResources = getRequiredResourcesForFactory(requiredSize, sectorResourceType);
      const resourceCost = requiredResources.reduce(
        (sum, req) => sum + (resourcePriceMap.get(req.type) || 0) * req.quantity,
        0
      );

      const baseCost = {
        [FactorySize.FACTORY_I]: 100,
        [FactorySize.FACTORY_II]: 200,
        [FactorySize.FACTORY_III]: 300,
        [FactorySize.FACTORY_IV]: 400,
      }[requiredSize];

      const fullBlueprintCost = baseCost + resourceCost;
      const upgradeCost = fullBlueprintCost - refundAmount;

      rusted.push({
        factoryId: factory.id,
        companyId: company.id,
        companyName: company.name,
        sectorName: sector.sectorName || sector.name || 'Unknown',
        currentSize: factory.size,
        slot: factory.slot,
        originalConstructionCost: factory.originalConstructionCost,
        requiredSize,
        upgradeCost,
        companyCash: company.cashOnHand || 0,
        companyStatus: company.status,
      });
    }

    return rusted;
  }, [allFactories, companies, sectors, resourcePrices]);

  // Group rusted factories by company
  const rustedByCompany = useMemo(() => {
    const grouped = new Map<string, RustedFactoryInfo[]>();
    for (const factory of rustedFactories) {
      if (!grouped.has(factory.companyId)) {
        grouped.set(factory.companyId, []);
      }
      grouped.get(factory.companyId)!.push(factory);
    }
    return grouped;
  }, [rustedFactories]);

  if (factoriesLoading || companiesLoading || sectorsLoading) {
    return (
      <ModernOperationsLayout
        title="Rusted Factory Upgrade"
        description="Resolving rusted factory upgrades..."
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ModernOperationsLayout>
    );
  }

  const totalUpgradeCostsByCompany = new Map<string, number>();
  for (const [companyId, factories] of rustedByCompany.entries()) {
    const total = factories.reduce((sum, f) => sum + f.upgradeCost, 0);
    totalUpgradeCostsByCompany.set(companyId, total);
  }

  const sidebar = (
    <ModernOperationsSection title="About Rusted Factories">
      <div className="space-y-3 text-sm text-gray-400">
        <div>
          <p className="font-medium text-gray-300 mb-1">What are Rusted Factories?</p>
          <p className="text-xs">
            As research stages advance, factory slot requirements change. Factories that no longer meet the minimum requirements become "rusted" and must be upgraded.
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-300 mb-1">Upgrade Cost</p>
          <p className="text-xs">
            Upgrade cost = Full blueprint fee - 50% of original construction cost
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-300 mb-1">Automatic Resolution</p>
          <p className="text-xs">
            Companies that can afford upgrades will be upgraded automatically. Companies that cannot afford upgrades will go into INSOLVENCY.
          </p>
        </div>
      </div>
    </ModernOperationsSection>
  );

  if (rustedFactories.length === 0) {
    return (
      <ModernOperationsLayout
        title="Rusted Factory Upgrade"
        description="All factories are up to date with current research stage requirements"
        sidebar={sidebar}
      >
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No rusted factories detected</p>
          <p className="text-gray-500 text-sm">
            All factories meet the current research stage requirements.
          </p>
        </div>
      </ModernOperationsLayout>
    );
  }

  return (
    <ModernOperationsLayout
      title="Rusted Factory Upgrade"
      description="Factories that must be upgraded due to research stage advancement"
      sidebar={sidebar}
    >
      <div className="space-y-6">
        {Array.from(rustedByCompany.entries()).map(([companyId, factories]) => {
          const company = companies?.find(c => c.id === companyId);
          const totalCost = totalUpgradeCostsByCompany.get(companyId) || 0;
          const canAfford = company && (company.cashOnHand || 0) >= totalCost;
          const willGoInsolvent = !canAfford;

          return (
            <Card key={companyId} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl flex items-center gap-2">
                      {company && <CompanyInfo companyId={company.id} />}
                      {company?.name || 'Unknown Company'}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span>Sector: {factories[0]?.sectorName.replace('_', ' ') || 'Unknown'}</span>
                      <span>Cash: ${(company?.cashOnHand || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {willGoInsolvent ? (
                      <Badge color="danger" variant="flat" size="lg">
                        Will Go Insolvent
                      </Badge>
                    ) : (
                      <Badge color="success" variant="flat" size="lg">
                        Can Afford Upgrades
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-400">Rusted Factories</div>
                        <div className="text-lg font-bold text-orange-400">{factories.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Total Upgrade Cost</div>
                        <div className={`text-lg font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                          ${totalCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Factory Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300">Factory Upgrades Required</h4>
                    {factories.map((factory) => (
                      <div key={factory.factoryId} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-300">
                              Slot {factory.slot}
                            </span>
                            <Badge color="warning" variant="flat" size="sm">
                              Rusted
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                              ${factory.upgradeCost.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Upgrade Cost</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Current Size</div>
                            <div className="text-gray-300 font-medium">
                              {factory.currentSize.replace('FACTORY_', '')}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Required Size</div>
                            <div className="text-orange-400 font-medium">
                              {factory.requiredSize.replace('FACTORY_', '')}
                            </div>
                          </div>
                        </div>
                        {factory.originalConstructionCost && (
                          <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-500">
                            Original Cost: ${factory.originalConstructionCost.toLocaleString()} 
                            {' → '}
                            Refund: ${Math.floor(factory.originalConstructionCost * 0.5).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Status Message */}
                  <div className={`rounded-lg p-4 border ${
                    willGoInsolvent 
                      ? 'bg-red-900/30 border-red-500/50' 
                      : 'bg-green-900/30 border-green-500/50'
                  }`}>
                    <p className={`text-sm font-medium ${
                      willGoInsolvent ? 'text-red-300' : 'text-green-300'
                    }`}>
                      {willGoInsolvent
                        ? `⚠️ ${company?.name} cannot afford the required upgrades ($${totalCost.toLocaleString()}). The company will go into INSOLVENCY.`
                        : `✓ ${company?.name} can afford all required upgrades. Factories will be upgraded automatically.`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ModernOperationsLayout>
  );
}

