"use client";

import { useGame } from "../../../GameContext";
import { trpc } from "@sectors/app/trpc";
import { Spinner, Card, CardBody } from "@nextui-org/react";
import { RiMoneyDollarCircleFill, RiTrophyFill, RiUserFill } from "@remixicon/react";

/**
 * Component to display sector demand ranking and worker salaries
 * Shows which sectors pay how much per worker based on their demand ranking
 */
export function SectorWorkerSalaries() {
  const { gameId } = useGame();

  // Get all sectors with their demand data
  const { data: sectors, isLoading } = trpc.sector.listSectors.useQuery({
    where: { gameId },
    orderBy: { demand: "desc" },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!sectors || sectors.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        No sectors found
      </div>
    );
  }

  // Calculate effective demand and sort sectors
  const sectorsWithEffectiveDemand = sectors.map((sector) => ({
    ...sector,
    effectiveDemand: (sector.demand || 0) + (sector.demandBonus || 0),
  }));

  // Sort by effective demand (descending)
  const sortedSectors = [...sectorsWithEffectiveDemand].sort(
    (a, b) => b.effectiveDemand - a.effectiveDemand
  );

  // Calculate worker salary for each sector based on ranking
  const sectorsWithSalaries = sortedSectors.map((sector, index) => {
    let salary: number;
    if (index === 0) {
      salary = 8; // Highest demand: $8
    } else if (index === 1) {
      salary = 4; // Second highest: $4
    } else {
      salary = 2; // Third and below: $2
    }
    return {
      ...sector,
      rank: index + 1,
      workerSalary: salary,
    };
  });

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Sector Demand Ranking & Worker Salaries
        </h3>
        <p className="text-sm text-gray-400">
          Worker salaries are determined by sector demand ranking. Higher demand sectors pay more per worker.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectorsWithSalaries.map((sector) => (
          <Card
            key={sector.id}
            className={`${
              sector.rank === 1
                ? "border-yellow-500 bg-yellow-500/10"
                : sector.rank === 2
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-600 bg-gray-700/30"
            }`}
          >
            <CardBody className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {sector.rank === 1 && (
                    <RiTrophyFill className="text-yellow-400" size={20} />
                  )}
                  {sector.rank === 2 && (
                    <RiTrophyFill className="text-blue-400" size={20} />
                  )}
                  <span className="text-lg font-bold text-white">
                    #{sector.rank}
                  </span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 font-semibold">
                    <RiMoneyDollarCircleFill size={16} />
                    <span>${sector.workerSalary}/worker</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-400">Sector</div>
                  <div className="text-white font-medium">
                    {sector.name || sector.sectorName}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Effective Demand</div>
                  <div className="flex items-center gap-1">
                    <RiUserFill size={14} className="text-gray-400" />
                    <span className="text-white font-medium">
                      {sector.effectiveDemand}
                    </span>
                  </div>
                </div>

                {sector.demandBonus && sector.demandBonus > 0 && (
                  <div className="text-xs text-gray-500">
                    (Base: {sector.demand || 0} + Bonus: {sector.demandBonus})
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="text-sm text-gray-400 space-y-1">
          <div>
            <strong className="text-gray-300">Salary Rules:</strong>
          </div>
          <div>• Rank #1 (Highest Demand): $8 per worker</div>
          <div>• Rank #2: $4 per worker</div>
          <div>• Rank #3+: $2 per worker</div>
          <div className="mt-2 text-xs text-gray-500">
            Salaries are recalculated each turn based on sector demand ranking
            during the Earnings Call phase.
          </div>
        </div>
      </div>
    </div>
  );
}

