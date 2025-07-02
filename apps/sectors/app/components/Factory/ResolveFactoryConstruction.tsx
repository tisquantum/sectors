import { mockFactoryConstructionResults } from './mockFactoryConstructionResults';
import { ResourceIcon } from './ResourceIcon';

export function ResolveFactoryConstructionPhase() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-200">Factory Construction Results</h2>
      {mockFactoryConstructionResults.map((result) => (
        <div
          key={result.id}
          className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow space-y-2"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold text-gray-100">{result.companyName}</div>
              <div className="text-sm text-gray-400">Player: {result.playerName}</div>
              <div className="text-sm text-gray-400">Factory Size: {result.factorySize.replace('FACTORY_', '')}</div>
            </div>
            <div className="text-lg font-bold text-orange-400">
              Total Cost: ${result.totalCost}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-300 font-medium mb-1">Schematic:</div>
            <div className="flex gap-4 flex-wrap">
              {result.resources.map((res, idx) => (
                <div key={res.type} className="flex items-center gap-2">
                  <ResourceIcon type={res.type} label={res.label} />
                  <span className="text-gray-400">${res.price}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-300 font-medium mb-1">Workers Assigned:</div>
            <div className="text-gray-200">{result.workersAssigned} worker(s) moved from track</div>
          </div>
        </div>
      ))}
    </div>
  );
} 