'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { CompanyPerformanceProps, Company } from './types';

export function CompanyPerformance({ companies }: CompanyPerformanceProps) {
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
                  {company.factories.map((factory) => (
                    <div key={factory.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          {factory.size.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-green-400 font-bold">
                          ${factory.profit}
                        </span>
                      </div>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 