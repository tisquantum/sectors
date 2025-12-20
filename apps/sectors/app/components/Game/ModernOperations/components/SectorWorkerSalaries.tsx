"use client";

import { trpc } from "@sectors/app/trpc";
import { Spinner, Card, CardBody } from "@nextui-org/react";
import { RiMoneyDollarCircleFill, RiTrophyFill, RiUserFill } from "@remixicon/react";
import { useGame } from "../../GameContext";
import { useMemo } from "react";

/**
 * Component to display Forecast ranking and worker salaries
 * Shows which sectors pay how much per worker based on Forecast rankings (1st, 2nd, 3rd)
 */
export function SectorWorkerSalaries() {
  const { gameId } = useGame();

  // Get Forecast rankings
  const { data: forecastRankings, isLoading: rankingsLoading } = trpc.forecast.getRankings.useQuery({
    gameId,
  });

  // Get all sectors for display
  const { data: sectors, isLoading: sectorsLoading } = trpc.sector.listSectors.useQuery({
    where: { gameId },
  });

  // Create map of sectorId -> ranking (must be before early returns)
  const rankingMap = useMemo(() => {
    const map = new Map<string, { rank: number; demandCounters: number }>();
    forecastRankings?.forEach((ranking) => {
      map.set(ranking.sectorId, {
        rank: ranking.rank,
        demandCounters: ranking.demandCounters,
      });
    });
    return map;
  }, [forecastRankings]);

  const isLoading = rankingsLoading || sectorsLoading;

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

  // Calculate worker salary for each sector based on Forecast ranking
  const sectorsWithSalaries = sectors.map((sector) => {
    const ranking = rankingMap.get(sector.id);
    let salary: number;
    let rank: number;
    let demandCounters: number;

    if (ranking) {
      rank = ranking.rank;
      demandCounters = ranking.demandCounters;
      if (rank === 1) {
        salary = 8; // 1st place: $8
      } else if (rank === 2) {
        salary = 4; // 2nd place: $4
      } else {
        salary = 2; // 3rd and below: $2
      }
    } else {
      // No forecast commitments for this sector
      rank = sectors.length; // Last place
      demandCounters = 0;
      salary = 2; // Default: $2
    }

    return {
      ...sector,
      rank,
      workerSalary: salary,
      demandCounters,
    };
  });

  // Sort by rank (1st, 2nd, 3rd, then unranked)
  sectorsWithSalaries.sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    // If same rank, sort by sector name
    return (a.name || a.sectorName).localeCompare(b.name || b.sectorName);
  });

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Forecast Ranking & Worker Salaries
        </h3>
        <p className="text-sm text-gray-400">
          Worker salaries are determined by Forecast rankings (based on share commitments to forecast quarters). 1st place pays $8/worker, 2nd pays $4/worker, 3rd+ pays $2/worker.
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
                  <div className="text-sm text-gray-400">Forecast Demand Counters</div>
                  <div className="flex items-center gap-1">
                    <RiUserFill size={14} className="text-gray-400" />
                    <span className="text-white font-medium">
                      {sector.demandCounters || 0}
                    </span>
                  </div>
                </div>

                {!sector.demandCounters && (
                  <div className="text-xs text-gray-500">
                    No forecast commitments
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
          <div>• Rank #1 (Highest Forecast Demand Counters): $8 per worker</div>
          <div>• Rank #2: $4 per worker</div>
          <div>• Rank #3+: $2 per worker</div>
          <div className="mt-2 text-xs text-gray-500">
            Salaries are recalculated each turn based on Forecast rankings
            (from share commitments to forecast quarters) during the Earnings Call phase.
          </div>
        </div>
      </div>
    </div>
  );
}

