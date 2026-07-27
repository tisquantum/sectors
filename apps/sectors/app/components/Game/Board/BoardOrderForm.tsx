"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@nextui-org/react";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiSubtractLine,
} from "@remixicon/react";
import {
  BORROW_RATE,
  MAX_SHARE_PERCENTAGE,
  MAX_SHORT_ORDER_QUANTITY,
} from "@server/data/constants";
import {
  DistributionStrategy,
  OrderType,
  ShareLocation,
} from "@server/prisma/prisma.client";
import type { CompanyWithRelations } from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import DebounceButton from "../../General/DebounceButton";

type Side = "buy" | "sell";

const ORDER_TYPE_LABEL: Record<string, string> = {
  [OrderType.MARKET]: "Market",
  [OrderType.LIMIT]: "Limit",
  [OrderType.SHORT]: "Short",
};

/** Segmented control: one visible row of choices, no dropdowns, no tabs. */
function Segments<T extends string>({
  value,
  options,
  onChange,
  accentClass,
}: {
  value: T;
  options: { key: T; label: string; disabled?: boolean; hint?: string }[];
  onChange: (key: T) => void;
  accentClass?: string;
}) {
  return (
    <div className="flex items-stretch gap-1 rounded-md bg-zinc-900 p-0.5">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          disabled={option.disabled}
          title={option.hint}
          onClick={() => onChange(option.key)}
          className={cn(
            "flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors",
            option.key === value
              ? (accentClass ?? "bg-zinc-700 text-white")
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
            option.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Quantity stepper with a max shortcut — faster and more precise than a slider. */
function QuantityStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="One fewer share"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-30"
      >
        <RiSubtractLine size={16} />
      </button>
      <div className="flex min-w-[4.5rem] flex-col items-center leading-none">
        <span className="text-2xl font-bold tabular-nums text-zinc-100">
          {value}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-zinc-500">
          {value === 1 ? "share" : "shares"}
        </span>
      </div>
      <button
        type="button"
        aria-label="One more share"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-30"
      >
        <RiAddLine size={16} />
      </button>
      <button
        type="button"
        disabled={max <= min || value === max}
        onClick={() => onChange(max)}
        className="ml-1 rounded-md border border-zinc-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30"
      >
        Max {max}
      </button>
    </div>
  );
}

/**
 * Order entry for one company. Everything the decision needs — what you hold,
 * what it costs, what you are left with — is on screen at once, and the form
 * stays open so a run of orders can be placed without reopening it.
 */
export function BoardOrderForm({
  company,
  isIpo,
  onClose,
}: {
  company: CompanyWithRelations;
  isIpo: boolean;
  onClose: () => void;
}) {
  const { gameState, authPlayer, currentPhase, refetchAuthPlayer } = useGame();
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState<number>(
    company.currentStockPrice ?? 0
  );
  const [bidPrice, setBidPrice] = useState<number>(
    (isIpo ? company.ipoAndFloatPrice : company.currentStockPrice) ?? 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: liveCompany } = trpc.company.getCompanyWithShares.useQuery({
    id: company.id,
  });
  const { data: playerOrders, refetch: refetchOrders } =
    trpc.playerOrder.listPlayerOrdersWithCompany.useQuery(
      {
        where: {
          stockRoundId: currentPhase?.stockRoundId,
          playerId: authPlayer?.id,
        },
      },
      { enabled: !!authPlayer?.id }
    );

  const shares = liveCompany?.Share ?? company.Share;
  const marketPrice =
    (isIpo ? company.ipoAndFloatPrice : company.currentStockPrice) ?? 0;

  const available = shares.filter(
    (share) =>
      share.location ===
      (isIpo ? ShareLocation.IPO : ShareLocation.OPEN_MARKET)
  ).length;
  const owned = shares.filter(
    (share) =>
      share.location === ShareLocation.PLAYER &&
      share.playerId === authPlayer?.id
  ).length;

  const ordersForCompany = useMemo(
    () =>
      (playerOrders ?? []).filter(
        (order) =>
          order.companyId === company.id &&
          order.stockRoundId === currentPhase?.stockRoundId
      ),
    [playerOrders, company.id, currentPhase?.stockRoundId]
  );

  const canSell = !isIpo && owned > 0;
  const canLimit = !isIpo && gameState.useLimitOrders;
  const canShort = !isIpo && gameState.useShortOrders;

  const { min, max } = useMemo(() => {
    if (orderType === OrderType.SHORT) {
      return { min: 1, max: Math.max(1, Math.min(available, MAX_SHORT_ORDER_QUANTITY)) };
    }
    if (orderType === OrderType.LIMIT) {
      return side === "buy" ? { min: 1, max: 1 } : { min: 1, max: Math.max(1, owned) };
    }
    return side === "buy"
      ? { min: 1, max: Math.max(1, available) }
      : { min: 1, max: Math.max(1, owned) };
  }, [orderType, side, available, owned]);

  useEffect(() => {
    setQuantity((current) => Math.max(min, Math.min(max, current)));
  }, [min, max]);

  useEffect(() => {
    if (!canSell && side === "sell") setSide("buy");
  }, [canSell, side]);

  const unitPrice =
    orderType === OrderType.MARKET &&
    gameState.distributionStrategy === DistributionStrategy.BID_PRIORITY &&
    side === "buy"
      ? bidPrice
      : marketPrice;

  /** Cash effect of this order alone; limit orders only settle when triggered. */
  const cashDelta = useMemo(() => {
    if (orderType === OrderType.LIMIT) return 0;
    if (orderType === OrderType.SHORT) return quantity * marketPrice;
    return side === "buy" ? -quantity * unitPrice : quantity * unitPrice;
  }, [orderType, side, quantity, unitPrice, marketPrice]);

  const cash = authPlayer?.cashOnHand ?? 0;
  const cashAfter = cash + cashDelta;

  const blocker = useMemo(() => {
    if (!authPlayer) return "You are spectating.";
    if (side === "buy" && available === 0 && orderType === OrderType.MARKET) {
      return isIpo
        ? "No IPO shares left to buy."
        : "No shares in the open market to buy.";
    }
    if (side === "sell" && owned === 0) return "You hold no shares to sell.";
    if (cashAfter < 0) return `Short $${Math.abs(cashAfter)} for this order.`;

    const hasOpposing = ordersForCompany.some(
      (order) =>
        order.orderType === OrderType.MARKET && order.isSell === (side === "buy")
    );
    if (hasOpposing && orderType === OrderType.MARKET) {
      return `You already have a ${side === "buy" ? "sell" : "buy"} order for ${
        company.stockSymbol
      } this round.`;
    }

    if (side === "buy" && orderType === OrderType.MARKET) {
      const cap = Math.floor(shares.length * (MAX_SHARE_PERCENTAGE / 100));
      const pending = ordersForCompany
        .filter((order) => !order.isSell && order.orderType === OrderType.MARKET)
        .reduce((sum, order) => sum + (order.quantity ?? 0), 0);
      if (owned + pending + quantity > cap) {
        return `Over the ${MAX_SHARE_PERCENTAGE}% cap: ${owned} held + ${pending} pending + ${quantity} would pass ${cap}.`;
      }
    }
    return null;
  }, [
    authPlayer,
    side,
    available,
    owned,
    cashAfter,
    orderType,
    isIpo,
    ordersForCompany,
    company.stockSymbol,
    shares.length,
    quantity,
  ]);

  const createOrder = trpc.playerOrder.createPlayerOrder.useMutation({
    onSuccess: () => {
      toast.success(
        `${side === "buy" ? "Buy" : "Sell"} order placed · ${quantity} ${
          company.stockSymbol
        }`,
        { duration: 2500 }
      );
      refetchAuthPlayer();
      refetchOrders();
      setQuantity(min);
    },
    onError: (error) => toast.error(error.message, { duration: 6000 }),
    onSettled: () => setIsSubmitting(false),
  });

  if (!authPlayer) return null;

  const submit = () => {
    setIsSubmitting(true);
    createOrder.mutate({
      playerId: authPlayer.id,
      companyId: company.id,
      quantity,
      value:
        orderType === OrderType.LIMIT
          ? limitPrice
          : orderType === OrderType.MARKET
            ? unitPrice
            : marketPrice,
      isSell: side === "sell",
      orderType,
      location: isIpo ? ShareLocation.IPO : ShareLocation.OPEN_MARKET,
    });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* What you already hold and what is on offer. */}
      <div className="grid grid-cols-3 gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-center">
        {[
          { label: "You hold", value: owned, accent: "text-zinc-100" },
          {
            label: isIpo ? "IPO shares" : "In market",
            value: available,
            accent: "text-zinc-100",
          },
          {
            label: "Price",
            value: `$${marketPrice}`,
            accent: "text-emerald-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col leading-tight">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500">
              {stat.label}
            </span>
            <span className={cn("text-base font-bold tabular-nums", stat.accent)}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <Segments<Side>
        value={side}
        onChange={setSide}
        accentClass={
          side === "buy" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        }
        options={[
          { key: "buy", label: "Buy" },
          {
            key: "sell",
            label: "Sell",
            disabled: !canSell,
            hint: isIpo
              ? "Shares cannot be sold back into an IPO"
              : "You hold no shares in this company",
          },
        ]}
      />

      {(canLimit || canShort) && (
        <Segments<OrderType>
          value={orderType}
          onChange={setOrderType}
          options={[
            { key: OrderType.MARKET, label: ORDER_TYPE_LABEL[OrderType.MARKET] },
            {
              key: OrderType.LIMIT,
              label: `${ORDER_TYPE_LABEL[OrderType.LIMIT]} · ${authPlayer.limitOrderActions}`,
              disabled: !canLimit || authPlayer.limitOrderActions <= 0,
              hint: "Fills automatically when the price is reached",
            },
            {
              key: OrderType.SHORT,
              label: `${ORDER_TYPE_LABEL[OrderType.SHORT]} · ${authPlayer.shortOrderActions}`,
              disabled: !canShort || authPlayer.shortOrderActions <= 0,
              hint: `Borrow shares to sell now · ${BORROW_RATE}% interest per turn`,
            },
          ]}
        />
      )}

      <div className="flex flex-col items-center gap-2">
        <QuantityStepper
          value={quantity}
          min={min}
          max={max}
          onChange={setQuantity}
        />
        {orderType === OrderType.LIMIT && (
          <Input
            size="sm"
            type="number"
            label="Trigger price"
            value={String(limitPrice)}
            onValueChange={(value) => setLimitPrice(Number(value))}
            startContent={<span className="text-xs text-zinc-500">$</span>}
            className="max-w-[12rem]"
          />
        )}
        {orderType === OrderType.MARKET &&
          side === "buy" &&
          gameState.distributionStrategy ===
            DistributionStrategy.BID_PRIORITY && (
            <Input
              size="sm"
              type="number"
              label="Your bid per share"
              description={`Minimum $${marketPrice} · higher bids fill first`}
              value={String(bidPrice)}
              min={marketPrice}
              onValueChange={(value) => setBidPrice(Number(value))}
              startContent={<span className="text-xs text-zinc-500">$</span>}
              className="max-w-[14rem]"
            />
          )}
      </div>

      {/* The money, spelled out. */}
      <dl className="flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-xs">
        <div className="flex justify-between">
          <dt className="text-zinc-500">
            {orderType === OrderType.LIMIT
              ? "Settles when triggered"
              : `${quantity} × $${unitPrice}`}
          </dt>
          <dd
            className={cn(
              "flex items-center gap-1 font-semibold tabular-nums",
              cashDelta > 0 && "text-emerald-400",
              cashDelta < 0 && "text-rose-400",
              cashDelta === 0 && "text-zinc-400"
            )}
          >
            {cashDelta > 0 && <RiArrowUpLine size={12} />}
            {cashDelta < 0 && <RiArrowDownLine size={12} />}$
            {Math.abs(cashDelta)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-zinc-800 pt-1">
          <dt className="text-zinc-500">Cash after</dt>
          <dd
            className={cn(
              "font-bold tabular-nums",
              cashAfter < 0 ? "text-rose-400" : "text-zinc-100"
            )}
          >
            ${cashAfter} <span className="text-zinc-600">from ${cash}</span>
          </dd>
        </div>
      </dl>

      {ordersForCompany.length > 0 && (
        <p className="text-center text-[11px] text-sky-300/80">
          {ordersForCompany.length} order
          {ordersForCompany.length === 1 ? "" : "s"} already queued for{" "}
          {company.stockSymbol} this round.
        </p>
      )}

      {blocker && (
        <p className="rounded-md border border-amber-700/50 bg-amber-950/40 px-2 py-1.5 text-center text-[11px] text-amber-300">
          {blocker}
        </p>
      )}

      <div className="flex gap-2">
        <DebounceButton
          className={cn(
            "flex-1 font-semibold text-white",
            side === "buy" ? "bg-emerald-600" : "bg-rose-600"
          )}
          isDisabled={!!blocker}
          isLoading={isSubmitting}
          onClick={submit}
        >
          {side === "buy" ? "Buy" : "Sell"} {quantity} at $
          {orderType === OrderType.LIMIT ? limitPrice : unitPrice}
        </DebounceButton>
        <DebounceButton
          className="bg-zinc-800 text-zinc-300"
          onClick={onClose}
        >
          Done
        </DebounceButton>
      </div>
    </div>
  );
}

export default BoardOrderForm;
