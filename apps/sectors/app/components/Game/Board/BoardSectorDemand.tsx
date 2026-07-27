"use client";

import { useMemo } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { FACTORY_CUSTOMER_LIMITS } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { FactorySize } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { formatEnumLabel } from "@sectors/app/helpers/labels";
import { RiGroupFill, RiTimeFill } from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { ResourceGlyph } from "./ResourceGlyph";

const SIZE_LABEL: Record<FactorySize, string> = {
  [FactorySize.FACTORY_I]: "I",
  [FactorySize.FACTORY_II]: "II",
  [FactorySize.FACTORY_III]: "III",
  [FactorySize.FACTORY_IV]: "IV",
};

export interface BagMarker {
  sectorId: string;
  resourceType: string;
  isPermanent: boolean;
}

export interface SectorDemandTarget {
  sectorId: string;
  sectorName: string;
  color: string;
}

interface MarkerGroup {
  type: string;
  permanent: number;
  temporary: number;
}

/** Bag contents for one sector, collapsed to one pill per material. */
export function groupMarkers(
  markers: BagMarker[] | undefined,
  sectorId: string
): MarkerGroup[] {
  const byType = new Map<string, MarkerGroup>();
  for (const marker of markers ?? []) {
    if (marker.sectorId !== sectorId) continue;
    const group = byType.get(marker.resourceType) ?? {
      type: marker.resourceType,
      permanent: 0,
      temporary: 0,
    };
    if (marker.isPermanent) group.permanent += 1;
    else group.temporary += 1;
    byType.set(marker.resourceType, group);
  }
  return [...byType.values()].sort(
    (a, b) => b.permanent + b.temporary - (a.permanent + a.temporary)
  );
}

/**
 * A sector's demand at a glance: what its consumption bag holds, how many
 * customers are shopping and how many are stuck waiting. Pressing it explains
 * where those customers will go.
 */
export function SectorDemandStrip({
  groups,
  consumers,
  waiting,
  served,
  onOpen,
}: {
  groups: MarkerGroup[];
  consumers: number;
  waiting: number;
  served: number;
  onOpen: () => void;
}) {
  const total = groups.reduce(
    (sum, group) => sum + group.permanent + group.temporary,
    0
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      title="Consumption bag — press for how customers are routed"
      className="mb-1 flex min-w-0 items-center gap-1 rounded px-0.5 py-0.5 text-left transition-colors hover:bg-black/25"
    >
      {total === 0 ? (
        <span className="text-[9px] text-zinc-600">empty bag</span>
      ) : (
        groups.map((group) => (
          <span
            key={group.type}
            title={`${formatEnumLabel(group.type)} · ${group.permanent} permanent${
              group.temporary ? ` · ${group.temporary} from marketing` : ""
            }`}
            className={cn(
              "flex shrink-0 items-center gap-0.5 rounded bg-black/35 px-1 py-px text-[9px] leading-none tabular-nums text-zinc-300",
              group.temporary > 0 && "ring-1 ring-fuchsia-500/60"
            )}
          >
            <ResourceGlyph type={group.type} size={7} />
            {group.permanent + group.temporary}
            {group.temporary > 0 && (
              <span className="text-fuchsia-300">+{group.temporary}</span>
            )}
          </span>
        ))
      )}
      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[9px] tabular-nums">
        {served > 0 && (
          <span className="text-emerald-400" title="Served this turn">
            {served} served
          </span>
        )}
        <span className="flex items-center gap-0.5 text-zinc-400" title="Customers shopping">
          <RiGroupFill size={9} />
          {consumers}
        </span>
        {waiting > 0 && (
          <span
            className="flex items-center gap-0.5 text-amber-400"
            title="Customers who could not be served and are waiting"
          >
            <RiTimeFill size={9} />
            {waiting}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * The whole consumption story for one sector: what is in the bag, which
 * factories can take which customers, and the order they get picked in.
 */
export function BoardSectorDemandModal({
  target,
  markers,
  onClose,
}: {
  target: SectorDemandTarget | null;
  markers: BagMarker[] | undefined;
  onClose: () => void;
}) {
  const { gameId, gameState, currentTurn } = useGame();

  const { data: factories } = trpc.factory.getGameFactories.useQuery(
    { gameId },
    { enabled: !!gameId && !!target }
  );
  const { data: resources } = trpc.resource.getGameResources.useQuery(
    { gameId },
    { enabled: !!gameId && !!target }
  );
  const { data: production } =
    trpc.factoryProduction.getGameTurnProduction.useQuery(
      { gameId, gameTurnId: currentTurn?.id ?? "" },
      { enabled: !!gameId && !!currentTurn?.id && !!target }
    );

  const priceByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const resource of resources ?? []) {
      map.set(resource.type, resource.price);
    }
    return map;
  }, [resources]);

  const sector = gameState.sectors.find((s) => s.id === target?.sectorId);
  const groups = useMemo(
    () => groupMarkers(markers, target?.sectorId ?? ""),
    [markers, target?.sectorId]
  );
  const totalMarkers = groups.reduce(
    (sum, group) => sum + group.permanent + group.temporary,
    0
  );

  /** Factories ranked the way the consumption step ranks them. */
  const contenders = useMemo(() => {
    if (!target) return [];
    const servedByFactory = new Map<string, number>();
    for (const row of production ?? []) {
      servedByFactory.set(
        row.factoryId,
        (servedByFactory.get(row.factoryId) ?? 0) + row.customersServed
      );
    }
    return (factories ?? [])
      .filter(
        (factory) => factory.sectorId === target.sectorId && factory.isOperational
      )
      .map((factory) => {
        const unitPrice = (factory.resourceTypes ?? []).reduce(
          (sum, type) => sum + (priceByType.get(type) ?? 0),
          0
        );
        const brand = factory.company?.brandScore ?? 0;
        return {
          id: factory.id,
          symbol: factory.company?.stockSymbol ?? "—",
          size: factory.size,
          slot: factory.slot,
          resourceTypes: factory.resourceTypes ?? [],
          unitPrice,
          brand,
          attraction: unitPrice - brand,
          stockPrice: factory.company?.currentStockPrice ?? 0,
          served: servedByFactory.get(factory.id) ?? 0,
          capacity: FACTORY_CUSTOMER_LIMITS[factory.size] ?? 0,
        };
      })
      .sort(
        (a, b) =>
          a.attraction - b.attraction ||
          b.stockPrice - a.stockPrice ||
          a.slot - b.slot
      );
  }, [factories, production, priceByType, target]);

  return (
    <Modal
      isOpen={!!target}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      scrollBehavior="inside"
      className="dark bg-zinc-950 text-foreground"
    >
      <ModalContent>
        {target && (
          <>
            <ModalHeader className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: target.color }}
                />
                {target.sectorName} demand
              </div>
              <span className="text-xs font-normal text-zinc-400">
                {sector?.consumers ?? 0} shopping · {sector?.waitingArea ?? 0}{" "}
                waiting · demand {(sector?.demand ?? 0) + (sector?.demandBonus ?? 0)}{" "}
                · {totalMarkers} markers in the bag
              </span>
            </ModalHeader>
            <ModalBody className="gap-4 pb-5 text-sm text-zinc-300">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Consumption bag
                </span>
                {groups.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    This bag is empty, so no customers can be matched here.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {groups.map((group) => (
                      <span
                        key={group.type}
                        className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-xs"
                      >
                        <ResourceGlyph type={group.type} size={9} />
                        {formatEnumLabel(group.type)}
                        <span className="tabular-nums text-zinc-400">
                          ×{group.permanent + group.temporary}
                        </span>
                        {group.temporary > 0 && (
                          <span
                            className="tabular-nums text-fuchsia-300"
                            title="Temporary markers added by marketing, removed once used"
                          >
                            {group.temporary} temp
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs leading-relaxed text-zinc-500">
                  Each shopper draws one marker. Permanent markers stay in the
                  bag; marketing adds temporary ones that disappear once they
                  bring a customer in. A factory can take that customer only if
                  its blueprint contains the drawn material.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Who gets the customers
                </span>
                {contenders.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No operational factories in this sector yet.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
                        <th className="pb-1">Factory</th>
                        <th className="pb-1">Accepts</th>
                        <th className="pb-1 text-right">Unit price</th>
                        <th className="pb-1 text-right">Brand</th>
                        <th className="pb-1 text-right">Attraction</th>
                        <th className="pb-1 text-right">Served</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contenders.map((factory) => (
                        <tr
                          key={factory.id}
                          className="border-t border-zinc-800/80"
                        >
                          <td className="py-1.5 font-semibold text-zinc-200">
                            {factory.symbol}{" "}
                            <span className="font-normal text-zinc-500">
                              {SIZE_LABEL[factory.size]}
                            </span>
                          </td>
                          <td className="py-1.5">
                            <span className="flex items-center gap-1">
                              {factory.resourceTypes.map((type, index) => (
                                <ResourceGlyph
                                  key={`${type}-${index}`}
                                  type={type}
                                  size={8}
                                />
                              ))}
                            </span>
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            ${factory.unitPrice}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-emerald-400">
                            −{factory.brand}
                          </td>
                          <td className="py-1.5 text-right font-semibold tabular-nums text-amber-400">
                            {factory.attraction}
                          </td>
                          <td
                            className={cn(
                              "py-1.5 text-right tabular-nums",
                              factory.served >= factory.capacity
                                ? "text-emerald-400"
                                : "text-zinc-400"
                            )}
                          >
                            {factory.served}/{factory.capacity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="text-xs leading-relaxed text-zinc-500">
                  Among the factories that accept the drawn material, the lowest
                  attraction wins, then the higher share price, then the lower
                  slot. A customer nobody can serve goes to the waiting area, and
                  when that overflows the sector loses a point of demand.
                </p>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

/** Sector colour lookup shared with the map. */
export function sectorColorFor(name: string): string {
  return sectorColors[name] ?? "#52525b";
}
