"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { RiArrowDownSFill, RiArrowUpSFill } from "@remixicon/react";
import { stockGridPrices } from "@server/data/constants";
import {
  OrderStatus,
  OrderType,
  PhaseName,
  ShareLocation,
} from "@server/prisma/prisma.client";
import type {
  CompanyWithRelations,
  PlayerOrderWithPlayerRevealed,
} from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { hashStringToColor } from "@sectors/app/helpers";
import { createPlayerAvatarUri } from "../../Player/PlayerAvatar";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";

const IPO_COLOR = "#f59e0b";
const MARKET_COLOR = "#38bdf8";
const SHORT_COLOR = "#f43f5e";

/** Where one block of a company's shares sits, and how it just changed. */
interface LedgerRow {
  key: string;
  label: string;
  title: string;
  color: string;
  count: number;
  delta: number;
  isAuth: boolean;
  /** Set for shareholders; the piles get a plain coloured disc instead. */
  avatar?: string;
}

export interface CompanyShareFlow {
  /** Signed share change per player id. */
  byPlayer: Map<string, number>;
  ipoDelta: number;
  marketDelta: number;
  bought: number;
  sold: number;
  /** Spaces the price moved on the chart this phase; negative is down. */
  steps: number;
  priceBefore: number | null;
  priceAfter: number | null;
}

/** Phases where shares change hands and prices step along the chart. */
export function isStockResolvePhase(phaseName: PhaseName | undefined): boolean {
  return (
    phaseName === PhaseName.STOCK_RESOLVE_MARKET_ORDER ||
    phaseName === PhaseName.STOCK_RESOLVE_LIMIT_ORDER ||
    phaseName === PhaseName.STOCK_RESOLVE_PENDING_SHORT_ORDER ||
    phaseName === PhaseName.STOCK_RESOLVE_OPTION_ORDER
  );
}

/**
 * What the resolution just did to each company: which players gained or lost
 * shares, how the IPO and market piles changed, and how far the price stepped.
 */
export function useShareFlows(
  companies: CompanyWithRelations[]
): Map<string, CompanyShareFlow> {
  const { gameId, currentPhase } = useGame();
  const active = isStockResolvePhase(currentPhase?.name);
  const stockRoundId = currentPhase?.stockRoundId ?? undefined;

  const { data: orders } =
    trpc.playerOrder.listPlayerOrdersWithPlayerRevealed.useQuery(
      { where: { stockRoundId }, gameId },
      { enabled: !!stockRoundId && active, retry: false }
    );

  return useMemo(() => {
    const flows = new Map<string, CompanyShareFlow>();
    if (!active) return flows;

    const flowFor = (companyId: string) => {
      const existing = flows.get(companyId);
      if (existing) return existing;
      const created: CompanyShareFlow = {
        byPlayer: new Map(),
        ipoDelta: 0,
        marketDelta: 0,
        bought: 0,
        sold: 0,
        steps: 0,
        priceBefore: null,
        priceAfter: null,
      };
      flows.set(companyId, created);
      return created;
    };

    // Fills from earlier sub-rounds are already settled, so only this
    // sub-round's trades get animated.
    const subRoundId = currentPhase?.stockSubRoundId ?? null;

    for (const order of (orders ?? []) as PlayerOrderWithPlayerRevealed[]) {
      if (order.orderType !== OrderType.MARKET) continue;
      if (order.orderStatus !== OrderStatus.FILLED) continue;
      if (subRoundId && order.stockSubRoundId !== subRoundId) continue;
      const quantity = order.realizedQuantity ?? order.quantity ?? 0;
      if (quantity <= 0) continue;

      const flow = flowFor(order.companyId);
      const signed = order.isSell ? -quantity : quantity;
      flow.byPlayer.set(
        order.playerId,
        (flow.byPlayer.get(order.playerId) ?? 0) + signed
      );
      if (order.isSell) {
        flow.sold += quantity;
        flow.marketDelta += quantity;
      } else {
        flow.bought += quantity;
        if (order.location === ShareLocation.IPO) flow.ipoDelta -= quantity;
        else flow.marketDelta -= quantity;
      }
    }

    // Price movement comes from the history rows written by this very phase; the
    // row before them is where the company started.
    for (const company of companies) {
      const history = [...(company.StockHistory ?? [])].sort(
        (a, b) => a.id - b.id
      );
      const firstIndex = history.findIndex(
        (row) => row.phaseId === currentPhase?.id
      );
      if (firstIndex === -1) continue;
      const flow = flowFor(company.id);
      const before = history[firstIndex - 1]?.price ?? null;
      const after = history[history.length - 1]?.price ?? null;
      flow.priceBefore = before;
      flow.priceAfter = after;
      if (before != null && after != null) {
        flow.steps =
          stockGridPrices.indexOf(after) - stockGridPrices.indexOf(before);
      }
    }

    return flows;
  }, [active, orders, companies, currentPhase?.id, currentPhase?.stockSubRoundId]);
}

function playerColor(nickname: string): string {
  return `#${hashStringToColor(nickname)}`;
}

/**
 * Avatars are drawn from the nickname, so the same picture the player has in the
 * top bar can be reused on every tile without generating it over and over.
 */
const avatarCache = new Map<string, string>();
function playerAvatar(nickname: string): string {
  const cached = avatarCache.get(nickname);
  if (cached) return cached;
  const uri = createPlayerAvatarUri(nickname, 24);
  avatarCache.set(nickname, uri);
  return uri;
}

/** One share, drawn as a pip; freshly moved pips arrive with a flourish. */
function Pip({
  color,
  isNew,
  index,
}: {
  color: string;
  isNew: boolean;
  index: number;
}) {
  if (!isNew) {
    return (
      <span
        className="h-[7px] w-[7px] rounded-sm border border-black/40"
        style={{ backgroundColor: color }}
      />
    );
  }
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.3, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 320 }}
      className="h-[7px] w-[7px] rounded-sm border border-white/70 shadow-[0_0_5px_rgba(255,255,255,0.7)]"
      style={{ backgroundColor: color }}
    />
  );
}

/**
 * Every share in the company, stacked as a column under its tile: the IPO pile,
 * the open market, and a row per shareholder. During a resolution the rows show
 * what each player just gained or gave up.
 */
export function ShareLedger({
  company,
  flow,
  onOpen,
}: {
  company: CompanyWithRelations;
  flow?: CompanyShareFlow;
  onOpen: () => void;
}) {
  const { authPlayer } = useGame();

  const rows = useMemo<LedgerRow[]>(() => {
    const shares = company.Share ?? [];
    const ipo = shares.filter(
      (share) => share.location === ShareLocation.IPO
    ).length;
    const market = shares.filter(
      (share) => share.location === ShareLocation.OPEN_MARKET
    ).length;

    const byPlayer = new Map<
      string,
      { nickname: string; owned: number; shorted: number }
    >();
    for (const share of shares) {
      if (share.location !== ShareLocation.PLAYER || !share.playerId) continue;
      const entry = byPlayer.get(share.playerId) ?? {
        nickname: share.Player?.nickname ?? "player",
        owned: 0,
        shorted: 0,
      };
      if (share.shortOrderId) entry.shorted += 1;
      else entry.owned += 1;
      byPlayer.set(share.playerId, entry);
    }

    const built: LedgerRow[] = [];
    if (ipo > 0) {
      built.push({
        key: "ipo",
        label: "IPO",
        title: `${ipo} share${ipo === 1 ? "" : "s"} still held by the company at $${
          company.ipoAndFloatPrice ?? 0
        }`,
        color: IPO_COLOR,
        count: ipo,
        delta: flow?.ipoDelta ?? 0,
        isAuth: false,
      });
    }
    if (market > 0 || (flow?.marketDelta ?? 0) !== 0) {
      built.push({
        key: "market",
        label: "MKT",
        title: `${market} share${market === 1 ? "" : "s"} on the open market at $${
          company.currentStockPrice ?? 0
        }`,
        color: MARKET_COLOR,
        count: market,
        delta: flow?.marketDelta ?? 0,
        isAuth: false,
      });
    }

    const shorted = [...byPlayer.values()].reduce(
      (sum, entry) => sum + entry.shorted,
      0
    );

    for (const [playerId, entry] of [...byPlayer.entries()].sort(
      (a, b) => b[1].owned - a[1].owned
    )) {
      if (entry.owned === 0) continue;
      const isAuth = playerId === authPlayer?.id;
      built.push({
        key: playerId,
        label: isAuth ? "You" : entry.nickname,
        title: `${entry.nickname} holds ${entry.owned} share${
          entry.owned === 1 ? "" : "s"
        }`,
        color: playerColor(entry.nickname),
        count: entry.owned,
        delta: flow?.byPlayer.get(playerId) ?? 0,
        isAuth,
        avatar: playerAvatar(entry.nickname),
      });
    }

    if (shorted > 0) {
      built.push({
        key: "short",
        label: "SHORT",
        title: `${shorted} share${shorted === 1 ? "" : "s"} borrowed against open short positions`,
        color: SHORT_COLOR,
        count: shorted,
        delta: 0,
        isAuth: false,
      });
    }

    return built;
  }, [company, flow, authPlayer?.id]);

  if (rows.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      title="Share register — press for the company detail"
      className="mt-px flex w-full flex-col gap-px rounded-b border-t border-black/40 bg-black/45 px-1 py-0.5 text-left transition-colors hover:bg-black/60"
    >
      {rows.map((row) => (
        <span
          key={row.key}
          title={row.title}
          className="flex min-w-0 items-center gap-1 leading-none"
        >
          {row.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.avatar}
              alt=""
              width={11}
              height={11}
              className={cn(
                "h-[11px] w-[11px] shrink-0 rounded-full",
                row.isAuth && "ring-1 ring-sky-300"
              )}
            />
          ) : (
            <span
              className="h-[9px] w-[9px] shrink-0 rounded-full border border-black/50"
              style={{ backgroundColor: row.color }}
            />
          )}
          <span
            className={cn(
              "w-[44px] shrink-0 truncate text-[8px] uppercase tracking-wide",
              row.isAuth ? "font-bold text-sky-300" : "text-zinc-400"
            )}
          >
            {row.label}
          </span>
          <span className="w-[8px] shrink-0 text-right text-[8px] font-bold tabular-nums text-zinc-200">
            {row.count}
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-px">
            {Array.from({ length: row.count }).map((_, index) => (
              <Pip
                key={index}
                color={row.color}
                isNew={row.delta > 0 && index >= row.count - row.delta}
                index={index - (row.count - Math.max(0, row.delta))}
              />
            ))}
          </span>
          {row.delta !== 0 && (
            <motion.span
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "shrink-0 text-[8px] font-bold tabular-nums",
                row.delta > 0 ? "text-emerald-300" : "text-rose-300"
              )}
            >
              {row.delta > 0 ? "+" : "−"}
              {Math.abs(row.delta)}
            </motion.span>
          )}
        </span>
      ))}
    </button>
  );
}

/**
 * What the resolution did to the share price, flashed over the company tile so
 * the move is impossible to miss while it happens.
 */
export function ShareFlowBanner({ flow }: { flow: CompanyShareFlow }) {
  const hasTrades = flow.bought > 0 || flow.sold > 0;
  if (!hasTrades && flow.steps === 0) return null;

  const up = flow.steps > 0;
  const flat = flow.steps === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "mt-0.5 flex flex-wrap items-center gap-1 rounded border px-1 py-0.5 text-[8px] font-bold leading-none",
        flat
          ? "border-zinc-500/60 bg-zinc-800/80 text-zinc-200"
          : up
            ? "border-emerald-400/70 bg-emerald-500/25 text-emerald-100"
            : "border-rose-400/70 bg-rose-500/25 text-rose-100"
      )}
    >
      {hasTrades && (
        <span className="flex items-center gap-0.5">
          {flow.bought > 0 && (
            <span className="text-emerald-300">+{flow.bought}</span>
          )}
          {flow.sold > 0 && <span className="text-rose-300">−{flow.sold}</span>}
          <span className="text-zinc-300">traded</span>
        </span>
      )}
      {!flat && (
        <motion.span
          className="flex items-center gap-0.5"
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 0.6, repeat: 2 }}
        >
          {up ? <RiArrowUpSFill size={10} /> : <RiArrowDownSFill size={10} />}
          {Math.abs(flow.steps)}
          {flow.priceBefore != null && flow.priceAfter != null && (
            <span className="tabular-nums">
              ${flow.priceBefore}→${flow.priceAfter}
            </span>
          )}
        </motion.span>
      )}
      {flat && hasTrades && <span>price held</span>}
    </motion.div>
  );
}
