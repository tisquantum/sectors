"use client";

import { ResourceType } from "@/components/Company/Factory/Factory.types";
import {
  DEFAULT_WORKERS,
  ECONOMY_SCORE_VALUES,
  getResourcePriceForResourceType,
} from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import {
  OperationMechanicsVersion,
  ResourceTrackType,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { RiFundsLine, RiInformationLine } from "@remixicon/react";
import { GAME_HASH } from "./gameHashNavigation";
import { useGame } from "./GameContext";

const GLOBAL_RESOURCE_TAILWIND: Record<ResourceType, string> = {
  TRIANGLE: "bg-amber-400",
  SQUARE: "bg-sky-400",
  CIRCLE: "bg-emerald-400",
  MATERIALS: "bg-zinc-500",
  INDUSTRIALS: "bg-zinc-500",
  CONSUMER_DISCRETIONARY: "bg-zinc-500",
  CONSUMER_STAPLES: "bg-zinc-500",
  CONSUMER_CYCLICAL: "bg-zinc-500",
  CONSUMER_DEFENSIVE: "bg-zinc-500",
  ENERGY: "bg-zinc-500",
  HEALTHCARE: "bg-zinc-500",
  TECHNOLOGY: "bg-zinc-500",
  GENERAL: "bg-zinc-500",
};

const RESOURCE_TYPE_TO_SECTOR_NAME: Record<ResourceType, string | null> = {
  TRIANGLE: null,
  SQUARE: null,
  CIRCLE: null,
  MATERIALS: "Materials",
  INDUSTRIALS: "Industrial",
  CONSUMER_DISCRETIONARY: "Consumer Discretionary",
  CONSUMER_STAPLES: "Consumer Staples",
  CONSUMER_CYCLICAL: "Consumer Cyclical",
  CONSUMER_DEFENSIVE: "Consumer Defensive",
  ENERGY: "Energy",
  HEALTHCARE: "Healthcare",
  TECHNOLOGY: "Technology",
  GENERAL: null,
};

function resourceAccent(resourceType: ResourceType): {
  hex: string | null;
  tw: string;
} {
  const sectorName = RESOURCE_TYPE_TO_SECTOR_NAME[resourceType];
  if (sectorName && sectorColors[sectorName]) {
    return { hex: sectorColors[sectorName], tw: "" };
  }
  return { hex: null, tw: GLOBAL_RESOURCE_TAILWIND[resourceType] ?? "bg-zinc-500" };
}

function shortResourceLabel(type: string): string {
  return type.replace(/_/g, " ").replace("CONSUMER ", "C. ");
}

function MiniResourceRow({
  title,
  track,
  currentPrice,
  resourceType,
}: {
  title: string;
  track: number[];
  currentPrice: number;
  resourceType: ResourceType;
}) {
  const idx = Math.max(0, track.indexOf(currentPrice));
  const pct =
    track.length > 1 ? Math.min(100, (idx / (track.length - 1)) * 100) : 100;
  const { hex, tw } = resourceAccent(resourceType);

  return (
    <div className="rounded-md border border-zinc-700/70 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 px-2 py-1.5 shadow-sm">
      <div className="flex justify-between items-center gap-2 mb-1">
        <span className="text-[10px] font-medium text-zinc-300 truncate leading-tight">
          {title}
        </span>
        <span className="text-[10px] tabular-nums text-emerald-400/95 font-semibold shrink-0">
          ${currentPrice}
        </span>
      </div>
      <div className="h-1 rounded-full bg-zinc-800/90 overflow-hidden ring-1 ring-black/20">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", !hex && tw)}
          style={{
            width: `${pct}%`,
            ...(hex ? { backgroundColor: hex } : {}),
          }}
        />
      </div>
    </div>
  );
}

/**
 * Compact economy snapshot for the left sidebar: resource tracks + workforce grid.
 */
export function SidebarEconomyMiniView() {
  const { gameId, gameState } = useGame();

  const isValidGameId = !!gameId && typeof gameId === "string" && gameId.length > 0;

  const { data: resources, isLoading: resourcesLoading } =
    trpc.resource.getGameResources.useQuery(
      { gameId: isValidGameId ? gameId : "" },
      { enabled: isValidGameId }
    );

  const { data: game, isLoading: isLoadingGame } = trpc.game.getGame.useQuery(
    { id: gameId! },
    { enabled: !!gameId }
  );

  const { data: workerAllocationBySector, isLoading: isLoadingAllocation } =
    trpc.modernOperations.getWorkerAllocationBySector.useQuery(
      { gameId: gameId! },
      { enabled: !!gameId }
    );

  const totalWorkers = DEFAULT_WORKERS;
  const totalAllocatedFromData =
    !isLoadingAllocation && workerAllocationBySector
      ? workerAllocationBySector.reduce((s, x) => s + x.totalWorkers, 0)
      : 0;
  const workforcePoolFromDB =
    gameState?.workforcePool ?? game?.workforcePool ?? 0;
  const availableWorkers =
    workforcePoolFromDB > 0
      ? workforcePoolFromDB
      : !isLoadingAllocation && workerAllocationBySector
        ? Math.max(0, totalWorkers - totalAllocatedFromData)
        : totalWorkers;
  const allocatedWorkers = totalWorkers - availableWorkers;
  const economyScore =
    allocatedWorkers > 0
      ? ECONOMY_SCORE_VALUES[allocatedWorkers - 1]
      : ECONOMY_SCORE_VALUES[0];

  const spaceToSectorMap = useMemo(() => {
    const map: Map<number, { color: string; sectorName: string }> = new Map();
    if (!workerAllocationBySector || allocatedWorkers <= 0) return map;
    let currentSpace = 1;
    const sorted = [...workerAllocationBySector].sort(
      (a, b) => b.totalWorkers - a.totalWorkers
    );
    for (const sector of sorted) {
      const color = sectorColors[sector.name] || "#666666";
      for (
        let i = 0;
        i < sector.totalWorkers && currentSpace <= allocatedWorkers;
        i++
      ) {
        map.set(currentSpace, { color, sectorName: sector.name });
        currentSpace++;
      }
    }
    return map;
  }, [workerAllocationBySector, allocatedWorkers]);

  const spaces = Array.from({ length: 40 }, (_, i) => i + 1);

  if (gameState?.operationMechanicsVersion !== OperationMechanicsVersion.MODERN) {
    return (
      <div className="p-4 text-center text-xs text-zinc-500 leading-relaxed">
        Economy snapshot is available in games that use{" "}
        <span className="text-zinc-400">modern operations</span>.
      </div>
    );
  }

  const loading =
    resourcesLoading || isLoadingGame || isLoadingAllocation;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <Spinner size="sm" color="secondary" />
        <span className="text-[11px] text-zinc-500">Loading economy…</span>
      </div>
    );
  }

  const generalResources =
    resources?.filter((r: { trackType: string }) => r.trackType === ResourceTrackType.GLOBAL) ??
    [];
  const sectorResources =
    resources?.filter((r: { trackType: string }) => r.trackType === ResourceTrackType.SECTOR) ??
    [];

  return (
    <div className="flex flex-col gap-4 p-3 pb-5">
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/25">
            <RiFundsLine className="text-cyan-400/90" size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Economy
            </h2>
            <p className="text-[10px] text-zinc-600 leading-snug">
              Resources & workforce at a glance
            </p>
          </div>
        </div>
        <Popover placement="left" showArrow>
          <PopoverTrigger>
            <button
              type="button"
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded"
              aria-label="Economy sidebar help"
            >
              <RiInformationLine size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="bg-zinc-950 border border-zinc-700 max-w-[240px]">
            <p className="text-[11px] text-zinc-400 leading-relaxed p-1">
              Resource bars show position on each price track. The grid is the
              workforce track (left → right); the blue ring marks the economy
              score position.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {/* Workforce — compact */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Workforce
          </span>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 tabular-nums">
            <span>
              <span className="text-emerald-400/90">{availableWorkers}</span> free
            </span>
            <span className="text-zinc-600">·</span>
            <span>
              <span className="text-zinc-300">{allocatedWorkers}</span> out
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-sky-400/90 font-medium">ES {economyScore}</span>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-1.5 ring-1 ring-black/30">
          <div className="grid grid-cols-10 gap-px">
            {spaces.map((space) => {
              const isAvailable = space > allocatedWorkers;
              const rightmost =
                allocatedWorkers > 0 ? allocatedWorkers : 0;
              const isEconomyScore =
                allocatedWorkers > 0 && space === rightmost;
              const sectorInfo = spaceToSectorMap.get(space);
              const spaceEconomyScore = ECONOMY_SCORE_VALUES[space - 1];

              return (
                <div
                  key={space}
                  title={
                    isEconomyScore
                      ? `Economy score ${economyScore}`
                      : isAvailable
                        ? `Open · ES ${spaceEconomyScore}`
                        : sectorInfo
                          ? `${sectorInfo.sectorName} · ES ${spaceEconomyScore}`
                          : `Allocated · ES ${spaceEconomyScore}`
                  }
                  className={cn(
                    "relative h-[22px] w-full rounded-[3px] border flex items-center justify-center",
                    isAvailable
                      ? "bg-emerald-950/40 border-emerald-800/40"
                      : "bg-zinc-800/50 border-zinc-700/40",
                    isEconomyScore &&
                      "ring-1 ring-sky-400 ring-offset-0 z-[1] border-sky-500/50"
                  )}
                >
                  {isAvailable && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-sm" />
                  )}
                  {!isAvailable && sectorInfo && (
                    <span
                      className="w-1.5 h-1.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: sectorInfo.color }}
                    />
                  )}
                  {!isAvailable && !sectorInfo && (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600/80" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Resources */}
      {(!resources || resources.length === 0) && (
        <p className="text-[11px] text-zinc-500 text-center py-2">
          No resource data yet.
        </p>
      )}

      {generalResources.length > 0 && (
        <section>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
            General resources
          </span>
          <div className="flex flex-col gap-1.5">
            {generalResources.map((resource: { id: string; type: string; price: number }) => {
              const rt = resource.type as ResourceType;
              const track = getResourcePriceForResourceType(rt);
              return (
                <MiniResourceRow
                  key={resource.id}
                  title={shortResourceLabel(resource.type)}
                  track={track}
                  currentPrice={resource.price}
                  resourceType={rt}
                />
              );
            })}
          </div>
        </section>
      )}

      {sectorResources.length > 0 && (
        <section>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
            Sector resources
          </span>
          <div className="flex flex-col gap-1.5">
            {sectorResources.map((resource: { id: string; type: string; price: number }) => {
              const rt = resource.type as ResourceType;
              const track = getResourcePriceForResourceType(rt);
              return (
                <MiniResourceRow
                  key={resource.id}
                  title={shortResourceLabel(
                    resource.type.replace(/_/g, " ")
                  )}
                  track={track}
                  currentPrice={resource.price}
                  resourceType={rt}
                />
              );
            })}
          </div>
        </section>
      )}

      <a
        href={GAME_HASH.economy}
        className="mt-1 block text-center text-[10px] font-medium text-sky-400/90 hover:text-sky-300 transition-colors py-1.5 rounded-md border border-transparent hover:border-sky-500/20 hover:bg-sky-500/5"
      >
        Open full Economy view →
      </a>
    </div>
  );
}
