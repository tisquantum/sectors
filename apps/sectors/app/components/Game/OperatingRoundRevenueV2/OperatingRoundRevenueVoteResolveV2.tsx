'use client';

import { trpc } from "@sectors/app/trpc";
import { useGame } from "../GameContext";
import { RevenueDistribution, CompanyStatus, ShareLocation } from "@server/prisma/prisma.client";
import { Badge, Chip, Spinner } from "@nextui-org/react";
import CompanyInfo from "../../Company/CompanyInfo";
import { CompanyTierData, FACTORY_CUSTOMER_LIMITS } from "@server/data/constants";
import PlayerAvatar from "../../Player/PlayerAvatar";
import { OperationMechanicsVersion } from "@server/prisma/prisma.client";
import { useMemo } from "react";

interface FactoryPerformance {
  id: string;
  size: string;
  profit: number;
  consumersReceived: number;
  maxConsumers: number;
}

interface ConsumptionRevenue {
  companyId: string;
  revenue: number;
  consumersReceived: number;
  factories: FactoryPerformance[];
}

const OperatingRoundRevenueVoteResolveV2 = () => {
  const { currentPhase, gameState, playersWithShares, gameId, currentTurn } = useGame();
  
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
        status: { in: [CompanyStatus.ACTIVE, CompanyStatus.INSOLVENT] },
      },
    },
    { enabled: !!gameId }
    );

  // Get revenue distribution votes
  const { data: revenueDistributionVotes, isLoading: votesLoading } =
    trpc.revenueDistributionVote.listRevenueDistributionVotesWithRelations.useQuery(
      {
        where: {
          operatingRoundId: currentPhase?.operatingRoundId,
        },
        gameId: gameId || '',
      },
      { enabled: !!gameId && !!currentPhase?.operatingRoundId }
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

  // Get vote outcomes by company (determined by majority vote)
  const voteOutcomesByCompany = useMemo(() => {
    if (!revenueDistributionVotes || revenueDistributionVotes.length === 0) {
      return new Map<string, RevenueDistribution>();
    }

    const companyVoteMap = new Map<string, Map<RevenueDistribution, number>>();

    revenueDistributionVotes.forEach((vote: any) => {
      if (!companyVoteMap.has(vote.companyId)) {
        companyVoteMap.set(vote.companyId, new Map());
      }
      const voteCounts = companyVoteMap.get(vote.companyId)!;
      const currentCount = voteCounts.get(vote.revenueDistribution) || 0;
      voteCounts.set(vote.revenueDistribution, currentCount + (vote.weight || 1));
    });

    // Determine majority vote for each company
    const outcomes = new Map<string, RevenueDistribution>();
    companyVoteMap.forEach((voteCounts, companyId) => {
      let maxVotes = 0;
      let majorityVote: RevenueDistribution | null = null;
      
      voteCounts.forEach((count, distribution) => {
        if (count > maxVotes) {
          maxVotes = count;
          majorityVote = distribution;
        }
      });
      
      if (majorityVote) {
        outcomes.set(companyId, majorityVote);
      }
    });

    return outcomes;
  }, [revenueDistributionVotes]);

  if (productionLoading || companiesLoading || votesLoading) {
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
        <h1 className="text-2xl font-bold text-white mb-4">
          Consumption Phase Revenue Resolution
        </h1>
        <p className="text-gray-400 mb-6">
          Results of revenue distribution from consumer consumption
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

  const totalRevenue = consumptionRevenueData.reduce((sum, company) => sum + company.revenue, 0);
  const totalConsumers = consumptionRevenueData.reduce((sum, company) => sum + company.consumersReceived, 0);

  return (
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-white mb-4">
        Consumption Phase Revenue Resolution
      </h1>
      <p className="text-gray-400 mb-6">
        Results of revenue distribution from consumer consumption
      </p>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Total Consumers</h3>
          <p className="text-2xl font-bold text-blue-400">{totalConsumers}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Companies</h3>
          <p className="text-2xl font-bold text-purple-400">{consumptionRevenueData.length}</p>
        </div>
      </div>

      {/* Company Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white mb-4">Company Performance</h2>
        {consumptionRevenueData.map((companyRevenue) => {
          const company = companiesWithSector?.find(c => c.id === companyRevenue.companyId);
          if (!company) return null;

          const voteOutcome = voteOutcomesByCompany.get(companyRevenue.companyId) || RevenueDistribution.RETAINED;
          const revenue = companyRevenue.revenue;

          // Get shares for this company (only IPO shares are eligible for dividends)
          const companyShares = playersWithShares
            ?.flatMap(player => player.Share.filter(share => share.companyId === companyRevenue.companyId && share.location === ShareLocation.IPO))
            || [];
          
          const shareCount = companyShares.length;
          
          let dividendTotal = 0;
          let dividendPerShare = 0;
          let retained = 0;
          
          if (voteOutcome === RevenueDistribution.DIVIDEND_FULL) {
            dividendTotal = revenue;
            dividendPerShare = shareCount > 0 ? Math.floor(revenue / shareCount) : 0;
            retained = 0;
          } else if (voteOutcome === RevenueDistribution.DIVIDEND_FIFTY_FIFTY) {
            dividendTotal = Math.floor(revenue / 2);
            dividendPerShare = shareCount > 0 ? Math.floor(dividendTotal / shareCount) : 0;
            retained = revenue - dividendTotal;
          } else {
            dividendTotal = 0;
            dividendPerShare = 0;
            retained = revenue;
          }

          // Group shares by player to calculate per-player dividends
          const playerShareCounts = new Map<string, number>();
          companyShares.forEach(share => {
            if (share.playerId) {
              const currentCount = playerShareCounts.get(share.playerId) || 0;
              playerShareCounts.set(share.playerId, currentCount + 1);
            }
          });

          return (
            <div key={companyRevenue.companyId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                  <p className="text-gray-400">Revenue: ${companyRevenue.revenue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <Badge color="success" variant="flat">
                    {companyRevenue.consumersReceived} consumers
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Factory Performance:</h4>
                {companyRevenue.factories.map((factory) => {
                  const isFullCapacity = factory.consumersReceived === factory.maxConsumers;
                  
                  return (
                    <div key={factory.id} className="flex justify-between items-center bg-gray-700 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-300">{factory.size.replace('_', ' ')}</span>
                        <Badge color="primary" variant="flat" size="sm">
                          {factory.consumersReceived}/{factory.maxConsumers}
                        </Badge>
                      </div>
                      <span className={`text-sm font-medium ${isFullCapacity ? 'text-green-400' : 'text-gray-300'}`}>
                        ${factory.profit.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Vote Outcome and Money Division */}
              <div className="mt-4 p-3 rounded bg-gray-900 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-300 font-semibold">Vote Outcome:</span>
                  <Badge color={voteOutcome === RevenueDistribution.DIVIDEND_FULL ? 'success' : voteOutcome === RevenueDistribution.DIVIDEND_FIFTY_FIFTY ? 'warning' : 'default'} variant="flat">
                    {voteOutcome === RevenueDistribution.DIVIDEND_FULL && 'Full Dividend'}
                    {voteOutcome === RevenueDistribution.DIVIDEND_FIFTY_FIFTY && 'Half Dividend'}
                    {voteOutcome === RevenueDistribution.RETAINED && 'Retained'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-300">Shareholders: <span className="font-bold text-blue-400">{shareCount}</span></div>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="text-sm text-green-400">Dividends Paid: <span className="font-bold">${dividendTotal.toLocaleString()}</span> {dividendTotal > 0 && shareCount > 0 && <span className="text-xs text-gray-400">(${dividendPerShare}/share)</span>}</div>
                  <div className="text-sm text-yellow-400">Retained by Company: <span className="font-bold">${retained.toLocaleString()}</span></div>
                </div>
                {/* Shareholder breakdown */}
                {dividendTotal > 0 && shareCount > 0 && (
                  <div className="flex flex-row gap-4 mt-4">
                    {Array.from(playerShareCounts.entries()).map(([playerId, shares]) => {
                      const player = playersWithShares?.find(p => p.id === playerId);
                      if (!player || shares === 0) return null;
                      
                      const playerDividend = shares * dividendPerShare;
                      return (
                        <PlayerAvatar
                          key={playerId}
                          player={player}
                          badgeContent={`$${playerDividend.toLocaleString()}`}
                          size="sm"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperatingRoundRevenueVoteResolveV2; 