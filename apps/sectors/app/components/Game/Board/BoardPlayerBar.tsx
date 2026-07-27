"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
} from "@nextui-org/react";
import {
  RiBankFill,
  RiClockwiseFill,
  RiScalesFill,
  RiWallet3Fill,
} from "@remixicon/react";
import { calculateNetWorth } from "@server/data/helpers";
import { DEFAULT_WORKERS, MAX_SHARE_PERCENTAGE } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import {
  EntityType,
  OperationMechanicsVersion,
  OrderType,
  PhaseName,
} from "@server/prisma/prisma.client";
import type { PlayerWithShares } from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { EVENT_PLAYER_READINESS_CHANGED } from "@server/pusher/pusher.types";
import type { PlayerReadiness } from "@server/data/constants";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import Timer from "../Timer";
import PlayerAvatar from "../../Player/PlayerAvatar";
import PlayerShares from "../../Player/PlayerShares";
import PlayerOverview from "../../Player/PlayerOverview";
import DebounceButton from "../../General/DebounceButton";
import {
  MoneyTransactionByEntityType,
  MoneyTransactionHistoryByPlayer,
} from "../MoneyTransactionHistory";
import { BoardSection, BoardStat } from "./BoardSection";
import type { FocusLevel } from "./boardFocus";
import { friendlyPhaseName } from "@sectors/app/helpers";

interface SectorHolding {
  sectorId: string;
  sectorName: string;
  color: string;
  shares: number;
  value: number;
  companies: { name: string; symbol: string; shares: number; value: number }[];
}

/** Shares the player holds, rolled up by sector and then by company. */
function useSectorHoldings(player: PlayerWithShares | undefined) {
  const { gameState } = useGame();
  return useMemo<SectorHolding[]>(() => {
    if (!player) return [];
    const bySector = new Map<string, SectorHolding>();

    for (const share of player.Share) {
      if (share.shortOrderId) continue;
      const company = share.Company;
      const sector = gameState.sectors.find((s) => s.id === company.sectorId);
      const sectorName = sector?.name ?? "Unknown";
      let holding = bySector.get(company.sectorId);
      if (!holding) {
        holding = {
          sectorId: company.sectorId,
          sectorName,
          color: sectorColors[sectorName] ?? "#52525b",
          shares: 0,
          value: 0,
          companies: [],
        };
        bySector.set(company.sectorId, holding);
      }
      holding.shares += 1;
      holding.value += company.currentStockPrice ?? 0;

      let companyRow = holding.companies.find((c) => c.symbol === company.stockSymbol);
      if (!companyRow) {
        companyRow = {
          name: company.name,
          symbol: company.stockSymbol,
          shares: 0,
          value: 0,
        };
        holding.companies.push(companyRow);
      }
      companyRow.shares += 1;
      companyRow.value += company.currentStockPrice ?? 0;
    }

    return [...bySector.values()].sort((a, b) => b.value - a.value);
  }, [player, gameState.sectors]);
}

/** Sector share counts, each opening a breakdown of the companies behind it. */
function SectorSharePills({
  holdings,
  totalShares,
}: {
  holdings: SectorHolding[];
  totalShares: number;
}) {
  const [openSector, setOpenSector] = useState<SectorHolding | null>(null);

  return (
    <>
      <div className="flex min-w-0 items-center gap-1 px-2 py-1">
        <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
          Shares
        </span>
        <span className="text-sm font-bold tabular-nums text-zinc-200">
          {totalShares}
        </span>
        {holdings.length === 0 ? (
          <span className="text-[10px] text-zinc-600">none held</span>
        ) : (
          <span className="flex items-center gap-1">
            {holdings.map((holding) => (
              <button
                key={holding.sectorId}
                type="button"
                onClick={() => setOpenSector(holding)}
                title={`${holding.sectorName} — ${holding.shares} shares worth $${holding.value}`}
                className="flex items-center gap-0.5 rounded px-1 leading-none transition-transform hover:scale-110"
                style={{ backgroundColor: `${holding.color}2e` }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: holding.color }}
                />
                <span className="text-[11px] font-semibold tabular-nums text-zinc-200">
                  {holding.shares}
                </span>
              </button>
            ))}
          </span>
        )}
      </div>

      <Modal
        isOpen={!!openSector}
        onOpenChange={(open) => !open && setOpenSector(null)}
        className="dark bg-zinc-950 text-foreground"
      >
        <ModalContent>
          {openSector && (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: openSector.color }}
                  />
                  <span>{openSector.sectorName}</span>
                </div>
                <span className="text-xs font-normal text-zinc-400">
                  {openSector.shares} shares · ${openSector.value} at current prices
                </span>
              </ModalHeader>
              <ModalBody className="pb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="pb-1">Company</th>
                      <th className="pb-1 text-right">Shares</th>
                      <th className="pb-1 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openSector.companies
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((company) => (
                        <tr
                          key={company.symbol}
                          className="border-t border-zinc-800/80"
                        >
                          <td className="py-1.5">
                            <span className="font-medium">{company.symbol}</span>
                            <span className="ml-2 text-xs text-zinc-500">
                              {company.name}
                            </span>
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            {company.shares}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-emerald-400">
                            ${company.value}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

/** Opponents as a dense strip: priority order, readiness, cash and net worth. */
function OpponentStrip() {
  const { gameState, authPlayer, currentPhase, playersWithShares, socketChannel } =
    useGame();
  const [isSettingReadiness, setIsSettingReadiness] = useState(false);

  const { data: priorities, refetch: refetchPriorities } =
    trpc.playerPriority.listPlayerPriorities.useQuery(
      { where: { gameTurnId: currentPhase?.gameTurnId } },
      { enabled: !!currentPhase?.gameTurnId }
    );
  const { data: readiness, refetch: refetchReadiness } =
    trpc.game.listPlayerReadiness.useQuery({ gameId: gameState.id });
  const setReadiness = trpc.game.setPlayerReadiness.useMutation({
    onSettled: () => setIsSettingReadiness(false),
  });

  useEffect(() => {
    refetchPriorities();
    refetchReadiness();
  }, [currentPhase?.id, refetchPriorities, refetchReadiness]);

  useEffect(() => {
    if (!socketChannel) return;
    const handler = (_: PlayerReadiness) => refetchReadiness();
    socketChannel.bind(EVENT_PLAYER_READINESS_CHANGED, handler);
    return () => {
      socketChannel.unbind(EVENT_PLAYER_READINESS_CHANGED, handler);
    };
  }, [socketChannel, refetchReadiness]);

  /**
   * Priority rows can be written more than once for a turn, so fold them down to
   * one entry per player and fall back to the roster for anyone missing.
   */
  const ordered = useMemo(() => {
    const seen = new Set<string>();
    const rows: {
      player: { id: string; nickname: string };
      priority: number | null;
    }[] = [];

    for (const entry of [...(priorities ?? [])].sort(
      (a, b) => a.priority - b.priority
    )) {
      if (seen.has(entry.playerId)) continue;
      seen.add(entry.playerId);
      rows.push({ player: entry.player, priority: entry.priority });
    }
    for (const player of gameState.Player) {
      if (seen.has(player.id)) continue;
      seen.add(player.id);
      rows.push({ player, priority: null });
    }
    return rows;
  }, [priorities, gameState.Player]);

  const authReady = !!readiness?.find((r) => r.playerId === authPlayer?.id)?.isReady;
  const allReady =
    !!readiness &&
    readiness.length > 0 &&
    readiness.every((r) => r.isReady);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {ordered.map(({ player, priority }) => {
        const withShares = playersWithShares.find((p) => p.id === player.id);
        const isReady = !!readiness?.find((r) => r.playerId === player.id)?.isReady;
        const isAuth = player.id === authPlayer?.id;
        return (
          <Popover key={player.id} placement="bottom">
            <PopoverTrigger>
              <button
                type="button"
                title={`${player.nickname}${priority ? ` · priority ${priority}` : ""}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-1.5 py-1 leading-none transition-colors",
                  isReady
                    ? "border-emerald-600/70 bg-emerald-950/40"
                    : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-600",
                  isAuth && "ring-1 ring-sky-500/60"
                )}
              >
                {priority != null && (
                  <span className="text-[9px] font-bold tabular-nums text-zinc-500">
                    {priority}
                  </span>
                )}
                <span className="max-w-[7rem] truncate text-[11px] font-medium text-zinc-200">
                  {player.nickname}
                </span>
                {withShares && (
                  <span className="text-[10px] tabular-nums text-zinc-400">
                    $
                    {calculateNetWorth(
                      withShares.cashOnHand,
                      withShares.Share
                    )}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="m-0 p-0">
              {withShares && <PlayerOverview playerWithShares={withShares} />}
            </PopoverContent>
          </Popover>
        );
      })}
      {authPlayer && readiness && !allReady && (
        <DebounceButton
          size="sm"
          className={cn(
            "h-7 min-w-0 px-2 text-[11px] font-semibold",
            authReady ? "bg-zinc-700 text-zinc-300" : "bg-emerald-600 text-white"
          )}
          isLoading={isSettingReadiness}
          onClick={() => {
            setIsSettingReadiness(true);
            setReadiness.mutate({
              gameId: gameState.id,
              playerId: authPlayer.id,
              isReady: !authReady,
            });
          }}
        >
          {authReady ? "Unready" : "Ready"}
        </DebounceButton>
      )}
      {allReady && (
        <span className="rounded-md bg-emerald-600/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          All ready
        </span>
      )}
    </div>
  );
}

/** Bank, consumer pool, workforce, limits, turn counter and the phase clock. */
function GameMetaStrip() {
  const { gameState, currentTurn, currentPhase, gameId } = useGame();
  const bankModal = useDisclosure();
  const isModern =
    gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <BoardStat
        label="Bank"
        value={`$${gameState.bankPoolNumber}`}
        onPress={bankModal.onOpen}
      />
      <BoardStat
        label="Consumers"
        value={gameState.consumerPoolNumber}
        accent="#fbbf24"
      />
      {isModern && (
        <BoardStat
          label="Workers"
          value={
            gameState.workforcePool > 0 ? gameState.workforcePool : DEFAULT_WORKERS
          }
          accent="#4ade80"
        />
      )}
      <BoardStat
        label="Turn"
        value={`${currentTurn.turn ?? 0}/${gameState.gameMaxTurns}`}
      />
      <Popover placement="bottom" showArrow>
        <PopoverTrigger>
          <button
            type="button"
            className="flex flex-col items-start rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-left leading-tight transition-colors hover:border-zinc-600"
          >
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
              Limits
            </span>
            <span className="text-sm font-bold tabular-nums">
              {gameState.certificateLimit} · {MAX_SHARE_PERCENTAGE}%
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[20rem] border border-zinc-700 bg-zinc-950 p-3">
          <p className="text-xs leading-relaxed text-zinc-300">
            Certificate limit is the most shares you may hold; exceeding it forces
            divestment. {MAX_SHARE_PERCENTAGE}% is the most of any single company
            you may own.
          </p>
        </PopoverContent>
      </Popover>

      {!gameState.isTimerless && currentPhase?.phaseStartTime ? (
        <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1">
          <Timer
            countdownTime={currentPhase.phaseTime / 1000}
            startDate={new Date(currentPhase.phaseStartTime)}
            size={20}
            textSize={1.5}
            onEnd={() => {}}
          />
        </div>
      ) : (
        gameState.isTimerless && (
          <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-[10px] text-amber-400">
            <RiClockwiseFill size={14} />
            No timer
          </div>
        )
      )}

      <Modal
        isOpen={bankModal.isOpen}
        onOpenChange={bankModal.onOpenChange}
        className="dark bg-zinc-950 text-foreground"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <RiBankFill className="text-red-400" size={18} />
            Bank transactions
          </ModalHeader>
          <ModalBody className="pb-5">
            <MoneyTransactionByEntityType
              entityType={EntityType.BANK}
              gameId={gameId}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

/**
 * The board's header: who you are, what you're worth, what you hold, and the
 * global counters — all in a single row that never scrolls away.
 */
export function BoardPlayerBar({ focus }: { focus: FocusLevel }) {
  const { authPlayer, playersWithShares, currentPhase, gameState, gameId } =
    useGame();
  const walletModal = useDisclosure();
  const sharesModal = useDisclosure();

  const authWithShares = playersWithShares.find((p) => p.id === authPlayer?.id);
  const holdings = useSectorHoldings(authWithShares);

  const netWorth = authWithShares
    ? calculateNetWorth(authWithShares.cashOnHand, authWithShares.Share)
    : 0;
  const shareValue = authWithShares
    ? calculateNetWorth(0, authWithShares.Share)
    : 0;

  const pendingCashImpact = useMemo(() => {
    const orders =
      authPlayer?.PlayerOrder?.filter(
        (order) =>
          order.stockSubRoundId === currentPhase?.stockSubRoundId &&
          order.orderType === OrderType.MARKET
      ) ?? [];
    return orders.reduce((acc, order) => {
      const value = (order.value ?? 0) * (order.quantity ?? 0);
      return order.isSell ? acc - value : acc + value;
    }, 0);
  }, [authPlayer?.PlayerOrder, currentPhase?.stockSubRoundId]);

  const showPendingImpact =
    pendingCashImpact !== 0 &&
    (currentPhase?.name === PhaseName.STOCK_ACTION_ORDER ||
      currentPhase?.name === PhaseName.STOCK_ACTION_RESULT);

  return (
    <BoardSection
      title="Players"
      hint={friendlyPhaseName(currentPhase?.name)}
      focus={focus}
      className="shrink-0"
      bodyClassName="flex flex-wrap items-center gap-x-3 gap-y-2 pr-12"
    >
      {authPlayer && authWithShares ? (
        <div className="flex min-w-0 items-center gap-2">
          <PlayerAvatar player={authPlayer} size="sm" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-zinc-200">
              {authPlayer.nickname}
            </span>
            {gameState.useLimitOrders || gameState.useShortOrders ? (
              <span className="text-[10px] text-zinc-500">
                {gameState.useLimitOrders && `LO ${authPlayer.limitOrderActions}`}
                {gameState.useLimitOrders && gameState.useShortOrders && " · "}
                {gameState.useShortOrders && `SO ${authPlayer.shortOrderActions}`}
              </span>
            ) : null}
          </div>
          <div className="flex items-stretch divide-x divide-zinc-800 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/70">
            <button
              type="button"
              onClick={walletModal.onOpen}
              title="Cash on hand — press for your transactions"
              className="flex items-center gap-1 px-2 py-1 leading-none transition-colors hover:bg-zinc-800/80"
            >
              <RiWallet3Fill size={13} className="text-emerald-400" />
              <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
                Cash
              </span>
              <span className="text-sm font-bold tabular-nums text-zinc-100">
                ${authWithShares.cashOnHand}
              </span>
              {showPendingImpact && (
                <span
                  className={cn(
                    "text-[10px] font-medium tabular-nums",
                    pendingCashImpact > 0 ? "text-rose-400" : "text-emerald-400"
                  )}
                >
                  {pendingCashImpact > 0 ? "-" : "+"}$
                  {Math.abs(pendingCashImpact)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={sharesModal.onOpen}
              title={`Total value — $${shareValue} of it in shares`}
              className="flex items-center gap-1 px-2 py-1 leading-none transition-colors hover:bg-zinc-800/80"
            >
              <RiScalesFill size={13} className="text-sky-400" />
              <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
                Total
              </span>
              <span className="text-sm font-bold tabular-nums text-zinc-100">
                ${netWorth}
              </span>
              <span className="text-[10px] tabular-nums text-zinc-500">
                ${shareValue} held
              </span>
            </button>
            <SectorSharePills
              holdings={holdings}
              totalShares={authWithShares.Share.length}
            />
          </div>
        </div>
      ) : (
        <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-xs font-extrabold tracking-wide text-transparent">
          SPECTATOR MODE
        </span>
      )}

      <div className="ml-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <OpponentStrip />
        <GameMetaStrip />
      </div>

      <Modal
        isOpen={walletModal.isOpen}
        onOpenChange={walletModal.onOpenChange}
        className="dark bg-zinc-950 text-foreground"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Your transactions</ModalHeader>
          <ModalBody className="pb-5">
            {authPlayer && <MoneyTransactionHistoryByPlayer player={authPlayer} />}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={sharesModal.isOpen}
        onOpenChange={sharesModal.onOpenChange}
        size="3xl"
        className="dark bg-zinc-950 text-foreground"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-0.5">
            <span>Your portfolio</span>
            <span className="text-xs font-normal text-zinc-400">
              ${netWorth} total · ${shareValue} in shares ·{" "}
              {authWithShares?.Share.length ?? 0} certificates
            </span>
          </ModalHeader>
          <ModalBody className="pb-5">
            {authWithShares && (
              <PlayerShares playerWithShares={authWithShares} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </BoardSection>
  );
}
