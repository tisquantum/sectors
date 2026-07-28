"use client";

import { useMemo } from "react";
import { RiArrowDownSFill, RiArrowUpSFill, RiGroupFill } from "@remixicon/react";
import type { Sector } from "@server/prisma/prisma.client";
import type { CompanyWithRelations } from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";

/** Share of the economy score handed to the 1st, 2nd and 3rd ranked sectors. */
const RANK_SHARE = [0.5, 0.3, 0.2];

export interface SectorInflow {
  /** Demand rank; 1st takes 50% of the economy score, 2nd 30%, 3rd 20%. */
  rank: number;
  demand: number;
  /** This sector's slice of the economy score once ties are split. */
  share: number;
  fromEconomy: number;
  /** Guaranteed consumers equal to sector demand, outside the split. */
  bonus: number;
  incoming: number;
  /** Pick order used for remainders; 1 is first. */
  priority: number;
  /** Where the priority order will land next time it is recalculated. */
  nextPriority: number;
}

/**
 * What each sector is due to receive at the end of the turn, and where it sits
 * in the pick order — mirroring the server's distribution so the board can show
 * the arrival before it happens.
 */
export function useSectorInflow(
  companies: CompanyWithRelations[]
): Map<string, SectorInflow> {
  const { gameId, gameState } = useGame();

  const { data: rankings } =
    trpc.modernOperations.getSectorDemandRankings.useQuery(
      { gameId },
      { enabled: !!gameId }
    );

  return useMemo(() => {
    const inflow = new Map<string, SectorInflow>();
    const sectors = gameState.sectors ?? [];
    if (sectors.length === 0) return inflow;

    const demandOf = (sector: Sector) =>
      (sector.demand ?? 0) + (sector.demandBonus ?? 0);

    // Prefer the server's ranking; fall back to ranking by demand ourselves.
    const rankBySector = new Map<string, number>();
    if (rankings && rankings.length > 0) {
      for (const ranking of rankings) {
        rankBySector.set(ranking.sectorId, ranking.rank);
      }
    } else {
      const sorted = [...sectors].sort((a, b) => demandOf(b) - demandOf(a));
      let rank = 1;
      sorted.forEach((sector, index) => {
        if (index > 0 && demandOf(sorted[index - 1]) !== demandOf(sector)) {
          rank++;
        }
        rankBySector.set(sector.id, rank);
      });
    }

    const priorityBySector = new Map<string, number>();
    for (const entry of gameState.sectorPriority ?? []) {
      priorityBySector.set(entry.sectorId, entry.priority);
    }
    const pickOrder = [...sectors].sort(
      (a, b) =>
        (priorityBySector.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (priorityBySector.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );

    // Priority is a catch-up order: least demanded sector picks first, then the
    // cheaper sector by average share price, then the one with fewer companies.
    const statsOf = (sectorId: string) => {
      const inSector = companies.filter(
        (company) => company.sectorId === sectorId
      );
      const total = inSector.reduce(
        (sum, company) => sum + (company.currentStockPrice ?? 0),
        0
      );
      return {
        count: inSector.length,
        average: inSector.length > 0 ? total / inSector.length : 0,
      };
    };
    const nextPriority = new Map<string, number>();
    [...sectors]
      .sort((a, b) => {
        if ((a.demand ?? 0) !== (b.demand ?? 0)) {
          return (a.demand ?? 0) - (b.demand ?? 0);
        }
        const statsA = statsOf(a.id);
        const statsB = statsOf(b.id);
        if (statsA.average !== statsB.average) {
          return statsA.average - statsB.average;
        }
        if (statsA.count !== statsB.count) return statsA.count - statsB.count;
        return a.id.localeCompare(b.id);
      })
      .forEach((sector, index) => nextPriority.set(sector.id, index + 1));

    const economyScore = gameState.economyScore ?? 0;
    const pool = gameState.consumerPoolNumber ?? 0;
    const toDistribute = Math.min(economyScore, pool);

    const sectorsAtRank = new Map<number, Sector[]>();
    for (const sector of sectors) {
      const rank = rankBySector.get(sector.id) ?? 1;
      const bucket = sectorsAtRank.get(rank);
      if (bucket) bucket.push(sector);
      else sectorsAtRank.set(rank, [sector]);
    }

    const fromEconomy = new Map<string, number>();
    const shareOf = new Map<string, number>();
    const allTied =
      sectorsAtRank.size === 1 &&
      (sectorsAtRank.values().next().value?.length ?? 0) === sectors.length;

    if (allTied) {
      const base = Math.floor(toDistribute / sectors.length);
      let remainder = toDistribute - base * sectors.length;
      for (const sector of pickOrder) {
        fromEconomy.set(sector.id, base + (remainder > 0 ? 1 : 0));
        shareOf.set(sector.id, 1 / sectors.length);
        if (remainder > 0) remainder--;
      }
    } else {
      for (let rank = 1; rank <= RANK_SHARE.length; rank++) {
        const bucket = sectorsAtRank.get(rank);
        if (!bucket?.length) continue;
        const share = RANK_SHARE[rank - 1] / bucket.length;
        const forRank = Math.floor(economyScore * RANK_SHARE[rank - 1]);
        const base = Math.floor(forRank / bucket.length);
        let remainder = forRank - base * bucket.length;
        for (const sector of pickOrder.filter((s) =>
          bucket.some((b) => b.id === s.id)
        )) {
          fromEconomy.set(
            sector.id,
            (fromEconomy.get(sector.id) ?? 0) + base + (remainder > 0 ? 1 : 0)
          );
          shareOf.set(sector.id, share);
          if (remainder > 0) remainder--;
        }
      }
      let leftover =
        toDistribute -
        [...fromEconomy.values()].reduce((sum, value) => sum + value, 0);
      for (const sector of pickOrder) {
        if (leftover <= 0) break;
        fromEconomy.set(sector.id, (fromEconomy.get(sector.id) ?? 0) + 1);
        leftover--;
      }
    }

    let spent = [...fromEconomy.values()].reduce((sum, value) => sum + value, 0);
    for (const sector of sectors) {
      const economy = fromEconomy.get(sector.id) ?? 0;
      const bonus = Math.max(
        0,
        Math.min(sector.demand ?? 0, Math.max(0, pool - spent))
      );
      spent += bonus;
      inflow.set(sector.id, {
        rank: rankBySector.get(sector.id) ?? 1,
        demand: demandOf(sector),
        share: shareOf.get(sector.id) ?? 0,
        fromEconomy: economy,
        bonus,
        incoming: economy + bonus,
        priority: priorityBySector.get(sector.id) ?? 0,
        nextPriority: nextPriority.get(sector.id) ?? 0,
      });
    }

    return inflow;
  }, [
    gameState.sectors,
    gameState.sectorPriority,
    gameState.economyScore,
    gameState.consumerPoolNumber,
    rankings,
    companies,
  ]);
}

const RANK_LABEL = ["1st", "2nd", "3rd"];

/**
 * The sector's standing in the queue for consumers: its demand rank and the
 * slice that earns it, its place in the pick order, and how many shoppers are
 * on their way in when the turn ends.
 */
export function SectorInflowChips({
  inflow,
  arriving,
}: {
  inflow: SectorInflow;
  /** True while the end-turn distribution is actually happening. */
  arriving: boolean;
}) {
  const rankLabel = RANK_LABEL[inflow.rank - 1] ?? `${inflow.rank}th`;
  const drift = inflow.priority > 0 ? inflow.priority - inflow.nextPriority : 0;

  return (
    <>
      {inflow.rank <= RANK_SHARE.length && (
        <span
          className={cn(
            "shrink-0 rounded px-1 py-px text-[9px] font-bold leading-none",
            inflow.rank === 1
              ? "bg-amber-400/85 text-amber-950"
              : inflow.rank === 2
                ? "bg-sky-400/80 text-sky-950"
                : "bg-zinc-400/70 text-zinc-950"
          )}
          title={`${rankLabel} by demand — takes ${(inflow.share * 100).toFixed(0)}% of the economy score, ${inflow.fromEconomy} consumer${
            inflow.fromEconomy === 1 ? "" : "s"
          }`}
        >
          {rankLabel} {(inflow.share * 100).toFixed(0)}%
        </span>
      )}

      {inflow.priority > 0 && (
        <span
          className={cn(
            "flex shrink-0 items-center rounded px-1 py-px text-[9px] font-semibold leading-none tabular-nums",
            drift !== 0
              ? "bg-fuchsia-500/25 text-fuchsia-200 ring-1 ring-fuchsia-500/60"
              : "bg-black/35 text-zinc-400"
          )}
          title={
            drift !== 0
              ? `Pick order ${inflow.priority} — moving to ${inflow.nextPriority} at the next recalculation. Least demanded sector picks first.`
              : `Pick order ${inflow.priority} of the sectors. Least demanded sector picks first, breaking ties on cheaper share price then fewer companies.`
          }
        >
          P{inflow.priority}
          {drift > 0 && (
            <RiArrowUpSFill size={10} className="text-emerald-300" />
          )}
          {drift < 0 && <RiArrowDownSFill size={10} className="text-rose-300" />}
          {drift !== 0 && Math.abs(drift)}
        </span>
      )}

      {inflow.incoming > 0 && (
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 rounded px-1 py-px text-[9px] font-bold leading-none tabular-nums",
            arriving
              ? "animate-pulse bg-emerald-400/90 text-emerald-950"
              : "bg-emerald-500/20 text-emerald-300"
          )}
          title={`${inflow.incoming} consumers arrive at end of turn: ${inflow.fromEconomy} from the economy score${
            inflow.bonus > 0 ? ` and ${inflow.bonus} guaranteed by demand` : ""
          }`}
        >
          <RiGroupFill size={9} />+{inflow.incoming}
          {arriving && " arriving"}
        </span>
      )}
    </>
  );
}
