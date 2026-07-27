"use client";

import { useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import {
  getResourcePriceForResourceType,
  getSectorResourceForSectorName,
} from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import {
  ResourceTrackType,
  ResourceType,
  SectorName,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { formatEnumLabel } from "@sectors/app/helpers/labels";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { BoardSection } from "./BoardSection";
import type { FocusLevel } from "./boardFocus";

const GLOBAL_RESOURCE_COLOR: Partial<Record<string, string>> = {
  TRIANGLE: "#fbbf24",
  SQUARE: "#38bdf8",
  CIRCLE: "#34d399",
};

const RESOURCE_SECTOR_NAME: Partial<Record<string, string>> = {
  MATERIALS: "Materials",
  INDUSTRIALS: "Industrial",
  CONSUMER_DISCRETIONARY: "Consumer Discretionary",
  CONSUMER_STAPLES: "Consumer Staples",
  CONSUMER_CYCLICAL: "Consumer Cyclical",
  CONSUMER_DEFENSIVE: "Consumer Defensive",
  ENERGY: "Energy",
  HEALTHCARE: "Healthcare",
  TECHNOLOGY: "Technology",
};

function resourceColor(type: string): string {
  const sectorName = RESOURCE_SECTOR_NAME[type];
  if (sectorName && sectorColors[sectorName]) return sectorColors[sectorName];
  return GLOBAL_RESOURCE_COLOR[type] ?? "#71717a";
}

function shortLabel(type: string): string {
  return formatEnumLabel(type)
    .replace("Consumer ", "C. ")
    .replace("Discretionary", "Disc.")
    .replace("Industrials", "Indust.")
    .replace("Technology", "Tech");
}

interface ResourceRow {
  id: string;
  type: string;
  price: number;
  trackType: string;
  trackPosition?: number;
}

interface ResourceDetail extends ResourceRow {
  track: number[];
  color: string;
  isSector: boolean;
  factories: number;
  researchMilestones: number;
}

/** One resource's price track drawn as a vertical column, dearest at the top. */
function ResourceColumn({
  resource,
  onOpen,
}: {
  resource: ResourceDetail;
  onOpen: () => void;
}) {
  const currentIndex = resource.track.indexOf(resource.price);
  const cells = [...resource.track].reverse();

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${formatEnumLabel(resource.type)} · $${resource.price}`}
      className="group flex min-w-0 flex-1 basis-0 flex-col items-stretch gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 p-1 transition-colors hover:border-zinc-600"
    >
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="h-1.5 w-full rounded-full"
          style={{ backgroundColor: resource.color }}
        />
        <span className="w-full truncate text-center text-[9px] font-medium uppercase tracking-wide text-zinc-400">
          {shortLabel(resource.type)}
        </span>
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: resource.color }}
        >
          ${resource.price}
        </span>
      </div>
      <div className="flex flex-col gap-px">
        {cells.map((price, reversedIndex) => {
          const index = resource.track.length - 1 - reversedIndex;
          const isFilled = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <span
              key={`${price}-${index}`}
              className={cn(
                "relative flex h-3.5 items-center justify-center rounded-[2px] border text-[8px] tabular-nums",
                isFilled
                  ? "border-black/40 font-semibold text-black/80"
                  : "border-zinc-700/60 bg-zinc-800/40 text-zinc-500",
                isCurrent && "ring-1 ring-white/70"
              )}
              style={
                isFilled ? { backgroundColor: resource.color } : undefined
              }
            >
              {price}
            </span>
          );
        })}
      </div>
    </button>
  );
}

/**
 * The resource market: every resource price track side by side as a column, so
 * relative costs read at a glance.
 */
export function BoardResourceColumns({ focus }: { focus: FocusLevel }) {
  const { gameId } = useGame();
  const [openResource, setOpenResource] = useState<ResourceDetail | null>(null);

  const { data: resources } = trpc.resource.getGameResources.useQuery(
    { gameId },
    { enabled: !!gameId }
  );
  const { data: factories } = trpc.factory.getGameFactories.useQuery(
    { gameId },
    { enabled: !!gameId }
  );
  const { data: sectors } = trpc.sector.listSectors.useQuery(
    { where: { gameId } },
    { enabled: !!gameId }
  );

  /** Where each sector resource's consumption came from, for the detail modal. */
  const consumption = useMemo(() => {
    const map = new Map<string, { factories: number; researchMilestones: number }>();
    if (!sectors) return map;

    for (const factory of factories ?? []) {
      const sector = sectors.find((s) => s.id === factory.sectorId);
      if (!sector) continue;
      const type = getSectorResourceForSectorName(sector.sectorName as SectorName);
      if (!type) continue;
      const current = map.get(type) ?? { factories: 0, researchMilestones: 0 };
      map.set(type, { ...current, factories: current.factories + 1 });
    }

    for (const sector of sectors) {
      const type = getSectorResourceForSectorName(sector.sectorName as SectorName);
      if (!type) continue;
      const marker = sector.researchMarker ?? 0;
      const stage = marker >= 10 ? 4 : marker >= 7 ? 3 : marker >= 4 ? 2 : 1;
      const current = map.get(type) ?? { factories: 0, researchMilestones: 0 };
      map.set(type, { ...current, researchMilestones: Math.max(0, stage - 1) });
    }

    return map;
  }, [factories, sectors]);

  const columns = useMemo<ResourceDetail[]>(() => {
    const rows = (resources ?? []) as ResourceRow[];
    return rows
      .map((resource) => {
        const breakdown = consumption.get(resource.type);
        return {
          ...resource,
          track: getResourcePriceForResourceType(resource.type as ResourceType),
          color: resourceColor(resource.type),
          isSector: resource.trackType === ResourceTrackType.SECTOR,
          factories: breakdown?.factories ?? 0,
          researchMilestones: breakdown?.researchMilestones ?? 0,
        };
      })
      .filter((resource) => resource.track.length > 0)
      .sort((a, b) => {
        if (a.isSector !== b.isSector) return a.isSector ? 1 : -1;
        return a.type.localeCompare(b.type);
      });
  }, [resources, consumption]);

  const generalColumns = columns.filter((column) => !column.isSector);
  const sectorColumns = columns.filter((column) => column.isSector);

  return (
    <BoardSection
      title="Resource market"
      hint="General resources cheapen as they are consumed; sector resources only rise with research"
      focus={focus}
      bodyClassName="p-1.5"
    >
      {columns.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-zinc-600">
          No resource tracks in play.
        </p>
      ) : (
        <div className="flex items-start gap-2">
          {generalColumns.length > 0 && (
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                General
              </span>
              <div className="flex items-start gap-1">
                {generalColumns.map((resource) => (
                  <ResourceColumn
                    key={resource.id}
                    resource={resource}
                    onOpen={() => setOpenResource(resource)}
                  />
                ))}
              </div>
            </div>
          )}
          {sectorColumns.length > 0 && (
            <div className="flex min-w-0 flex-[2] flex-col gap-1 border-l border-zinc-800 pl-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                Sector
              </span>
              <div className="flex items-start gap-1">
                {sectorColumns.map((resource) => (
                  <ResourceColumn
                    key={resource.id}
                    resource={resource}
                    onOpen={() => setOpenResource(resource)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!openResource}
        onOpenChange={(open) => !open && setOpenResource(null)}
        className="dark bg-zinc-950 text-foreground"
      >
        <ModalContent>
          {openResource && (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: openResource.color }}
                  />
                  {formatEnumLabel(openResource.type)}
                </div>
                <span className="text-xs font-normal text-zinc-400">
                  ${openResource.price} ·{" "}
                  {openResource.isSector ? "sector resource" : "general resource"}
                </span>
              </ModalHeader>
              <ModalBody className="gap-3 pb-5 text-sm text-zinc-300">
                {openResource.isSector ? (
                  <p className="leading-relaxed">
                    Research is the only thing that raises a sector resource&apos;s
                    value — each research action adds one. Consuming it in factory
                    construction does not move the track, so a well-researched
                    sector is an expensive one to build in.
                  </p>
                ) : (
                  <p className="leading-relaxed">
                    Every time this resource is consumed in factory construction
                    the track steps down, making it cheaper. Heavily used general
                    resources become the affordable ones.
                  </p>
                )}
                {(openResource.factories > 0 ||
                  openResource.researchMilestones > 0) && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <dt className="text-zinc-500">Consumed by factories</dt>
                    <dd className="text-right tabular-nums text-orange-400">
                      {openResource.factories}
                    </dd>
                    <dt className="text-zinc-500">Consumed by research stages</dt>
                    <dd className="text-right tabular-nums text-sky-400">
                      {openResource.researchMilestones}
                    </dd>
                  </dl>
                )}
                <div className="flex flex-wrap gap-1">
                  {openResource.track.map((price, index) => (
                    <span
                      key={`${price}-${index}`}
                      className={cn(
                        "flex h-8 w-10 items-center justify-center rounded border text-xs tabular-nums",
                        index <= openResource.track.indexOf(openResource.price)
                          ? "border-black/40 font-semibold text-black/80"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400"
                      )}
                      style={
                        index <= openResource.track.indexOf(openResource.price)
                          ? { backgroundColor: openResource.color }
                          : undefined
                      }
                    >
                      ${price}
                    </span>
                  ))}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </BoardSection>
  );
}
