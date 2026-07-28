"use client";

import { useMemo } from "react";
import {
  stockGridPrices,
  stockTierChartRanges,
} from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus, StockTier } from "@server/prisma/prisma.client";
import type { CompanyWithSector } from "@server/prisma/prisma.types";
import { cn } from "@/lib/utils";
import { BoardInfo, BoardSection } from "./BoardSection";
import type { FocusLevel } from "./boardFocus";

const TIER_BAND_COLOR: Record<StockTier, string> = {
  [StockTier.TIER_1]: "#1e3a8a",
  [StockTier.TIER_2]: "#5b21b6",
  [StockTier.TIER_3]: "#854d0e",
  [StockTier.TIER_4]: "#9a3412",
  [StockTier.TIER_5]: "#991b1b",
};

const MARKER_WIDTH_PCT = 7.5;
const MAX_LANES = 4;

function tierForPrice(price: number) {
  return stockTierChartRanges.find(
    (range) => price >= range.chartMinValue && price <= range.chartMaxValue
  );
}

interface Marker {
  company: CompanyWithSector;
  /** Horizontal position along the ladder, 0–100. */
  offset: number;
  lane: number;
}

/**
 * Packs company markers into lanes so overlapping prices stack upward instead
 * of covering each other.
 */
function layoutMarkers(companies: CompanyWithSector[]): Marker[] {
  const positioned = companies
    .map((company) => {
      const price = company.currentStockPrice ?? 0;
      const index = stockGridPrices.indexOf(price);
      const clamped = index === -1 ? 0 : index;
      return {
        company,
        // Centre of the space, so markers line up with the step grid and bands.
        offset: ((clamped + 0.5) / stockGridPrices.length) * 100,
      };
    })
    .sort((a, b) => a.offset - b.offset);

  const laneEnds: number[] = [];
  return positioned.map(({ company, offset }) => {
    let lane = laneEnds.findIndex((end) => offset - end >= MARKER_WIDTH_PCT);
    if (lane === -1) {
      lane = Math.min(laneEnds.length, MAX_LANES - 1);
    }
    laneEnds[lane] = offset;
    return { company, offset, lane };
  });
}

/**
 * Dotted verticals behind the markers, one per space on the chart, so the
 * distance a company still has to climb is countable rather than guessed.
 */
function StepGrid() {
  const step = 100 / stockGridPrices.length;
  const dots = "repeating-linear-gradient(to bottom, #000 0 2px, transparent 2px 6px)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `repeating-linear-gradient(to right, rgba(161,161,170,0.35) 0 1px, transparent 1px ${step}%)`,
        maskImage: dots,
        WebkitMaskImage: dots,
      }}
    />
  );
}

function TierFill({
  fulfilled,
  tier,
}: {
  fulfilled: number;
  tier: StockTier | undefined;
}) {
  const range = tier
    ? stockTierChartRanges.find((r) => r.tier === tier)
    : undefined;
  if (!range) return null;
  return (
    <span className="flex items-center gap-[1px]">
      {Array.from({ length: range.fillSize }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 w-1 rounded-full",
            i < fulfilled ? "bg-emerald-400" : "bg-zinc-600"
          )}
        />
      ))}
    </span>
  );
}

/**
 * The stock chart laid out horizontally: price rises left to right through the
 * tier bands, and each company rides the ladder at its current price.
 */
export function BoardStockStrip({
  companies,
  focus,
  onSelectCompany,
}: {
  companies: CompanyWithSector[];
  focus: FocusLevel;
  onSelectCompany: (companyId: string) => void;
}) {
  const markers = useMemo(() => layoutMarkers(companies), [companies]);
  const laneCount = Math.max(1, ...markers.map((m) => m.lane + 1));

  const bands = useMemo(
    () =>
      stockTierChartRanges.map((range) => {
        const startIndex = stockGridPrices.findIndex(
          (price) => price >= range.chartMinValue
        );
        const endIndex = stockGridPrices.reduce(
          (last, price, index) => (price <= range.chartMaxValue ? index : last),
          startIndex
        );
        const span =
          ((endIndex - startIndex + 1) / stockGridPrices.length) * 100;
        return { range, span };
      }),
    []
  );

  return (
    <BoardSection
      title="Stock chart"
      hint="Price rises left to right · press a company for detail"
      focus={focus}
      info={
        <BoardInfo title="Stock chart">
          <p>
            Every company sits on one shared price ladder, cheapest on the left.
            Buying pressure walks a company to the right and selling knocks it
            one space left, so the chart is a live picture of who the table
            believes in.
          </p>
          <p>
            The coloured bands are <b>tiers</b>. Each tier sets how many
            open-market shares must be bought before a company advances one
            space, so climbing gets progressively harder. A sale always costs
            one space regardless of tier. Operations revenue pushes the price up
            too, but a move stops at a tier boundary rather than jumping it.
          </p>
          <div className="flex flex-col gap-1">
            {stockTierChartRanges.map((range) => (
              <div key={range.tier} className="flex items-center gap-2">
                <span
                  className="h-3 w-5 shrink-0 rounded-sm"
                  style={{ backgroundColor: TIER_BAND_COLOR[range.tier] }}
                />
                Tier {range.tier.replace("TIER_", "")} · ${range.chartMinValue}–$
                {range.chartMaxValue} · {range.fillSize} shares per step
              </div>
            ))}
          </div>
        </BoardInfo>
      }
      bodyClassName="p-1.5"
    >
      <div className="relative w-full">
        {/* Company markers, stacked into lanes above the ladder. */}
        <div
          className="relative w-full"
          style={{ height: `${laneCount * 26 + 2}px` }}
        >
          <StepGrid />

          {markers.map(({ company, offset, lane }) => {
            const tier = tierForPrice(company.currentStockPrice ?? 0)?.tier;
            const color = sectorColors[company.Sector.name] ?? "#52525b";
            const isBankrupt = company.status === CompanyStatus.BANKRUPT;
            return (
              <button
                key={company.id}
                type="button"
                onClick={() => onSelectCompany(company.id)}
                title={`${company.name} · $${company.currentStockPrice}`}
                className={cn(
                  "absolute flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded border px-1 py-0.5 leading-none shadow-sm transition-transform hover:z-20 hover:scale-105",
                  isBankrupt && "opacity-50 grayscale"
                )}
                style={{
                  left: `${Math.min(97, Math.max(3, offset))}%`,
                  bottom: `${lane * 26}px`,
                  backgroundColor: `${color}e6`,
                  borderColor: "rgba(0,0,0,0.5)",
                }}
              >
                <span className="text-[10px] font-bold text-zinc-50">
                  {company.stockSymbol}
                </span>
                <span className="text-[10px] tabular-nums text-zinc-100/90">
                  ${company.currentStockPrice}
                </span>
                <TierFill
                  fulfilled={company.tierSharesFulfilled}
                  tier={tier}
                />
              </button>
            );
          })}
        </div>

        {/* The ladder itself: tier bands with their price range. */}
        <div className="flex h-5 w-full overflow-hidden rounded">
          {bands.map(({ range, span }) => (
            <div
              key={range.tier}
              className="flex items-center justify-center border-r border-black/40 last:border-r-0"
              style={{
                width: `${span}%`,
                backgroundColor: TIER_BAND_COLOR[range.tier],
              }}
              title={`Tier ${range.tier.replace("TIER_", "")} · ${range.fillSize} shares to advance`}
            >
              <span className="truncate px-1 text-[9px] font-semibold tabular-nums text-white/85">
                ${range.chartMinValue}–{range.chartMaxValue}
              </span>
            </div>
          ))}
        </div>
      </div>
    </BoardSection>
  );
}
