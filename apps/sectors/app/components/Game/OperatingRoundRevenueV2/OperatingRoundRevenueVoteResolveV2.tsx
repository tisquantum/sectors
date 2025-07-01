'use client';

import { trpc } from "@sectors/app/trpc";
import { useGame } from "../GameContext";
import { RevenueDistribution } from "@server/prisma/prisma.client";
import { Badge, Chip } from "@nextui-org/react";
import CompanyInfo from "../../Company/CompanyInfo";
import { CompanyTierData } from "@server/data/constants";
import PlayerAvatar from "../../Player/PlayerAvatar";
import { OperationMechanicsVersion } from "@server/prisma/prisma.client";

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

const mockConsumptionRevenue: ConsumptionRevenue[] = [
  {
    companyId: '1',
    revenue: 850,
    consumersReceived: 12,
    factories: [
      {
        id: 'f1',
        size: 'FACTORY_I',
        profit: 250,
        consumersReceived: 4,
        maxConsumers: 5
      },
      {
        id: 'f2',
        size: 'FACTORY_II',
        profit: 350,
        consumersReceived: 3,
        maxConsumers: 3
      },
      {
        id: 'f3',
        size: 'FACTORY_I',
        profit: 250,
        consumersReceived: 5,
        maxConsumers: 5
      }
    ]
  },
  {
    companyId: '2',
    revenue: 720,
    consumersReceived: 8,
    factories: [
      {
        id: 'f4',
        size: 'FACTORY_I',
        profit: 320,
        consumersReceived: 4,
        maxConsumers: 4
      },
      {
        id: 'f5',
        size: 'FACTORY_II',
        profit: 400,
        consumersReceived: 4,
        maxConsumers: 4
      }
    ]
  },
  {
    companyId: '3',
    revenue: 680,
    consumersReceived: 6,
    factories: [
      {
        id: 'f6',
        size: 'FACTORY_I',
        profit: 280,
        consumersReceived: 3,
        maxConsumers: 4
      },
      {
        id: 'f7',
        size: 'FACTORY_III',
        profit: 400,
        consumersReceived: 3,
        maxConsumers: 3
      }
    ]
  },
  {
    companyId: '4',
    revenue: 920,
    consumersReceived: 10,
    factories: [
      {
        id: 'f8',
        size: 'FACTORY_II',
        profit: 420,
        consumersReceived: 4,
        maxConsumers: 4
      },
      {
        id: 'f9',
        size: 'FACTORY_II',
        profit: 500,
        consumersReceived: 6,
        maxConsumers: 6
      }
    ]
  },
  {
    companyId: '5',
    revenue: 550,
    consumersReceived: 7,
    factories: [
      {
        id: 'f10',
        size: 'FACTORY_I',
        profit: 200,
        consumersReceived: 3,
        maxConsumers: 4
      },
      {
        id: 'f11',
        size: 'FACTORY_I',
        profit: 350,
        consumersReceived: 4,
        maxConsumers: 4
      }
    ]
  }
];

// Mock vote outcomes and share counts for demonstration
const mockVoteOutcomes = [
  RevenueDistribution.DIVIDEND_FULL,
  RevenueDistribution.DIVIDEND_FIFTY_FIFTY,
  RevenueDistribution.RETAINED,
  RevenueDistribution.DIVIDEND_FULL,
  RevenueDistribution.DIVIDEND_FIFTY_FIFTY,
];
const mockShareCounts = [10, 8, 12, 6, 15];

// Mock players and share assignments
const mockPlayers = [
  { id: 'p1', nickname: 'Alice' },
  { id: 'p2', nickname: 'Bob' },
  { id: 'p3', nickname: 'Carol' },
  { id: 'p4', nickname: 'Dave' },
];
// For each company, assign shares to players (mock)
const mockPlayerShares = [
  [5, 3, 2, 0], // Company 1: Alice 5, Bob 3, Carol 2, Dave 0
  [2, 2, 2, 2], // Company 2: all 2
  [0, 6, 6, 0], // Company 3: Bob 6, Carol 6
  [3, 1, 1, 1], // Company 4: Alice 3, Bob 1, Carol 1, Dave 1
  [4, 4, 4, 3], // Company 5: Alice 4, Bob 4, Carol 4, Dave 3
];

const OperatingRoundRevenueVoteResolveV2 = () => {
  const { currentPhase, gameState, playersWithShares } = useGame();
  
  // Only render for modern operation mechanics
  if (gameState.operationMechanicsVersion !== OperationMechanicsVersion.MODERN) {
    return null;
  }

  const totalRevenue = mockConsumptionRevenue.reduce((sum, company) => sum + company.revenue, 0);
  const totalConsumers = mockConsumptionRevenue.reduce((sum, company) => sum + company.consumersReceived, 0);

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
          <p className="text-2xl font-bold text-purple-400">{mockConsumptionRevenue.length}</p>
        </div>
      </div>

      {/* Company Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white mb-4">Company Performance</h2>
        {mockConsumptionRevenue.map((company, idx) => {
          const voteOutcome = mockVoteOutcomes[idx % mockVoteOutcomes.length];
          const shareCount = mockShareCounts[idx % mockShareCounts.length];
          const revenue = company.revenue;
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
          return (
            <div key={company.companyId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Company {company.companyId}</h3>
                  <p className="text-gray-400">Revenue: ${company.revenue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <Badge color="success" variant="flat">
                    {company.consumersReceived} consumers
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Factory Performance:</h4>
                {company.factories.map((factory) => (
                  <div key={factory.id} className="flex justify-between items-center bg-gray-700 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-300">{factory.size}</span>
                      <Badge color="primary" variant="flat" size="sm">
                        {factory.consumersReceived}/{factory.maxConsumers}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-green-400">
                      ${factory.profit.toLocaleString()}
                    </span>
                  </div>
                ))}
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
                  <div className="text-sm text-green-400">Dividends Paid: <span className="font-bold">${dividendTotal}</span> {dividendTotal > 0 && <span className="text-xs text-gray-400">(${dividendPerShare}/share)</span>}</div>
                  <div className="text-sm text-yellow-400">Retained by Company: <span className="font-bold">${retained}</span></div>
                </div>
                {/* Shareholder breakdown */}
                {dividendTotal > 0 && (
                  <div className="flex flex-row gap-4 mt-4">
                    {mockPlayers.map((player, pIdx) => {
                      const shares = mockPlayerShares[idx % mockPlayerShares.length][pIdx];
                      if (shares === 0) return null;
                      return (
                        <PlayerAvatar
                          key={player.id}
                          player={player as any}
                          badgeContent={"$" + (shares * dividendPerShare)}
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