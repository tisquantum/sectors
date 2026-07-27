"use client";

import { useMemo, useState } from "react";
import { RiErrorWarningFill, RiSailboatFill } from "@remixicon/react";
import { sectorColors } from "@server/data/gameData";
import {
  CompanyStatus,
  OperationMechanicsVersion,
  OrderType,
  PhaseName,
  ShareLocation,
} from "@server/prisma/prisma.client";
import type {
  CompanyWithRelations,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerRevealed,
} from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { BoardSection } from "./BoardSection";
import type { FocusLevel } from "./boardFocus";
import type { OrderTarget } from "./BoardOrderModal";
import {
  BoardSectorDemandModal,
  SectorDemandStrip,
  groupMarkers,
  type SectorDemandTarget,
} from "./BoardSectorDemand";

/** A single order rendered as a tab on the edge of its company's tile. */
interface OrderTab {
  id: string;
  playerName: string;
  initials: string;
  /** Undisclosed orders show a placeholder until the reveal. */
  concealed: boolean;
  isSell: boolean;
  quantity: number | null;
  orderType: OrderType | null;
  isAuthPlayer: boolean;
}

const ORDER_TYPE_GLYPH: Record<OrderType, string> = {
  [OrderType.MARKET]: "M",
  [OrderType.LIMIT]: "L",
  [OrderType.SHORT]: "S",
  [OrderType.OPTION]: "O",
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Percent move from the float price; drives the finviz-style heat colour. */
function performanceOf(company: CompanyWithRelations): number | null {
  const ipo = company.ipoAndFloatPrice;
  const price = company.currentStockPrice;
  if (!ipo || !price) return null;
  return ((price - ipo) / ipo) * 100;
}

function heatColor(performance: number | null): string {
  if (performance === null) return "rgba(63,63,70,0.55)";
  const magnitude = Math.min(1, Math.abs(performance) / 60);
  const alpha = 0.18 + magnitude * 0.52;
  return performance >= 0
    ? `rgba(22,163,74,${alpha.toFixed(3)})`
    : `rgba(220,38,38,${alpha.toFixed(3)})`;
}

function OrderTabRail({
  tabs,
  accent,
  onOpen,
}: {
  tabs: OrderTab[];
  accent: string;
  onOpen: () => void;
}) {
  if (tabs.length === 0) return null;
  return (
    <div className="flex shrink-0 flex-col justify-start gap-px pt-1">
      {tabs.slice(0, 7).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={onOpen}
          title={
            tab.concealed
              ? `${tab.playerName} placed an order`
              : `${tab.playerName} · ${tab.isSell ? "sell" : "buy"} ${tab.quantity ?? "?"}${
                  tab.orderType ? ` (${tab.orderType.toLowerCase()})` : ""
                }`
          }
          className={cn(
            "flex h-[15px] items-center gap-0.5 overflow-hidden rounded-r-full border border-l-0 pl-0.5 pr-1 text-[8px] font-bold leading-none transition-all",
            "max-w-[18px] hover:max-w-[80px]",
            tab.concealed
              ? "border-zinc-600 bg-zinc-800 text-zinc-400"
              : tab.isSell
                ? "border-rose-700 bg-rose-900/90 text-rose-100"
                : "border-emerald-700 bg-emerald-900/90 text-emerald-100",
            tab.isAuthPlayer && "ring-1 ring-sky-400"
          )}
          style={
            tab.isAuthPlayer ? { boxShadow: `0 0 0 1px ${accent}` } : undefined
          }
        >
          <span className="shrink-0">
            {tab.concealed
              ? "?"
              : `${tab.isSell ? "−" : "+"}${tab.quantity ?? ""}`}
          </span>
          <span className="whitespace-nowrap opacity-90">
            {tab.initials}
            {tab.orderType ? ` ${ORDER_TYPE_GLYPH[tab.orderType]}` : ""}
          </span>
        </button>
      ))}
      {tabs.length > 7 && (
        <button
          type="button"
          onClick={onOpen}
          className="h-[15px] rounded-r-full border border-l-0 border-zinc-600 bg-zinc-800 px-1 text-[8px] font-bold text-zinc-400"
        >
          +{tabs.length - 7}
        </button>
      )}
    </div>
  );
}

/**
 * A company condensed to its essentials: symbol, price, move, float progress and
 * the shares available to buy. Orders hang off the right edge as tabs.
 */
function CompanyTile({
  company,
  tabs,
  weight,
  canOrder,
  ownedShares,
  onOpenCompany,
  onOpenOrder,
}: {
  company: CompanyWithRelations;
  tabs: OrderTab[];
  weight: number;
  canOrder: boolean;
  ownedShares: number;
  onOpenCompany: () => void;
  onOpenOrder: (isIpo: boolean) => void;
}) {
  const performance = performanceOf(company);
  const sectorColor = sectorColors[company.Sector.name] ?? "#52525b";
  const ipoShares = company.Share.filter(
    (share) => share.location === ShareLocation.IPO
  ).length;
  const marketShares = company.Share.filter(
    (share) => share.location === ShareLocation.OPEN_MARKET
  ).length;
  const isBankrupt = company.status === CompanyStatus.BANKRUPT;
  const isInactive = company.status === CompanyStatus.INACTIVE;
  const oversold = company.oversoldShares ?? 0;

  return (
    <div
      className="flex min-w-0 items-stretch"
      style={{ flexGrow: weight, flexBasis: "112px" }}
    >
      <button
        type="button"
        onClick={onOpenCompany}
        title={`${company.name} · $${company.currentStockPrice}`}
        className={cn(
          "relative flex min-w-0 flex-1 flex-col justify-between gap-0.5 rounded border-l-[3px] p-1 text-left transition-transform hover:z-10 hover:scale-[1.02]",
          isBankrupt && "opacity-50 grayscale",
          oversold > 0 && "ring-1 ring-rose-500"
        )}
        style={{
          backgroundColor: heatColor(performance),
          borderLeftColor: sectorColor,
        }}
      >
        <div className="flex min-w-0 items-baseline justify-between gap-1">
          <span className="truncate text-[11px] font-bold leading-none text-zinc-50">
            {company.stockSymbol}
          </span>
          {performance !== null && (
            <span
              className={cn(
                "shrink-0 text-[9px] font-semibold tabular-nums leading-none",
                performance >= 0 ? "text-emerald-300" : "text-rose-300"
              )}
            >
              {performance >= 0 ? "+" : ""}
              {performance.toFixed(0)}%
            </span>
          )}
        </div>

        <span className="text-[13px] font-bold leading-none tabular-nums text-zinc-50">
          ${company.currentStockPrice}
        </span>

        <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[8px] leading-none text-zinc-200/85">
          {ipoShares > 0 && (
            <span className="rounded bg-black/35 px-1 py-px tabular-nums">
              IPO {ipoShares}
            </span>
          )}
          <span className="rounded bg-black/35 px-1 py-px tabular-nums">
            MKT {marketShares}
          </span>
          {ownedShares > 0 && (
            <span className="rounded bg-sky-500/40 px-1 py-px font-semibold tabular-nums">
              You {ownedShares}
            </span>
          )}
          {isInactive && (
            <span className="flex items-center gap-0.5 rounded bg-amber-500/80 px-1 py-px font-semibold text-amber-950">
              <RiSailboatFill size={8} />
              {company.Sector.sharePercentageToFloat}%
            </span>
          )}
          {oversold > 0 && (
            <span className="flex items-center gap-0.5 rounded bg-rose-600/80 px-1 py-px font-semibold text-rose-50">
              <RiErrorWarningFill size={8} />
              {oversold}
            </span>
          )}
        </div>

        {isBankrupt && (
          <span className="absolute inset-x-1 top-1/2 -translate-y-1/2 rotate-[-12deg] border border-black/70 text-center text-[9px] font-black uppercase tracking-wider text-black/80">
            Bankrupt
          </span>
        )}

        {canOrder && (
          <div className="flex gap-0.5 pt-0.5">
            {ipoShares > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenOrder(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    onOpenOrder(true);
                  }
                }}
                className="flex-1 rounded bg-amber-500/90 px-1 py-0.5 text-center text-[8px] font-bold uppercase tracking-wide text-amber-950 transition-colors hover:bg-amber-400"
              >
                IPO
              </span>
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onOpenOrder(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                  onOpenOrder(false);
                }
              }}
              className="flex-1 rounded bg-sky-500/90 px-1 py-0.5 text-center text-[8px] font-bold uppercase tracking-wide text-sky-950 transition-colors hover:bg-sky-400"
            >
              Trade
            </span>
          </div>
        )}
      </button>

      <OrderTabRail tabs={tabs} accent={sectorColor} onOpen={onOpenCompany} />
    </div>
  );
}

/**
 * Every company on one map, grouped and sized like a market heat map: sector
 * blocks take space in proportion to their market value, and each tile is
 * shaded by how far the stock has moved from its float price.
 */
export function BoardSectorMap({
  companies,
  focus,
  onSelectCompany,
  onPlaceOrder,
}: {
  companies: CompanyWithRelations[];
  focus: FocusLevel;
  onSelectCompany: (companyId: string) => void;
  onPlaceOrder: (target: OrderTarget) => void;
}) {
  const {
    gameId,
    gameState,
    authPlayer,
    currentPhase,
    currentTurn,
    playersWithShares,
  } = useGame();
  const [demandTarget, setDemandTarget] = useState<SectorDemandTarget | null>(
    null
  );

  const stockRoundId = currentPhase?.stockRoundId ?? undefined;
  const ordersConcealed = !!gameState.playerOrdersConcealed;
  const isOrderPhase = currentPhase?.name === PhaseName.STOCK_ACTION_ORDER;
  const revealedBlocked =
    ordersConcealed &&
    (currentPhase?.name === PhaseName.STOCK_ACTION_ORDER ||
      currentPhase?.name === PhaseName.STOCK_ACTION_RESULT);

  const { data: revealedOrders } =
    trpc.playerOrder.listPlayerOrdersWithPlayerRevealed.useQuery(
      { where: { stockRoundId }, gameId },
      { enabled: !!stockRoundId && !revealedBlocked, retry: false }
    );
  const { data: concealedOrders } =
    trpc.playerOrder.listPlayerOrdersConcealed.useQuery(
      { where: { stockRoundId } },
      { enabled: !!stockRoundId && ordersConcealed, retry: false }
    );

  const isModern =
    gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN;

  const { data: bagMarkers } =
    trpc.consumptionMarker.getAllConsumptionBags.useQuery(
      { gameId },
      { enabled: !!gameId && isModern }
    );
  const { data: production } =
    trpc.factoryProduction.getGameTurnProduction.useQuery(
      { gameId, gameTurnId: currentTurn?.id ?? "" },
      { enabled: !!gameId && !!currentTurn?.id && isModern }
    );

  /** Customers served this turn, per sector, from the companies that serve them. */
  const servedBySector = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of production ?? []) {
      const sectorId = row.Factory?.sectorId;
      if (!sectorId) continue;
      map.set(sectorId, (map.get(sectorId) ?? 0) + row.customersServed);
    }
    return map;
  }, [production]);

  const ownedByCompany = useMemo(() => {
    const map = new Map<string, number>();
    const player = playersWithShares.find((p) => p.id === authPlayer?.id);
    for (const share of player?.Share ?? []) {
      if (share.shortOrderId) continue;
      map.set(share.companyId, (map.get(share.companyId) ?? 0) + 1);
    }
    return map;
  }, [playersWithShares, authPlayer?.id]);

  const tabsByCompany = useMemo(() => {
    const map = new Map<string, OrderTab[]>();
    const push = (companyId: string, tab: OrderTab) => {
      const list = map.get(companyId);
      if (list) list.push(tab);
      else map.set(companyId, [tab]);
    };

    for (const order of (revealedOrders ?? []) as PlayerOrderWithPlayerRevealed[]) {
      push(order.companyId, {
        id: `revealed-${order.id}`,
        playerName: order.Player.nickname,
        initials: initialsOf(order.Player.nickname),
        concealed: false,
        isSell: !!order.isSell,
        quantity: order.quantity ?? null,
        orderType: order.orderType,
        isAuthPlayer: order.playerId === authPlayer?.id,
      });
    }

    const revealedIds = new Set(
      ((revealedOrders ?? []) as PlayerOrderWithPlayerRevealed[]).map((o) => o.id)
    );

    for (const order of (concealedOrders ??
      []) as PlayerOrderConcealedWithPlayer[]) {
      if (revealedIds.has(order.id)) continue;
      push(order.companyId, {
        id: `concealed-${order.id}`,
        playerName: order.Player.nickname,
        initials: initialsOf(order.Player.nickname),
        concealed: true,
        isSell: false,
        quantity: null,
        orderType: null,
        isAuthPlayer: order.playerId === authPlayer?.id,
      });
    }

    // Your own orders from this phase are never hidden from you.
    for (const order of authPlayer?.PlayerOrder ?? []) {
      if (order.stockRoundId !== stockRoundId) continue;
      if (revealedIds.has(order.id)) continue;
      push(order.companyId, {
        id: `own-${order.id}`,
        playerName: `${authPlayer?.nickname ?? "You"} (you)`,
        initials: "YOU",
        concealed: false,
        isSell: !!order.isSell,
        quantity: order.quantity ?? null,
        orderType: order.orderType,
        isAuthPlayer: true,
      });
    }

    return map;
  }, [revealedOrders, concealedOrders, authPlayer, stockRoundId]);

  const sectorBlocks = useMemo(() => {
    const bySector = new Map<
      string,
      { name: string; color: string; value: number; companies: CompanyWithRelations[] }
    >();

    for (const company of companies) {
      const name = company.Sector.name;
      let block = bySector.get(company.sectorId);
      if (!block) {
        block = {
          name,
          color: sectorColors[name] ?? "#52525b",
          value: 0,
          companies: [],
        };
        bySector.set(company.sectorId, block);
      }
      block.value +=
        (company.currentStockPrice ?? 0) * Math.max(1, company.Share.length);
      block.companies.push(company);
    }

    for (const block of bySector.values()) {
      block.companies.sort(
        (a, b) => (b.currentStockPrice ?? 0) - (a.currentStockPrice ?? 0)
      );
    }

    return [...bySector.entries()]
      .map(([sectorId, block]) => ({ sectorId, ...block }))
      .sort((a, b) => b.value - a.value);
  }, [companies]);

  const totalValue = sectorBlocks.reduce((sum, block) => sum + block.value, 0) || 1;

  return (
    <BoardSection
      title="Companies"
      hint={
        isOrderPhase
          ? "Press IPO or Trade on a tile to place an order"
          : "Sized by market value, shaded by move from float price"
      }
      focus={focus}
      className="min-h-0 flex-1"
      bodyClassName="p-1.5 min-h-0 overflow-y-auto scrollbar"
    >
      {sectorBlocks.length === 0 ? (
        <p className="py-6 text-center text-[11px] text-zinc-600">
          No companies on the board yet.
        </p>
      ) : (
        <div className="flex flex-wrap items-stretch gap-1.5">
          {sectorBlocks.map((block) => {
            const liveSector = gameState.sectors.find(
              (sector) => sector.id === block.sectorId
            );
            const demand =
              (liveSector?.demand ?? 0) + (liveSector?.demandBonus ?? 0);
            const weight = Math.max(1, (block.value / totalValue) * 100);

            return (
              <div
                key={block.sectorId}
                className="flex min-w-[240px] flex-col rounded-md border p-1"
                style={{
                  flexGrow: weight,
                  flexBasis: "260px",
                  borderColor: `${block.color}80`,
                  backgroundColor: `${block.color}14`,
                }}
              >
                <div className="mb-1 flex items-baseline gap-2 px-0.5">
                  <span
                    className="truncate text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: block.color }}
                  >
                    {block.name}
                  </span>
                  <span className="shrink-0 text-[9px] tabular-nums text-zinc-400">
                    demand {demand}
                  </span>
                  <span className="shrink-0 text-[9px] tabular-nums text-zinc-500">
                    {liveSector?.consumers ?? 0} consumers
                  </span>
                  <span className="ml-auto shrink-0 text-[9px] tabular-nums text-zinc-600">
                    ${block.value}
                  </span>
                </div>
                {isModern && (
                  <SectorDemandStrip
                    groups={groupMarkers(bagMarkers, block.sectorId)}
                    consumers={liveSector?.consumers ?? 0}
                    waiting={liveSector?.waitingArea ?? 0}
                    served={servedBySector.get(block.sectorId) ?? 0}
                    onOpen={() =>
                      setDemandTarget({
                        sectorId: block.sectorId,
                        sectorName: block.name,
                        color: block.color,
                      })
                    }
                  />
                )}
                <div className="flex flex-1 flex-wrap items-stretch gap-1">
                  {block.companies.map((company) => (
                    <CompanyTile
                      key={company.id}
                      company={company}
                      tabs={tabsByCompany.get(company.id) ?? []}
                      weight={Math.max(
                        1,
                        ((company.currentStockPrice ?? 0) *
                          Math.max(1, company.Share.length)) /
                          block.value *
                          100
                      )}
                      canOrder={isOrderPhase && !!authPlayer}
                      ownedShares={ownedByCompany.get(company.id) ?? 0}
                      onOpenCompany={() => onSelectCompany(company.id)}
                      onOpenOrder={(isIpo) =>
                        onPlaceOrder({ company, isIpo })
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BoardSectorDemandModal
        target={demandTarget}
        markers={bagMarkers}
        onClose={() => setDemandTarget(null)}
      />
    </BoardSection>
  );
}
