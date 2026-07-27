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
import {
  CompanyStatus,
  FactorySize,
  PhaseName,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { formatEnumLabel } from "@sectors/app/helpers/labels";
import {
  factorySlotLabel,
  getFactorySlotPlan,
  getResearchStageFromMarker,
  type FactorySlotPhase,
} from "@sectors/app/helpers/tableauSlots";
import {
  RiAddLine,
  RiAlarmWarningFill,
  RiGroupFill,
  RiHammerFill,
  RiUserFill,
  RiVipCrown2Fill,
} from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { BoardSection } from "./BoardSection";
import { TRACK_COLUMN_HEIGHT } from "./BoardResourceColumns";
import { ResourceGlyph } from "./ResourceGlyph";
import { BoardBuildModal, type BuildTarget } from "./BoardBuildModal";
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
  sectorEnum: string;
  color: string;
  cashOnHand: number;
  isMine: boolean;
  canBuild: boolean;
  /** One entry per slot the sector's research stage has opened. */
  slots: {
    slotNumber: number;
    phase: FactorySlotPhase;
    factory?: FactoryRow;
    queued?: QueuedBuild;
  }[];
  workers: number;
}

interface QueuedBuild {
  id: string;
  size: FactorySize;
  resourceTypes: string[];
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

/** A commissioned build waiting on the resolve step. */
function QueuedChip({ build }: { build: QueuedBuild }) {
  return (
    <span
      title={`Factory ${SIZE_LABEL[build.size]} commissioned, builds when operations resolve`}
      className="flex w-16 shrink-0 flex-col items-stretch gap-1 rounded border border-dashed border-sky-600/70 bg-sky-950/40 px-1.5 py-1 leading-none"
    >
      <span className="flex items-center justify-between gap-1">
        <span className="text-sm font-bold tabular-nums text-sky-300">
          {SIZE_LABEL[build.size]}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-sky-400">
          queued
        </span>
      </span>
      <span className="flex h-5 flex-wrap content-start items-start gap-1">
        {build.resourceTypes.map((type, index) => (
          <ResourceGlyph key={`${type}-${index}`} type={type} />
        ))}
      </span>
      <span className="text-[10px] text-zinc-500">on resolve</span>
    </span>
  );
}

/** An open plot. Pressable for the CEO during operations, otherwise a placeholder. */
function EmptySlot({
  label,
  canBuild,
  onOpen,
}: {
  label: string;
  canBuild: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!canBuild}
      onClick={onOpen}
      title={
        canBuild
          ? `Build a Factory ${label} here`
          : `Empty slot · accepts Factory ${label}`
      }
      className={cn(
        "flex w-16 shrink-0 flex-col items-center justify-center gap-1 rounded border border-dashed py-1.5 leading-none transition-colors",
        canBuild
          ? "cursor-pointer border-orange-500/70 bg-orange-500/10 text-orange-300 hover:border-orange-400 hover:bg-orange-500/20"
          : "border-zinc-800 text-zinc-600"
      )}
    >
      {canBuild ? <RiAddLine size={14} /> : <span className="h-3.5" />}
      <span className="text-[10px] font-semibold tabular-nums">{label}</span>
    </button>
  );
}

/**
 * Every factory in the game, grouped under the company that built it, with the
 * open plots of the companies you run as pressable build slots. Construction
 * happens here rather than in a phase panel.
 */
export function BoardFactoryPanel({
  focus,
  className,
}: {
  focus: FocusLevel;
  className?: string;
}) {
  const { gameId, gameState, currentTurn, currentPhase, authPlayer } = useGame();
  const [openFactory, setOpenFactory] = useState<FactoryRow | null>(null);
  const [buildTarget, setBuildTarget] = useState<BuildTarget | null>(null);

  const isOperationsPhase =
    currentPhase?.name === PhaseName.MODERN_OPERATIONS ||
    currentPhase?.name === PhaseName.FACTORY_CONSTRUCTION;

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
  const { data: queuedOrders } =
    trpc.factoryConstruction.getGameOutstandingOrders.useQuery(
      { gameId, gameTurnId: currentTurn?.id },
      { enabled: !!gameId }
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

    const factoriesByCompany = new Map<string, FactoryRow[]>();
    for (const factory of factories ?? []) {
      const sectorName = factory.Sector?.name ?? "Unknown";
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
        companyName: factory.company?.name ?? "Unknown",
        symbol: factory.company?.stockSymbol ?? "—",
        sectorName,
        brandScore: factory.company?.brandScore ?? 0,
        color: sectorColors[sectorName] ?? "#52525b",
        served: stats?.served ?? 0,
        revenue: stats?.revenue ?? 0,
        profit: stats?.profit ?? 0,
      };
      const list = factoriesByCompany.get(factory.companyId) ?? [];
      list.push(row);
      factoriesByCompany.set(factory.companyId, list);
    }

    const queuedByCompany = new Map<string, QueuedBuild[]>();
    for (const order of queuedOrders ?? []) {
      const list = queuedByCompany.get(order.companyId) ?? [];
      list.push({
        id: order.id,
        size: order.size,
        resourceTypes: order.resourceTypes ?? [],
      });
      queuedByCompany.set(order.companyId, list);
    }

    /**
     * Companies with a factory need a row; so do companies you run, since their
     * empty plots are the whole point of this panel.
     */
    const rows: CompanyGroup[] = [];
    for (const company of gameState.Company ?? []) {
      const built = factoriesByCompany.get(company.id) ?? [];
      const isMine = !!authPlayer && company.ceoId === authPlayer.id;
      if (built.length === 0 && !isMine) continue;
      if (company.status === CompanyStatus.BANKRUPT) continue;

      const sector = gameState.sectors.find((s) => s.id === company.sectorId);
      const sectorName = sector?.name ?? "Unknown";
      const stage = getResearchStageFromMarker(sector?.researchMarker ?? 0);
      const plan = getFactorySlotPlan(stage);
      const operable =
        company.status === CompanyStatus.ACTIVE ||
        company.status === CompanyStatus.INSOLVENT;
      // Queued builds have no slot until they resolve, so they reserve the
      // leftmost open plots to show what the tableau will look like.
      const queue = [...(queuedByCompany.get(company.id) ?? [])];

      rows.push({
        companyId: company.id,
        symbol: company.stockSymbol,
        companyName: company.name,
        sectorName,
        sectorEnum: sector?.sectorName ?? "",
        color: sectorColors[sectorName] ?? "#52525b",
        cashOnHand: company.cashOnHand,
        isMine,
        canBuild: isMine && operable && isOperationsPhase,
        slots: plan.map((phase, index) => {
          const factory = built.find((row) => row.slot === index + 1);
          return {
            slotNumber: index + 1,
            phase,
            factory,
            queued: factory ? undefined : queue.shift(),
          };
        }),
        workers: built.reduce((sum, row) => sum + row.workers, 0),
      });
    }

    return rows.sort(
      (a, b) =>
        Number(b.isMine) - Number(a.isMine) ||
        a.sectorName.localeCompare(b.sectorName) ||
        a.symbol.localeCompare(b.symbol)
    );
  }, [
    factories,
    production,
    queuedOrders,
    gameState.Company,
    gameState.sectors,
    authPlayer,
    isOperationsPhase,
  ]);

  const totals = useMemo(() => {
    const rows = groups.flatMap((group) =>
      group.slots.flatMap((slot) => (slot.factory ? [slot.factory] : []))
    );
    return {
      count: rows.length,
      workers: rows.reduce((sum, row) => sum + row.workers, 0),
      served: rows.reduce((sum, row) => sum + row.served, 0),
      capacity: rows
        .filter((row) => row.isOperational)
        .reduce((sum, row) => sum + FACTORY_CUSTOMER_LIMITS[row.size], 0),
      building: rows.filter((row) => !row.isOperational).length,
      rusted: rows.filter((row) => row.isRusted).length,
      openPlots: groups
        .filter((group) => group.canBuild)
        .reduce(
          (sum, group) =>
            sum + group.slots.filter((slot) => !slot.factory).length,
          0
        ),
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
          ? `${totals.count} built · ${totals.workers} workers · ${totals.served}/${totals.capacity} served`
          : "Nothing built yet"
      }
      focus={focus}
      className={className}
      actions={
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
          {totals.building > 0 && (
            <span className="text-zinc-500">{totals.building} building</span>
          )}
          {totals.rusted > 0 && (
            <span className="text-amber-400">{totals.rusted} rusted</span>
          )}
          {totals.openPlots > 0 && (
            <span className="flex items-center gap-1 text-orange-300">
              <RiHammerFill size={11} />
              {totals.openPlots} open
            </span>
          )}
        </span>
      }
      bodyClassName="p-1"
    >
      {groups.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-zinc-600">
          No factories have been built yet.
        </p>
      ) : (
        <div
          className="flex flex-wrap content-start gap-1.5 overflow-y-auto scrollbar"
          style={{ maxHeight: TRACK_COLUMN_HEIGHT + 30 }}
        >
          {groups.map((group) => (
            <div
              key={group.companyId}
              className={cn(
                "flex min-w-0 flex-col gap-1 rounded border bg-zinc-900/40 p-1.5",
                group.canBuild
                  ? "border-orange-700/50"
                  : "border-zinc-800/80"
              )}
            >
              <span className="flex items-center gap-1.5 leading-none">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-xs font-bold text-zinc-100">
                  {group.symbol}
                </span>
                {group.isMine && (
                  <span title="You are the CEO">
                    <RiVipCrown2Fill
                      size={11}
                      className="shrink-0 text-amber-400"
                    />
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2 pl-2 text-[10px] tabular-nums text-zinc-500">
                  {group.canBuild && <span>${group.cashOnHand}</span>}
                  <span className="flex items-center gap-0.5">
                    <RiGroupFill size={10} />
                    {group.workers}
                  </span>
                </span>
              </span>
              <div className="flex items-stretch gap-1.5">
                {group.slots.map((slot) =>
                  slot.factory ? (
                    <FactoryChip
                      key={slot.slotNumber}
                      factory={slot.factory}
                      capacity={FACTORY_CUSTOMER_LIMITS[slot.factory.size]}
                      onOpen={() => setOpenFactory(slot.factory!)}
                    />
                  ) : slot.queued ? (
                    <QueuedChip key={slot.slotNumber} build={slot.queued} />
                  ) : (
                    <EmptySlot
                      key={slot.slotNumber}
                      label={factorySlotLabel(slot.phase)}
                      canBuild={group.canBuild}
                      onOpen={() =>
                        setBuildTarget({
                          companyId: group.companyId,
                          companyName: group.companyName,
                          symbol: group.symbol,
                          sectorName: group.sectorName,
                          sectorEnum: group.sectorEnum,
                          color: group.color,
                          slotNumber: slot.slotNumber,
                          phase: slot.phase,
                          cashOnHand: group.cashOnHand,
                        })
                      }
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BoardBuildModal
        target={buildTarget}
        onClose={() => setBuildTarget(null)}
      />

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
