'use client';

import { useGame } from './GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { FactorySize, SectorName } from '@server/prisma/prisma.client';

interface FactoryEarnings {
  id: string;
  size: FactorySize;
  workers: number;
  consumersReceived: number;
  maxConsumers: number;
  grossProfit: number;
  operatingExpense: number;
  netProfit: number;
}

interface CompanyEarnings {
  id: string;
  name: string;
  sector: SectorName;
  brandScore: number;
  factories: FactoryEarnings[];
  totalGrossProfit: number;
  totalOperatingExpense: number;
  totalNetProfit: number;
}

// Mock data for demonstration - this would come from the backend
const mockEarningsData: CompanyEarnings[] = [
  {
    id: '1',
    name: 'TechCorp',
    sector: SectorName.TECHNOLOGY,
    brandScore: 85,
    factories: [
      {
        id: 'f1',
        size: FactorySize.FACTORY_I,
        workers: 1,
        consumersReceived: 3,
        maxConsumers: 5,
        grossProfit: 150,
        operatingExpense: 45, // (worker track score * workers) + sector demand
        netProfit: 105,
      },
      {
        id: 'f2',
        size: FactorySize.FACTORY_II,
        workers: 2,
        consumersReceived: 2,
        maxConsumers: 3,
        grossProfit: 200,
        operatingExpense: 90, // (worker track score * workers) + sector demand
        netProfit: 110,
      },
    ],
    totalGrossProfit: 350,
    totalOperatingExpense: 135,
    totalNetProfit: 215,
  },
  {
    id: '2',
    name: 'HealthTech',
    sector: SectorName.HEALTHCARE,
    brandScore: 92,
    factories: [
      {
        id: 'f3',
        size: FactorySize.FACTORY_I,
        workers: 1,
        consumersReceived: 4,
        maxConsumers: 4,
        grossProfit: 180,
        operatingExpense: 50, // (worker track score * workers) + sector demand
        netProfit: 130,
      },
      {
        id: 'f4',
        size: FactorySize.FACTORY_II,
        workers: 2,
        consumersReceived: 1,
        maxConsumers: 2,
        grossProfit: 250,
        operatingExpense: 100, // (worker track score * workers) + sector demand
        netProfit: 150,
      },
    ],
    totalGrossProfit: 430,
    totalOperatingExpense: 150,
    totalNetProfit: 280,
  },
  {
    id: '3',
    name: 'FlexiTech',
    sector: SectorName.TECHNOLOGY,
    brandScore: 78,
    factories: [
      {
        id: 'f5',
        size: FactorySize.FACTORY_I,
        workers: 1,
        consumersReceived: 2,
        maxConsumers: 2,
        grossProfit: 100,
        operatingExpense: 40, // (worker track score * workers) + sector demand
        netProfit: 60,
      },
    ],
    totalGrossProfit: 100,
    totalOperatingExpense: 40,
    totalNetProfit: 60,
  },
];

export function EarningsCall() {
  const { gameState } = useGame();

  // Calculate summary statistics
  const totalGrossProfit = mockEarningsData.reduce((sum, company) => sum + company.totalGrossProfit, 0);
  const totalOperatingExpense = mockEarningsData.reduce((sum, company) => sum + company.totalOperatingExpense, 0);
  const totalNetProfit = mockEarningsData.reduce((sum, company) => sum + company.totalNetProfit, 0);
  const totalConsumers = mockEarningsData.reduce((sum, company) => 
    sum + company.factories.reduce((factorySum, factory) => factorySum + factory.consumersReceived, 0), 0
  );

  // Sort companies by net profit
  const sortedCompanies = [...mockEarningsData].sort((a, b) => b.totalNetProfit - a.totalNetProfit);

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
              <div className="text-2xl font-bold text-green-400">${totalNetProfit.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Net Profit</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">${totalGrossProfit.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Gross Profit</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">${totalOperatingExpense.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Operating Expense</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{totalConsumers}</div>
              <div className="text-sm text-gray-400">Total Consumers Served</div>
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
                  <div className="text-2xl font-bold text-green-400">${company.totalNetProfit.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    Gross: ${company.totalGrossProfit.toLocaleString()} | 
                    Expenses: ${company.totalOperatingExpense.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Factory Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300">Factory Performance</h4>
                  {company.factories.map((factory) => (
                    <div key={factory.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-300">
                            {factory.size.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {factory.workers} worker{factory.workers !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">${factory.netProfit.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            Net Profit
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-gray-600 rounded p-2">
                          <div className="text-gray-400">Gross Profit</div>
                          <div className="text-blue-400 font-semibold">${factory.grossProfit.toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <div className="text-gray-400">Operating Expense</div>
                          <div className="text-red-400 font-semibold">${factory.operatingExpense.toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <div className="text-gray-400">Consumers</div>
                          <div className="text-purple-400 font-semibold">
                            {factory.consumersReceived}/{factory.maxConsumers}
                          </div>
                        </div>
                      </div>

                      {/* Operating Expense Breakdown */}
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="text-xs text-gray-400 mb-1">Operating Expense Breakdown:</div>
                        <div className="text-xs text-gray-500">
                          Worker Salary: ${Math.floor(factory.operatingExpense * 0.7).toLocaleString()} 
                          (Worker Track Score × {factory.workers} workers)
                        </div>
                        <div className="text-xs text-gray-500">
                          Sector Demand Cost: ${Math.floor(factory.operatingExpense * 0.3).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Company Summary */}
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-400">Total Gross Profit</div>
                      <div className="text-lg font-bold text-blue-400">${company.totalGrossProfit.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Total Operating Expense</div>
                      <div className="text-lg font-bold text-red-400">${company.totalOperatingExpense.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Net Profit Margin</div>
                      <div className="text-lg font-bold text-green-400">
                        {((company.totalNetProfit / company.totalGrossProfit) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operating Expense Formula Explanation */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Operating Expense Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong>Formula:</strong> Operating Expense = (Worker Track Score × Factory Workers) + Sector Demand
            </p>
            <p>
              <strong>Worker Track Score:</strong> Current economy score that determines worker salary rates
            </p>
            <p>
              <strong>Sector Demand:</strong> Additional cost based on sector consumer demand and resource prices
            </p>
            <p className="text-gray-400 text-xs">
              Note: This is a simplified calculation. In the actual game, the worker track score and sector demand 
              are calculated based on the current game state and resource economy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 