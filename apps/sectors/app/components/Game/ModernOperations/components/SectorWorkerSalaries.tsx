"use client";

import { trpc } from "@sectors/app/trpc";
import { Spinner, Card, CardBody } from "@nextui-org/react";
import { RiMoneyDollarCircleFill, RiUserFill } from "@remixicon/react";
import { useGame } from "../../GameContext";

/** Worker salary from sector demand: >=4 → $8, >=3 → $6, >=2 → $4, >=1 → $2, >=0 → $1 */
function getSalaryForDemand(demand: number): number {
  if (demand >= 4) return 8;
  if (demand >= 3) return 6;
  if (demand >= 2) return 4;
  if (demand >= 1) return 2;
  return 1;
}

/**
 * Component to display sector demand and worker salaries
 * Salaries are determined purely by each sector's demand (research slot + active marketing bonuses), not by ranking.
 */
export function SectorWorkerSalaries() {
  const { gameId } = useGame();

  const { data: sectors, isLoading: sectorsLoading } = trpc.sector.listSectors.useQuery({
    where: { gameId },
  });

  if (sectorsLoading) {
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

  const sectorsWithSalaries = sectors.map((sector) => {
    const demand = sector.demand ?? 0;
    return {
      ...sector,
      demand,
      workerSalary: getSalaryForDemand(demand),
    };
  });

  // Sort by demand descending, then by sector name
  sectorsWithSalaries.sort((a, b) => {
    if (a.demand !== b.demand) return b.demand - a.demand;
    return (a.name || a.sectorName).localeCompare(b.name || b.sectorName);
  });

  const cardBorderClass = (salary: number) => {
    if (salary >= 8) return "border-yellow-500 bg-yellow-500/10";
    if (salary >= 6) return "border-amber-500 bg-amber-500/10";
    if (salary >= 4) return "border-blue-500 bg-blue-500/10";
    if (salary >= 2) return "border-gray-500 bg-gray-700/30";
    return "border-gray-600 bg-gray-700/30";
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Sector Demand & Worker Salaries
        </h3>
        <p className="text-sm text-gray-400">
          Worker salaries are determined purely by each sector&apos;s demand (research slot bonus + active marketing demand bonuses). Higher demand means higher pay.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectorsWithSalaries.map((sector) => (
          <Card
            key={sector.id}
            className={cardBorderClass(sector.workerSalary)}
          >
            <CardBody className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <RiUserFill size={18} className="text-gray-400" />
                  <span className="text-lg font-bold text-white">
                    Demand {sector.demand}
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

                {sector.demand === 0 && (
                  <div className="text-xs text-gray-500">
                    No sector demand (research + active marketing bonuses)
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
            <strong className="text-gray-300">Salary by sector demand:</strong>
          </div>
          <div>• Demand ≥ 4: $8 per worker</div>
          <div>• Demand ≥ 3: $6 per worker</div>
          <div>• Demand ≥ 2: $4 per worker</div>
          <div>• Demand ≥ 1: $2 per worker</div>
          <div>• Demand ≥ 0: $1 per worker</div>
          <div className="mt-2 text-xs text-gray-500">
            Salaries are recalculated each turn from sector demand during the Earnings Call phase.
          </div>
        </div>
      </div>
    </div>
  );
}

