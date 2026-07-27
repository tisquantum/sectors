"use client";

import { useMemo } from "react";
import { FACTORY_CUSTOMER_LIMITS } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { FactorySize } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { ResourceGlyph } from "./ResourceGlyph";
import { groupMarkers } from "./BoardSectorDemand";

const SIZE_LABEL: Record<FactorySize, string> = {
  [FactorySize.FACTORY_I]: "I",
  [FactorySize.FACTORY_II]: "II",
  [FactorySize.FACTORY_III]: "III",
  [FactorySize.FACTORY_IV]: "IV",
};

/**
 * Where the customers went this turn, in one table. The live detail — bags,
 * waiting areas, factory fill — is on the board itself, so this is only a
 * recap for anyone who wants the numbers side by side.
 */
export function BoardConsumptionRecap() {
  const { gameId, gameState, currentTurn } = useGame();

  const { data: production } =
    trpc.factoryProduction.getGameTurnProduction.useQuery(
      { gameId, gameTurnId: currentTurn?.id ?? "" },
      { enabled: !!gameId && !!currentTurn?.id }
    );
  const { data: bagMarkers } =
    trpc.consumptionMarker.getAllConsumptionBags.useQuery(
      { gameId },
      { enabled: !!gameId }
    );

  const rows = useMemo(() => {
    const servedBySector = new Map<string, number>();
    for (const row of production ?? []) {
      const sectorId = row.Factory?.sectorId;
      if (!sectorId) continue;
      servedBySector.set(
        sectorId,
        (servedBySector.get(sectorId) ?? 0) + row.customersServed
      );
    }
    return gameState.sectors.map((sector) => ({
      id: sector.id,
      name: sector.name,
      color: sectorColors[sector.name] ?? "#52525b",
      groups: groupMarkers(bagMarkers, sector.id),
      served: servedBySector.get(sector.id) ?? 0,
      shopping: sector.consumers ?? 0,
      waiting: sector.waitingArea ?? 0,
    }));
  }, [production, bagMarkers, gameState.sectors]);

  const factories = useMemo(() => {
    return (production ?? [])
      .map((row) => {
        const factory = row.Factory as
          | { size: FactorySize; slot: number; resourceTypes: string[] }
          | undefined;
        const size = factory?.size ?? FactorySize.FACTORY_I;
        return {
          id: row.id,
          symbol: row.Company?.stockSymbol ?? "—",
          size,
          slot: factory?.slot ?? 0,
          resourceTypes: factory?.resourceTypes ?? [],
          served: row.customersServed,
          capacity: FACTORY_CUSTOMER_LIMITS[size] ?? 0,
          revenue: row.revenue,
          profit: row.profit,
        };
      })
      .sort((a, b) => b.served - a.served);
  }, [production]);

  const totalServed = factories.reduce((sum, row) => sum + row.served, 0);
  const totalWaiting = rows.reduce((sum, row) => sum + row.waiting, 0);

  return (
    <div className="flex flex-col gap-4 text-sm text-zinc-300">
      <p className="leading-relaxed text-zinc-400">
        Shoppers draw a material from their sector&apos;s consumption bag and go
        to the factory that accepts it with the lowest attraction, which is unit
        price minus brand score. Anyone left over waits. The board shows this
        live: each sector block lists its bag and waiting area, and factory tiles
        fill as they are served.
      </p>

      <div className="flex flex-wrap gap-4 text-xs">
        <span>
          <span className="text-zinc-500">Served this turn </span>
          <span className="font-bold tabular-nums text-emerald-400">
            {totalServed}
          </span>
        </span>
        <span>
          <span className="text-zinc-500">Waiting </span>
          <span className="font-bold tabular-nums text-amber-400">
            {totalWaiting}
          </span>
        </span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
            <th className="pb-1">Sector</th>
            <th className="pb-1">Bag</th>
            <th className="pb-1 text-right">Served</th>
            <th className="pb-1 text-right">Shopping</th>
            <th className="pb-1 text-right">Waiting</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-800/80">
              <td className="py-1.5">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.name}
                </span>
              </td>
              <td className="py-1.5">
                <span className="flex flex-wrap items-center gap-1">
                  {row.groups.map((group) => (
                    <span
                      key={group.type}
                      className="flex items-center gap-0.5 tabular-nums text-zinc-400"
                    >
                      <ResourceGlyph type={group.type} size={8} />
                      {group.permanent + group.temporary}
                    </span>
                  ))}
                </span>
              </td>
              <td className="py-1.5 text-right tabular-nums text-emerald-400">
                {row.served}
              </td>
              <td className="py-1.5 text-right tabular-nums text-zinc-400">
                {row.shopping}
              </td>
              <td
                className={cn(
                  "py-1.5 text-right tabular-nums",
                  row.waiting > 0 ? "text-amber-400" : "text-zinc-600"
                )}
              >
                {row.waiting}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {factories.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="pb-1">Factory</th>
              <th className="pb-1">Blueprint</th>
              <th className="pb-1 text-right">Customers</th>
              <th className="pb-1 text-right">Revenue</th>
              <th className="pb-1 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {factories.map((row) => (
              <tr key={row.id} className="border-t border-zinc-800/80">
                <td className="py-1.5 font-semibold text-zinc-200">
                  {row.symbol}{" "}
                  <span className="font-normal text-zinc-500">
                    {SIZE_LABEL[row.size]} · slot {row.slot}
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="flex items-center gap-1">
                    {row.resourceTypes.map((type, index) => (
                      <ResourceGlyph
                        key={`${type}-${index}`}
                        type={type}
                        size={8}
                      />
                    ))}
                  </span>
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {row.served}/{row.capacity}
                </td>
                <td className="py-1.5 text-right tabular-nums text-zinc-400">
                  {row.revenue ? `$${row.revenue}` : "—"}
                </td>
                <td
                  className={cn(
                    "py-1.5 text-right tabular-nums",
                    row.profit > 0
                      ? "text-emerald-400"
                      : row.profit < 0
                        ? "text-rose-400"
                        : "text-zinc-600"
                  )}
                >
                  {row.profit ? `$${row.profit}` : "at earnings"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BoardConsumptionRecap;
