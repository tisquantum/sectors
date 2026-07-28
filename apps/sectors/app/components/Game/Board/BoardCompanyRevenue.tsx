"use client";

import { useMemo } from "react";
import {
  OperationMechanicsVersion,
  PhaseName,
  RevenueDistribution,
  ShareLocation,
} from "@server/prisma/prisma.client";
import type { CompanyWithRelations } from "@server/prisma/prisma.types";
import { FACTORY_CUSTOMER_LIMITS } from "@server/data/constants";
import { trpc } from "@sectors/app/trpc";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";

/** Shares of a company that earn a dividend; the IPO pile does not. */
const SHARES_IN_ROTATION = 10;

export interface CompanyRevenue {
  revenue: number;
  customers: number;
  capacity: number;
  factories: number;
  /** Null while the vote is still secret. */
  outcome: RevenueDistribution | null;
  dividendPerShare: number;
  dividendTotal: number;
  retained: number;
  yourShares: number;
  yourDividend: number;
}

/**
 * Phases where the turn's earnings are the story. During these the company
 * tiles carry their revenue readout so the numbers sit where the companies are.
 */
export function isRevenuePhase(phaseName: PhaseName | undefined): boolean {
  return (
    phaseName === PhaseName.OPERATING_PRODUCTION ||
    phaseName === PhaseName.OPERATING_PRODUCTION_VOTE ||
    phaseName === PhaseName.OPERATING_PRODUCTION_VOTE_RESOLVE ||
    phaseName === PhaseName.OPERATING_STOCK_PRICE_ADJUSTMENT
  );
}

const OUTCOME_LABEL: Record<RevenueDistribution, string> = {
  [RevenueDistribution.DIVIDEND_FULL]: "Full dividend",
  [RevenueDistribution.DIVIDEND_FIFTY_FIFTY]: "Half dividend",
  [RevenueDistribution.RETAINED]: "Retained",
};

const OUTCOME_SHORT: Record<RevenueDistribution, string> = {
  [RevenueDistribution.DIVIDEND_FULL]: "DIV",
  [RevenueDistribution.DIVIDEND_FIFTY_FIFTY]: "½ DIV",
  [RevenueDistribution.RETAINED]: "RET",
};

const OUTCOME_CLASS: Record<RevenueDistribution, string> = {
  [RevenueDistribution.DIVIDEND_FULL]: "bg-emerald-500/85 text-emerald-950",
  [RevenueDistribution.DIVIDEND_FIFTY_FIFTY]: "bg-amber-500/85 text-amber-950",
  [RevenueDistribution.RETAINED]: "bg-zinc-400/80 text-zinc-950",
};

/**
 * This turn's earnings per company: what the factories produced, how the
 * shareholders voted to split it, and what lands in your pocket.
 */
export function useBoardRevenue(
  companies: CompanyWithRelations[]
): Map<string, CompanyRevenue> {
  const { gameId, gameState, currentPhase, currentTurn, authPlayer } = useGame();

  const isModern =
    gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN;

  const { data: production } =
    trpc.factoryProduction.getGameTurnProduction.useQuery(
      { gameId, gameTurnId: currentTurn?.id ?? "" },
      { enabled: !!gameId && !!currentTurn?.id && isModern }
    );

  // The server refuses to hand over votes while they are still being cast.
  const votesReadable =
    !!currentPhase?.operatingRoundId &&
    currentPhase.name !== PhaseName.OPERATING_PRODUCTION_VOTE;

  const { data: votes } =
    trpc.revenueDistributionVote.listRevenueDistributionVotesWithRelations.useQuery(
      {
        where: { operatingRoundId: currentPhase?.operatingRoundId },
        gameId,
      },
      { enabled: !!gameId && votesReadable, retry: false }
    );

  return useMemo(() => {
    const summaries = new Map<string, CompanyRevenue>();
    if (!production) return summaries;

    for (const row of production) {
      if (!row.customersServed) continue;
      const size = row.Factory?.size as keyof typeof FACTORY_CUSTOMER_LIMITS;
      const entry = summaries.get(row.companyId) ?? {
        revenue: 0,
        customers: 0,
        capacity: 0,
        factories: 0,
        outcome: null,
        dividendPerShare: 0,
        dividendTotal: 0,
        retained: 0,
        yourShares: 0,
        yourDividend: 0,
      };
      entry.revenue += row.profit || row.revenue || 0;
      entry.customers += row.customersServed;
      entry.capacity += FACTORY_CUSTOMER_LIMITS[size] ?? 0;
      entry.factories += 1;
      summaries.set(row.companyId, entry);
    }

    // Majority of the weighted votes decides how each company splits its take.
    const winners = new Map<string, RevenueDistribution>();
    const tallies = new Map<string, Map<RevenueDistribution, number>>();
    for (const vote of votes ?? []) {
      const tally =
        tallies.get(vote.companyId) ?? new Map<RevenueDistribution, number>();
      tally.set(
        vote.revenueDistribution,
        (tally.get(vote.revenueDistribution) ?? 0) + (vote.weight || 1)
      );
      tallies.set(vote.companyId, tally);
    }
    for (const [companyId, tally] of tallies) {
      let best: RevenueDistribution | null = null;
      let bestCount = 0;
      for (const [distribution, count] of tally) {
        if (count > bestCount) {
          bestCount = count;
          best = distribution;
        }
      }
      if (best) winners.set(companyId, best);
    }

    for (const [companyId, entry] of summaries) {
      const company = companies.find((c) => c.id === companyId);
      if (!company) continue;

      const eligible = company.Share.filter(
        (share) =>
          share.location === ShareLocation.PLAYER ||
          share.location === ShareLocation.OPEN_MARKET
      );
      entry.yourShares = eligible.filter(
        (share) => share.playerId === authPlayer?.id
      ).length;

      const outcome = votesReadable
        ? winners.get(companyId) ?? RevenueDistribution.RETAINED
        : null;
      entry.outcome = outcome;

      if (outcome === RevenueDistribution.DIVIDEND_FULL) {
        entry.dividendPerShare =
          eligible.length > 0 ? Math.floor(entry.revenue / eligible.length) : 0;
        entry.dividendTotal = entry.revenue;
        entry.retained = 0;
      } else if (outcome === RevenueDistribution.DIVIDEND_FIFTY_FIFTY) {
        entry.dividendPerShare = Math.floor(
          Math.floor(entry.revenue / 2) / SHARES_IN_ROTATION
        );
        entry.dividendTotal = entry.dividendPerShare * eligible.length;
        entry.retained = entry.revenue - entry.dividendTotal;
      } else {
        entry.dividendPerShare = 0;
        entry.dividendTotal = 0;
        entry.retained = entry.revenue;
      }

      entry.yourDividend = entry.dividendPerShare * entry.yourShares;
    }

    return summaries;
  }, [production, votes, companies, authPlayer?.id, votesReadable]);
}

/**
 * The turn's earnings printed onto a company tile: revenue, how full the
 * factories ran, and where the money went once the vote resolved.
 */
export function CompanyRevenueStrip({ revenue }: { revenue: CompanyRevenue }) {
  const atCapacity =
    revenue.capacity > 0 && revenue.customers >= revenue.capacity;

  return (
    <div className="mt-0.5 flex flex-col gap-0.5 rounded border border-amber-400/45 bg-black/50 px-1 py-0.5">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] font-bold leading-none tabular-nums text-emerald-300">
          ${revenue.revenue.toLocaleString()}
        </span>
        <span
          className={cn(
            "text-[8px] font-semibold leading-none tabular-nums",
            atCapacity ? "text-emerald-300" : "text-zinc-300"
          )}
          title={`${revenue.customers} of ${revenue.capacity} customer slots filled across ${revenue.factories} ${
            revenue.factories === 1 ? "factory" : "factories"
          }`}
        >
          {revenue.customers}/{revenue.capacity}
        </span>
      </div>
      {revenue.outcome && (
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "rounded px-1 py-px text-[8px] font-bold uppercase leading-none tracking-wide",
              OUTCOME_CLASS[revenue.outcome]
            )}
            title={`${OUTCOME_LABEL[revenue.outcome]} · $${revenue.dividendTotal} paid out, $${revenue.retained} kept`}
          >
            {OUTCOME_SHORT[revenue.outcome]}
            {revenue.dividendPerShare > 0 && ` $${revenue.dividendPerShare}/sh`}
          </span>
          {revenue.yourDividend > 0 && (
            <span
              className="shrink-0 rounded bg-sky-500/45 px-1 py-px text-[8px] font-bold leading-none tabular-nums text-sky-50"
              title={`Your ${revenue.yourShares} share${revenue.yourShares === 1 ? "" : "s"} pay $${revenue.yourDividend}`}
            >
              +${revenue.yourDividend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Phase-panel companion to the tile readouts: the totals for the turn, with the
 * per-company detail left where it belongs — on the board.
 */
export function BoardRevenueRecap() {
  const { gameId } = useGame();
  const { data } = trpc.company.listCompaniesWithRelations.useQuery(
    { where: { gameId } },
    { enabled: !!gameId, staleTime: 10000 }
  );
  const companies = useMemo(
    () => (data ?? []) as CompanyWithRelations[],
    [data]
  );
  const summaries = useBoardRevenue(companies);
  const rows = [...summaries.entries()]
    .map(([companyId, revenue]) => ({
      company: companies.find((c) => c.id === companyId),
      revenue,
    }))
    .filter((row) => !!row.company)
    .sort((a, b) => b.revenue.revenue - a.revenue.revenue);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">
        No company earned revenue this turn.
      </p>
    );
  }

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue.revenue, 0);
  const totalCustomers = rows.reduce((sum, row) => sum + row.revenue.customers, 0);
  const yourTake = rows.reduce((sum, row) => sum + row.revenue.yourDividend, 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400">
        Each company&apos;s take is printed on its tile on the board for the rest
        of the phase.
      </p>
      <div className="flex flex-wrap gap-2">
        <Total label="Revenue" value={`$${totalRevenue.toLocaleString()}`} />
        <Total label="Customers served" value={`${totalCustomers}`} />
        <Total label="Companies earning" value={`${rows.length}`} />
        <Total
          label="Your dividends"
          value={`$${yourTake.toLocaleString()}`}
          accent
        />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
            <th className="pb-1">Company</th>
            <th className="pb-1 text-right">Served</th>
            <th className="pb-1 text-right">Revenue</th>
            <th className="pb-1 text-right">Outcome</th>
            <th className="pb-1 text-right">You</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ company, revenue }) => (
            <tr key={company!.id} className="border-t border-zinc-800/80">
              <td className="py-1.5">{company!.name}</td>
              <td className="py-1.5 text-right tabular-nums text-zinc-400">
                {revenue.customers}/{revenue.capacity}
              </td>
              <td className="py-1.5 text-right tabular-nums text-emerald-400">
                ${revenue.revenue.toLocaleString()}
              </td>
              <td className="py-1.5 text-right text-zinc-300">
                {revenue.outcome ? OUTCOME_LABEL[revenue.outcome] : "Voting"}
                {revenue.dividendPerShare > 0 &&
                  ` · $${revenue.dividendPerShare}/share`}
              </td>
              <td className="py-1.5 text-right tabular-nums text-sky-400">
                {revenue.yourDividend > 0
                  ? `$${revenue.yourDividend.toLocaleString()}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Total({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-[8rem] flex-1 flex-col gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span
        className={cn(
          "text-lg font-bold tabular-nums",
          accent ? "text-sky-400" : "text-zinc-100"
        )}
      >
        {value}
      </span>
    </div>
  );
}
