'use client';

import { trpc } from "@sectors/app/trpc";
import { useGame } from "../GameContext";
import {
  Company,
  CompanyStatus,
  RevenueDistribution,
  Sector,
  SectorName,
} from "@server/prisma/prisma.client";
import { Radio, RadioGroup, Tooltip, Spinner } from "@nextui-org/react";
import { useState, useMemo } from "react";
import { CompanyTierData, FACTORY_CUSTOMER_LIMITS } from "@server/data/constants";
import CompanyInfo from "../../Company/CompanyInfo";
import ShareHolders from "../../Company/ShareHolders";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import CompanyPriorityList from "../../Company/CompanyPriorityOperatingRound";
import { Info } from "lucide-react";
import { OperationMechanicsVersion } from "@server/prisma/prisma.client";

// Consumption phase revenue data structure
interface ConsumptionRevenue {
  companyId: string;
  revenue: number;
  consumersReceived: number;
  factories: {
    id: string;
    size: string;
    profit: number;
    consumersReceived: number;
    maxConsumers: number;
  }[];
}

const DistributeSelectionV2 = ({
  company,
  consumptionRevenue,
  operatingRoundId,
}: {
  company: Company & { Sector: Sector };
  consumptionRevenue: ConsumptionRevenue;
  operatingRoundId: string;
}) => {
  const { authPlayer, gameId } = useGame();
  const [isSubmit, setIsSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<RevenueDistribution>(
    RevenueDistribution.DIVIDEND_FULL
  );

  const useVoteRevenueDistributionMutation =
    trpc.revenueDistributionVote.createRevenueDistributionVote.useMutation({
      onSettled: () => {
        setIsLoading(false);
        setIsSubmit(true);
      },
    });

  const handleSubmit = async () => {
    if (!authPlayer) {
      return;
    }
    setIsLoading(true);
    //submit vote
    useVoteRevenueDistributionMutation.mutate({
      operatingRoundId: operatingRoundId,
      productionResultId: 0, // This would need to be updated for consumption revenue
      playerId: authPlayer.id || "",
      companyId: company.id,
      revenueDistribution: selected,
      gameId,
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <RadioGroup
        orientation="horizontal"
        value={selected}
        onValueChange={(value) => setSelected(value as RevenueDistribution)}
      >
        <Radio value={RevenueDistribution.DIVIDEND_FULL}>Dividend Full</Radio>
        <Radio value={RevenueDistribution.DIVIDEND_FIFTY_FIFTY}>
          Dividend Half
        </Radio>
        <Radio value={RevenueDistribution.RETAINED}>Company Retains</Radio>
      </RadioGroup>
      {isSubmit ? (
        <div className="text-green-400 text-sm">Vote Submitted</div>
      ) : (
        <DebounceButton onClick={handleSubmit} isLoading={isLoading}>
          Submit Vote
        </DebounceButton>
      )}
    </div>
  );
};

const OperatingRoundRevenueVoteV2 = () => {
  const { gameId, currentPhase, currentTurn, gameState } = useGame();

  // Only render for modern operation mechanics
  if (gameState.operationMechanicsVersion !== OperationMechanicsVersion.MODERN) {
    return null;
  }

  // Get production data for current turn
  const { data: productionWithRelations, isLoading: productionLoading } = 
    trpc.factoryProduction.getGameTurnProduction.useQuery(
      {
        gameId: gameId || '',
        gameTurnId: currentTurn?.id || '',
      },
      { enabled: !!gameId && !!currentTurn?.id }
    );

  // Get companies with sectors
  const { data: companiesWithSector, isLoading: companiesLoading } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: {
        gameId: gameId || '',
        status: CompanyStatus.ACTIVE,
      },
    },
    { enabled: !!gameId }
    );

  // Transform production data into ConsumptionRevenue format
  const consumptionRevenueData = useMemo(() => {
    if (!productionWithRelations || !companiesWithSector) {
      return [];
    }

    // Group production records by company
    const companyRevenueMap = new Map<string, ConsumptionRevenue>();

    productionWithRelations.forEach((production: any) => {
      const factory = production.Factory;
      const company = production.Company;

      if (!factory || !company || production.customersServed === 0) {
        return;
      }

      const companyId = company.id;
      const maxCustomers = FACTORY_CUSTOMER_LIMITS[factory.size] || 0;

      if (!companyRevenueMap.has(companyId)) {
        companyRevenueMap.set(companyId, {
          companyId,
          revenue: 0,
          consumersReceived: 0,
          factories: [],
        });
      }

      const companyData = companyRevenueMap.get(companyId)!;
      companyData.revenue += production.profit || production.revenue || 0;
      companyData.consumersReceived += production.customersServed || 0;
      companyData.factories.push({
        id: factory.id,
        size: factory.size,
        profit: production.profit || production.revenue || 0,
        consumersReceived: production.customersServed || 0,
        maxConsumers: maxCustomers,
      });
    });

    return Array.from(companyRevenueMap.values());
  }, [productionWithRelations, companiesWithSector]);

  if (productionLoading || companiesLoading) {
    return (
      <div className="p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!consumptionRevenueData || consumptionRevenueData.length === 0) {
    return (
      <div className="p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Consumption Phase Revenue Vote</h1>
        <p className="text-gray-400 mb-4">
          Vote on how to distribute revenue earned from consumer consumption
        </p>
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No production data available for this turn.</p>
          <p className="text-gray-500 text-sm mt-2">
            Revenue will appear here after the consumption phase is resolved.
          </p>
        </div>
      </div>
    );
  }

  const operatingRoundId = currentPhase?.operatingRoundId || '';

  return (
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Consumption Phase Revenue Vote</h1>
      <p className="text-gray-400 mb-4">
        Vote on how to distribute revenue earned from consumer consumption
      </p>
      <div className="flex flex-col gap-4">
        {consumptionRevenueData.map((companyRevenue) => {
          // Find the actual company object
          const company = companiesWithSector?.find(c => c.id === companyRevenue.companyId);
          
          if (!company) {
            return null;
          }

          return (
            <div key={companyRevenue.companyId} className="flex flex-col bg-slate-800 p-4 rounded-lg shadow-md border border-gray-700">
              <div className="flex flex-col gap-2">
                <span className="text-lg font-semibold text-white">{company.name}</span>
                <span className="text-green-400 font-bold">Revenue: ${companyRevenue.revenue}</span>
                <span className="text-md my-2 text-gray-300">
                  Consumers Received: {companyRevenue.consumersReceived}
                </span>
                {/* Factory Breakdown */}
                <div className="space-y-2 mt-2">
                  <span className="text-sm font-medium text-gray-300">Factory Performance:</span>
                  {companyRevenue.factories.map((factory) => {
                    const capacityPercent = factory.maxConsumers > 0 
                      ? ((factory.consumersReceived / factory.maxConsumers) * 100).toFixed(0)
                      : '0';
                    const isFullCapacity = factory.consumersReceived === factory.maxConsumers;
                    
                    return (
                      <div key={factory.id} className="flex justify-between items-center bg-gray-800 rounded p-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-300">{factory.size.replace('_', ' ')}</span>
                          <span className="text-xs text-blue-400">{factory.consumersReceived}/{factory.maxConsumers} consumers</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-400 font-bold">${factory.profit}</span>
                          <span className={`text-xs ${isFullCapacity ? 'text-green-400' : 'text-gray-400'}`}>
                            {capacityPercent}% capacity
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Voting UI */}
                <div className="mt-4">
                  <DistributeSelectionV2
                    company={company as Company & { Sector: Sector }}
                    consumptionRevenue={companyRevenue}
                    operatingRoundId={operatingRoundId}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperatingRoundRevenueVoteV2; 