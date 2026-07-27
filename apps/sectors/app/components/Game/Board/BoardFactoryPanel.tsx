"use client";

import { useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import {
  FACTORY_CUSTOMER_LIMITS,
  FACTORY_WORKER_REQUIREMENTS,
} from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { FactorySize } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { formatEnumLabel } from "@sectors/app/helpers/labels";
import { RiAlarmWarningFill, RiGroupFill, RiUserFill } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { BoardSection } from "./BoardSection";
import { resourceColor, TRACK_COLUMN_HEIGHT } from "./BoardResourceColumns";
import type { FocusLevel } from "./boardFocus";

const SIZE_LABEL: Record<FactorySize, string> = {
  [FactorySize.FACTORY_I]: "I",
  [FactorySize.FACTORY_II]: "II",
  [FactorySize.FACTORY_III]: "III",
  [FactorySize.FACTORY_IV]: "IV",
};

interface FactoryRow {
  id: string;
  size: FactorySize;
  slot: number;
  workers: number;
  isOperational: boolean;
  isRusted: boolean;
  resourceTypes: string[];
  originalConstructionCost: number | null;
  companyId: string;
  companyName: string;
  symbol: string;
  sectorName: string;
  brandScore: number;
  color: string;
  served: number;
  revenue: number;
  profit: number;
}

interface CompanyGroup {
  companyId: string;
  symbol: string;
  companyName: string;
  sectorName: string;
  color: string;
  factories: FactoryRow[];
  workers: number;
}

/** A material in a blueprint: global materials keep their shape, sector ones are diamonds. */
function ResourceGlyph({ type, size = 9 }: { type: string; size?: number }) {
  const color = resourceColor(type);
  const base = { width: size, height: size, backgroundColor: color };
  if (type === "CIRCLE") {
    return <span className="rounded-full" style={base} title={type} />;
  }
  if (type === "TRIANGLE") {
    return (
      <span
        title={type}
        style={{ ...base, clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    );
  }
  if (type === "SQUARE") {
    return <span className="rounded-[1px]" style={base} title={type} />;
  }
  return (
    <span
      title={formatEnumLabel(type)}
      className="rotate-45 rounded-[1px]"
      style={base}
    />
  );
}

/** One factory as a small tile: tier, blueprint, workers and customers served. */
function FactoryChip({
  factory,
  capacity,
  onOpen,
}: {
  factory: FactoryRow;
  capacity: number;
  onOpen: () => void;
}) {
  const status = factory.isRusted
    ? "rusted"
    : factory.isOperational
      ? "operational"
      : "building";

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${factory.companyName} · Factory ${SIZE_LABEL[factory.size]} · slot ${
        factory.slot
      } · ${status}`}
      className={cn(
        "flex w-16 shrink-0 flex-col items-stretch gap-1 rounded border px-1.5 py-1 leading-none transition-transform hover:scale-105",
        status === "operational" && "border-zinc-700 bg-zinc-800/70",
        status === "building" &&
          "border-dashed border-zinc-700 bg-zinc-900/60 opacity-80",
        status === "rusted" && "border-amber-600/70 bg-amber-950/40"
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: factory.color }}
        >
          {SIZE_LABEL[factory.size]}
        </span>
        {status === "rusted" ? (
          <RiAlarmWarningFill size={12} className="text-amber-400" />
        ) : (
          status === "building" && (
            <span className="text-[9px] uppercase tracking-wider text-zinc-500">
              wip
            </span>
          )
        )}
      </span>
      {/* Two rows' worth of room so a Factory IV blueprint never clips. */}
      <span className="flex h-5 flex-wrap content-start items-start gap-1">
        {factory.resourceTypes.map((type, index) => (
          <ResourceGlyph key={`${type}-${index}`} type={type} />
        ))}
      </span>
      <span className="flex items-center justify-between gap-1 text-[10px] tabular-nums text-zinc-400">
        <span className="flex items-center gap-0.5">
          <RiUserFill size={9} />
          {factory.workers}
        </span>
        <span
          className={cn(
            "font-semibold",
            factory.served > 0 ? "text-emerald-400" : "text-zinc-600"
          )}
        >
          {factory.served}/{capacity}
        </span>
      </span>
    </button>
  );
}

/**
 * Every factory in the game, grouped under the company that built it. This is
 * where the board shows what the economy is actually able to produce.
 */
export function BoardFactoryPanel({
  focus,
  className,
}: {
  focus: FocusLevel;
  className?: string;
}) {
  const { gameId, currentTurn } = useGame();
  const [openFactory, setOpenFactory] = useState<FactoryRow | null>(null);

  const { data: factories } = trpc.factory.getGameFactories.useQuery(
    { gameId },
    { enabled: !!gameId }
  );
  const { data: resources } = trpc.resource.getGameResources.useQuery(
    { gameId },
    { enabled: !!gameId }
  );
  const { data: production } =
    trpc.factoryProduction.getGameTurnProduction.useQuery(
      { gameId, gameTurnId: currentTurn?.id ?? "" },
      { enabled: !!gameId && !!currentTurn?.id }
    );

  const priceByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const resource of resources ?? []) {
      map.set(resource.type, resource.price);
    }
    return map;
  }, [resources]);

  const groups = useMemo<CompanyGroup[]>(() => {
    const producedBy = new Map<
      string,
      { served: number; revenue: number; profit: number }
    >();
    for (const row of production ?? []) {
      const current = producedBy.get(row.factoryId) ?? {
        served: 0,
        revenue: 0,
        profit: 0,
      };
      producedBy.set(row.factoryId, {
        served: current.served + row.customersServed,
        revenue: current.revenue + row.revenue,
        profit: current.profit + row.profit,
      });
    }

    const byCompany = new Map<string, CompanyGroup>();
    for (const factory of factories ?? []) {
      const sectorName = factory.Sector?.name ?? "Unknown";
      const color = sectorColors[sectorName] ?? "#52525b";
      const stats = producedBy.get(factory.id);
      const row: FactoryRow = {
        id: factory.id,
        size: factory.size,
        slot: factory.slot,
        workers: factory.workers,
        isOperational: factory.isOperational,
        isRusted: factory.isRusted,
        resourceTypes: factory.resourceTypes ?? [],
        originalConstructionCost: factory.originalConstructionCost ?? null,
        companyId: factory.companyId,
        companyName: factory.company?.name ?? "Unknown",
        symbol: factory.company?.stockSymbol ?? "—",
        sectorName,
        brandScore: factory.company?.brandScore ?? 0,
        color,
        served: stats?.served ?? 0,
        revenue: stats?.revenue ?? 0,
        profit: stats?.profit ?? 0,
      };

      let group = byCompany.get(factory.companyId);
      if (!group) {
        group = {
          companyId: factory.companyId,
          symbol: row.symbol,
          companyName: row.companyName,
          sectorName,
          color,
          factories: [],
          workers: 0,
        };
        byCompany.set(factory.companyId, group);
      }
      group.factories.push(row);
      group.workers += row.workers;
    }

    for (const group of byCompany.values()) {
      group.factories.sort((a, b) => a.slot - b.slot);
    }

    return [...byCompany.values()].sort(
      (a, b) =>
        a.sectorName.localeCompare(b.sectorName) ||
        b.factories.length - a.factories.length ||
        a.symbol.localeCompare(b.symbol)
    );
  }, [factories, production]);

  const totals = useMemo(() => {
    const rows = groups.flatMap((group) => group.factories);
    return {
      count: rows.length,
      workers: rows.reduce((sum, row) => sum + row.workers, 0),
      served: rows.reduce((sum, row) => sum + row.served, 0),
      capacity: rows
        .filter((row) => row.isOperational)
        .reduce((sum, row) => sum + FACTORY_CUSTOMER_LIMITS[row.size], 0),
      building: rows.filter((row) => !row.isOperational).length,
      rusted: rows.filter((row) => row.isRusted).length,
    };
  }, [groups]);

  const openUnitPrice = openFactory
    ? openFactory.resourceTypes.reduce(
        (sum, type) => sum + (priceByType.get(type) ?? 0),
        0
      )
    : 0;

  return (
    <BoardSection
      title="Factories"
      hint={
        totals.count > 0
          ? `${totals.count} built · ${totals.workers} workers · ${totals.served}/${totals.capacity} customers served`
          : "Nothing built yet"
      }
      focus={focus}
      className={className}
      actions={
        totals.building > 0 || totals.rusted > 0 ? (
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            {totals.building > 0 && (
              <span className="text-zinc-500">{totals.building} building</span>
            )}
            {totals.rusted > 0 && (
              <span className="text-amber-400">{totals.rusted} rusted</span>
            )}
          </span>
        ) : undefined
      }
      bodyClassName="p-1"
    >
      {groups.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-zinc-600">
          No factories have been built. Companies construct them during
          operations.
        </p>
      ) : (
        <div
          className="flex flex-wrap content-start gap-1.5 overflow-y-auto scrollbar"
          style={{ maxHeight: TRACK_COLUMN_HEIGHT + 30 }}
        >
          {groups.map((group) => (
            <div
              key={group.companyId}
              className="flex min-w-0 flex-col gap-1 rounded border border-zinc-800/80 bg-zinc-900/40 p-1.5"
            >
              <span className="flex items-center gap-1.5 leading-none">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-xs font-bold text-zinc-100">
                  {group.symbol}
                </span>
                <span className="ml-auto flex items-center gap-0.5 pl-2 text-[10px] tabular-nums text-zinc-500">
                  <RiGroupFill size={10} />
                  {group.workers}
                </span>
              </span>
              <div className="flex items-start gap-1.5">
                {group.factories.map((factory) => (
                  <FactoryChip
                    key={factory.id}
                    factory={factory}
                    capacity={FACTORY_CUSTOMER_LIMITS[factory.size]}
                    onOpen={() => setOpenFactory(factory)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!openFactory}
        onOpenChange={(open) => !open && setOpenFactory(null)}
        className="dark bg-zinc-950 text-foreground"
      >
        <ModalContent>
          {openFactory && (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: openFactory.color }}
                  />
                  <span>
                    {openFactory.companyName} · Factory{" "}
                    {SIZE_LABEL[openFactory.size]}
                  </span>
                </div>
                <span className="text-xs font-normal text-zinc-400">
                  {openFactory.sectorName} · slot {openFactory.slot} ·{" "}
                  {openFactory.isRusted
                    ? "rusted, needs upgrading"
                    : openFactory.isOperational
                      ? "operational"
                      : "under construction until next turn"}
                </span>
              </ModalHeader>
              <ModalBody className="gap-3 pb-5 text-sm text-zinc-300">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Blueprint
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {openFactory.resourceTypes.map((type, index) => (
                      <span
                        key={`${type}-${index}`}
                        className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/70 px-1.5 py-1 text-xs"
                      >
                        <ResourceGlyph type={type} size={8} />
                        {formatEnumLabel(type)}
                        <span className="tabular-nums text-zinc-500">
                          ${priceByType.get(type) ?? 0}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <dt className="text-zinc-500">Unit price</dt>
                  <dd className="text-right tabular-nums text-emerald-400">
                    ${openUnitPrice}
                  </dd>
                  <dt className="text-zinc-500">
                    Attraction (unit price − brand)
                  </dt>
                  <dd className="text-right tabular-nums text-amber-400">
                    {openUnitPrice - openFactory.brandScore}
                  </dd>
                  <dt className="text-zinc-500">Workers</dt>
                  <dd className="text-right tabular-nums">
                    {openFactory.workers} of{" "}
                    {FACTORY_WORKER_REQUIREMENTS[openFactory.size]} standard
                  </dd>
                  <dt className="text-zinc-500">Customers this turn</dt>
                  <dd className="text-right tabular-nums">
                    {openFactory.served} of{" "}
                    {FACTORY_CUSTOMER_LIMITS[openFactory.size]}
                  </dd>
                  {openFactory.revenue > 0 && (
                    <>
                      <dt className="text-zinc-500">Revenue this turn</dt>
                      <dd className="text-right tabular-nums text-emerald-400">
                        ${openFactory.revenue}
                      </dd>
                      <dt className="text-zinc-500">Profit this turn</dt>
                      <dd
                        className={cn(
                          "text-right tabular-nums",
                          openFactory.profit >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        )}
                      >
                        ${openFactory.profit}
                      </dd>
                    </>
                  )}
                  {openFactory.originalConstructionCost != null && (
                    <>
                      <dt className="text-zinc-500">Built for</dt>
                      <dd className="text-right tabular-nums text-zinc-400">
                        ${openFactory.originalConstructionCost}
                      </dd>
                    </>
                  )}
                </dl>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Customers pick the cheapest attraction first, so a low unit
                  price or a strong brand fills this factory before its rivals.
                  Workers cost the sector salary every earnings call whether or
                  not customers arrive.
                </p>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </BoardSection>
  );
}

export default BoardFactoryPanel;
