'use client';

import { trpc } from '@sectors/app/trpc';

interface Props {
  companyId: string;
  gameId: string;
}

export function WorkerAllocationDisplay({ companyId, gameId }: Props) {
  const { data: workforce, isLoading } = 
    trpc.modernOperations.getCompanyWorkforceStatus.useQuery({
      companyId,
      gameId,
    });

  if (isLoading) return <div className="text-gray-400">Loading worker data...</div>;
  if (!workforce) return null;

  const factoryPercentage = (workforce.factoryWorkers / workforce.totalWorkers) * 100;
  const marketingPercentage = (workforce.marketingWorkers / workforce.totalWorkers) * 100;
  const availablePercentage = (workforce.availableWorkers / workforce.totalWorkers) * 100;

  return (
    <div className="worker-allocation bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h4 className="font-bold text-white mb-3">Worker Allocation</h4>
      
      <div className="text-sm text-gray-300 mb-3">
        <span className="text-lg font-bold text-white">{workforce.availableWorkers}</span>
        {' / '}
        <span className="text-gray-400">{workforce.totalWorkers}</span>
        {' '}
        <span className="text-gray-500">available</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-10 bg-gray-900 rounded flex overflow-hidden border border-gray-700">
        {workforce.factoryWorkers > 0 && (
          <div 
            className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold transition-all duration-300"
            style={{ width: `${factoryPercentage}%` }}
            title={`${workforce.factoryWorkers} workers in factories`}
          >
            {factoryPercentage > 15 && `Factory: ${workforce.factoryWorkers}`}
          </div>
        )}
        {workforce.marketingWorkers > 0 && (
          <div 
            className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold transition-all duration-300"
            style={{ width: `${marketingPercentage}%` }}
            title={`${workforce.marketingWorkers} workers in marketing`}
          >
            {marketingPercentage > 15 && `Marketing: ${workforce.marketingWorkers}`}
          </div>
        )}
        {workforce.availableWorkers > 0 && (
          <div 
            className="bg-gray-600 flex items-center justify-center text-white text-xs font-semibold transition-all duration-300"
            style={{ width: `${availablePercentage}%` }}
            title={`${workforce.availableWorkers} unallocated workers`}
          >
            {availablePercentage > 15 && `Available: ${workforce.availableWorkers}`}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-gray-400">
            Factories ({workforce.factoryWorkers})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-400">
            Marketing ({workforce.marketingWorkers})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-600 rounded" />
          <span className="text-gray-400">
            Available ({workforce.availableWorkers})
          </span>
        </div>
      </div>
    </div>
  );
}

