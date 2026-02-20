"use client";

import { trpc } from "@sectors/app/trpc";
import { Spinner, Card, CardBody, Chip } from "@nextui-org/react";
import { RiTrophyFill, RiHandCoinFill, RiInformationLine } from "@remixicon/react";
import { useGame } from "./GameContext";
import { useMemo } from "react";
import { sectorColors } from "@server/data/gameData";

/**
 * Component to display sector demand rankings breakdown
 * Shows how sector demand is calculated and how it affects consumer distribution
 */
export function SectorDemandRankings() {
  const { gameId, gameState } = useGame();

  // Get sector demand rankings (based on sector demand: brand score + research slot bonus)
  const { data: sectorDemandRankings, isLoading: rankingsLoading } = trpc.modernOperations.getSectorDemandRankings.useQuery({
    gameId: gameId || "",
  }, {
    enabled: !!gameId,
  });

  // Get all sectors for display
  const { data: sectors, isLoading: sectorsLoading } = trpc.sector.listSectors.useQuery({
    where: { gameId: gameId || "" },
  }, {
    enabled: !!gameId,
  });

  const isLoading = rankingsLoading || sectorsLoading;

  // Group sectors by rank to show ties
  const sectorsByRank = useMemo(() => {
    if (!sectorDemandRankings || !sectors) return new Map();
    
    const grouped = new Map<number, typeof sectorDemandRankings>();
    for (const ranking of sectorDemandRankings) {
      if (!grouped.has(ranking.rank)) {
        grouped.set(ranking.rank, []);
      }
      grouped.get(ranking.rank)!.push(ranking);
    }
    return grouped;
  }, [sectorDemandRankings, sectors]);

  // Calculate consumer distribution percentages
  const distributionBreakdown = useMemo(() => {
    if (!sectorsByRank || !gameState?.economyScore) return [];
    
    const rankPercentages = [0.5, 0.3, 0.2]; // 1st: 50%, 2nd: 30%, 3rd: 20%
    const breakdown: Array<{
      rank: number;
      sectors: NonNullable<typeof sectorDemandRankings>;
      percentage: number;
      consumersPerSector: number;
      totalConsumers: number;
    }> = [];
    
    for (let rank = 1; rank <= 3; rank++) {
      const sectorsAtRank = sectorsByRank.get(rank);
      if (!sectorsAtRank || sectorsAtRank.length === 0) continue;
      
      const basePercentage = rankPercentages[rank - 1];
      const percentagePerSector = basePercentage / sectorsAtRank.length;
      const consumersPerSector = Math.floor(gameState.economyScore * percentagePerSector);
      const totalConsumers = consumersPerSector * sectorsAtRank.length;
      
      breakdown.push({
        rank,
        sectors: sectorsAtRank,
        percentage: basePercentage,
        consumersPerSector,
        totalConsumers,
      });
    }
    
    return breakdown;
  }, [sectorsByRank, gameState?.economyScore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!sectorDemandRankings || sectorDemandRankings.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        No sector demand rankings available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Explanation Section */}
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardBody className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <RiInformationLine size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Sector Demand & Consumer Distribution</h3>
          </div>
          <div className="text-sm text-gray-300 space-y-3">
            <div>
              <strong className="text-white">How Sector Demand Works:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li>Sector demand = <strong>brand score</strong> (sum of companies&apos; brand scores in the sector, from marketing) + <strong>research slot bonus</strong></li>
                <li>Research Slot 3: +1 bonus, Slot 6: +2, Slot 9: +3, Slot 12: +4</li>
                <li>Higher sector demand = higher ranking = more consumers distributed</li>
              </ul>
            </div>
            <div>
              <strong className="text-white">Consumer Distribution (50/30/20 Split):</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li><strong>1st Place:</strong> Receives 50% of Economy Score</li>
                <li><strong>2nd Place:</strong> Receives 30% of Economy Score</li>
                <li><strong>3rd Place:</strong> Receives 20% of Economy Score</li>
                <li><strong>Ties:</strong> If sectors share the same rank, they split the percentage evenly (e.g., 3 sectors tied for 1st = 16.67% each)</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Rankings Display */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Current Rankings & Distribution</h4>
        {distributionBreakdown.map((breakdown) => {
          const rankLabel = breakdown.rank === 1 ? "1st" : breakdown.rank === 2 ? "2nd" : "3rd";
          const isTied = breakdown.sectors.length > 1;
          
          return (
            <Card
              key={breakdown.rank}
              className={`${
                breakdown.rank === 1
                  ? "border-yellow-500 bg-yellow-500/10"
                  : breakdown.rank === 2
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-600 bg-gray-700/30"
              }`}
            >
              <CardBody className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {breakdown.rank === 1 && (
                      <RiTrophyFill className="text-yellow-400" size={20} />
                    )}
                    {breakdown.rank === 2 && (
                      <RiTrophyFill className="text-blue-400" size={20} />
                    )}
                    <Chip
                      color={
                        breakdown.rank === 1
                          ? "warning"
                          : breakdown.rank === 2
                          ? "secondary"
                          : "default"
                      }
                      size="sm"
                    >
                      {rankLabel} Place{isTied ? " (Tied)" : ""}
                    </Chip>
                    <span className="text-sm text-gray-400">
                      {breakdown.sectors.length} sector{breakdown.sectors.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Total Consumers</div>
                    <div className="text-lg font-bold text-white">
                      {breakdown.totalConsumers}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {breakdown.sectors.map((sectorRanking) => {
                    const sector = sectors?.find(s => s.id === sectorRanking.sectorId);
                    const sectorColor = sector ? sectorColors[sector.name] : "#gray";
                    
                    return (
                      <div
                        key={sectorRanking.sectorId}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: sectorColor }}
                          />
                          <span className="text-white font-medium">
                            {sectorRanking.sectorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <RiHandCoinFill size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-300">
                              Demand: {sectorRanking.demand}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-400">
                              {((breakdown.percentage / breakdown.sectors.length) * 100).toFixed(1)}%
                            </span>
                            <span className="text-white font-semibold ml-1">
                              ({breakdown.consumersPerSector} consumers)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {gameState?.economyScore && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 space-y-1">
            <div>
              <strong className="text-gray-300">Economy Score:</strong> {gameState.economyScore}
            </div>
            <div>
              <strong className="text-gray-300">Total Consumers Distributed:</strong>{" "}
              {distributionBreakdown.reduce((sum, b) => sum + b.totalConsumers, 0)} / {gameState.economyScore}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Note: Consumer distribution happens during the Consumption Phase. Sectors also receive bonus consumers equal to their sector demand value (outside the economy score distribution).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
