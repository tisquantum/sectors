"use client";

import { useMemo, useState } from "react";
import { sectorColors } from "@server/data/gameData";
import {
  CompanyStatus,
  MarketingCampaignStatus,
  MarketingCampaignTier,
  PhaseName,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import {
  MARKETING_TIERS,
  MARKETING_TIER_CONFIG,
  getMarketingSlotCount,
  getResearchStageFromMarker,
} from "@sectors/app/helpers/tableauSlots";
import {
  RiAddLine,
  RiMegaphoneFill,
  RiVipCrown2Fill,
} from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { BoardInfo, BoardSection } from "./BoardSection";
import { TRACK_COLUMN_HEIGHT } from "./BoardResourceColumns";
import { ResourceGlyph } from "./ResourceGlyph";
import { BoardCampaignModal, type CampaignTarget } from "./BoardCampaignModal";
import type { FocusLevel } from "./boardFocus";

interface CampaignChip {
  id: string;
  tier: MarketingCampaignTier;
  brandBonus: number;
  workers: number;
  slot: number;
  resourceTypes: string[];
  isDecaying: boolean;
}

interface MarketingRow {
  companyId: string;
  symbol: string;
  sectorName: string;
  sectorEnum: string;
  color: string;
  cashOnHand: number;
  brandScore: number;
  researchMarker: number;
  isMine: boolean;
  canRun: boolean;
  slots: { slotNumber: number; campaign?: CampaignChip }[];
}

/**
 * Live marketing campaigns, and the open campaign slots of the companies you
 * run. Narrower than the factory panel because a company runs far fewer
 * campaigns than factories.
 */
export function BoardMarketingPanel({
  focus,
  className,
}: {
  focus: FocusLevel;
  className?: string;
}) {
  const { gameId, gameState, currentPhase, authPlayer } = useGame();
  const [target, setTarget] = useState<CampaignTarget | null>(null);

  const isOperationsPhase =
    currentPhase?.name === PhaseName.MODERN_OPERATIONS ||
    currentPhase?.name === PhaseName.MARKETING_AND_RESEARCH_ACTION;

  const { data: campaigns } = trpc.marketing.getGameCampaigns.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  const rows = useMemo<MarketingRow[]>(() => {
    const byCompany = new Map<string, CampaignChip[]>();
    for (const campaign of campaigns ?? []) {
      const list = byCompany.get(campaign.companyId) ?? [];
      list.push({
        id: campaign.id,
        tier: campaign.tier,
        brandBonus: campaign.brandBonus,
        workers: campaign.workers,
        slot: campaign.slot,
        resourceTypes: campaign.resourceTypes ?? [],
        isDecaying: campaign.status === MarketingCampaignStatus.DECAYING,
      });
      byCompany.set(campaign.companyId, list);
    }

    const result: MarketingRow[] = [];
    for (const company of gameState.Company ?? []) {
      const live = byCompany.get(company.id) ?? [];
      const isMine = !!authPlayer && company.ceoId === authPlayer.id;
      if (live.length === 0 && !isMine) continue;
      if (company.status === CompanyStatus.BANKRUPT) continue;

      const sector = gameState.sectors.find((s) => s.id === company.sectorId);
      const sectorName = sector?.name ?? "Unknown";
      const researchMarker = sector?.researchMarker ?? 0;
      const slotCount = getMarketingSlotCount(
        getResearchStageFromMarker(researchMarker)
      );
      const operable =
        company.status === CompanyStatus.ACTIVE ||
        company.status === CompanyStatus.INSOLVENT;

      // Campaigns record their slot; older rows default to 0, so anything
      // unplaced falls into the leftmost free slot.
      const placed = new Map<number, CampaignChip>();
      const unplaced: CampaignChip[] = [];
      for (const campaign of live) {
        const slot = campaign.slot;
        if (slot >= 1 && slot <= slotCount && !placed.has(slot)) {
          placed.set(slot, campaign);
        } else {
          unplaced.push(campaign);
        }
      }

      result.push({
        companyId: company.id,
        symbol: company.stockSymbol,
        sectorName,
        sectorEnum: sector?.sectorName ?? "",
        color: sectorColors[sectorName] ?? "#52525b",
        cashOnHand: company.cashOnHand,
        brandScore: company.brandScore ?? 0,
        researchMarker,
        isMine,
        canRun: isMine && operable && isOperationsPhase,
        slots: Array.from({ length: slotCount }, (_, index) => {
          const slotNumber = index + 1;
          return {
            slotNumber,
            campaign: placed.get(slotNumber) ?? unplaced.shift(),
          };
        }),
      });
    }

    return result.sort(
      (a, b) =>
        Number(b.isMine) - Number(a.isMine) ||
        a.sectorName.localeCompare(b.sectorName) ||
        a.symbol.localeCompare(b.symbol)
    );
  }, [
    campaigns,
    gameState.Company,
    gameState.sectors,
    authPlayer,
    isOperationsPhase,
  ]);

  const totals = useMemo(() => {
    const live = rows.flatMap((row) =>
      row.slots.flatMap((slot) => (slot.campaign ? [slot.campaign] : []))
    );
    return {
      running: live.length,
      brand: live.reduce((sum, chip) => sum + chip.brandBonus, 0),
      openSlots: rows
        .filter((row) => row.canRun)
        .reduce(
          (sum, row) =>
            sum + row.slots.filter((slot) => !slot.campaign).length,
          0
        ),
    };
  }, [rows]);

  return (
    <BoardSection
      title="Marketing"
      hint={
        totals.running > 0
          ? `${totals.running} running · +${totals.brand} brand`
          : "No campaigns running"
      }
      info={
        <BoardInfo title="Marketing">
          <p>
            A campaign does two things. It raises the company&apos;s{" "}
            <b>brand score</b>, which is subtracted from its factories&apos;
            unit prices when customers choose where to shop, and it drops{" "}
            <b>temporary markers</b> into the sector&apos;s consumption bag —
            one per material you pick — pulling in shoppers who want those
            materials. A temporary marker disappears once it brings a customer
            in.
          </p>
          <p>
            Three tiers:{" "}
            {MARKETING_TIERS.map((tier, index) => {
              const config = MARKETING_TIER_CONFIG[tier];
              return (
                <span key={tier}>
                  {index > 0 && "; "}
                  <b>tier {config.label}</b> costs ${config.cost} for +
                  {config.brandBonus} brand, +{config.demandBonus} sector demand
                  and {config.workers} worker
                  {config.workers === 1 ? "" : "s"}
                </span>
              );
            })}
            . Higher tiers need sector research to unlock.
          </p>
          <p>
            Cash leaves immediately; the effects land when operations resolve
            and hold for two turns before the campaign decays. A company runs
            between two and five concurrent campaigns depending on its
            sector&apos;s research stage — that is what the open slots here
            represent.
          </p>
        </BoardInfo>
      }
      focus={focus}
      className={className}
      actions={
        totals.openSlots > 0 ? (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-fuchsia-300">
            <RiMegaphoneFill size={11} />
            {totals.openSlots} open
          </span>
        ) : undefined
      }
      bodyClassName="p-1"
    >
      {rows.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-zinc-600">
          No campaigns running.
        </p>
      ) : (
        <div
          className="flex flex-col gap-1 overflow-y-auto scrollbar"
          style={{ maxHeight: TRACK_COLUMN_HEIGHT + 30 }}
        >
          {rows.map((row) => (
            <div
              key={row.companyId}
              className={cn(
                "flex items-center gap-1.5 rounded border bg-zinc-900/40 px-1.5 py-1",
                row.canRun ? "border-fuchsia-800/50" : "border-zinc-800/80"
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="text-xs font-bold text-zinc-100">
                {row.symbol}
              </span>
              {row.isMine && (
                <span title="You are the CEO">
                  <RiVipCrown2Fill size={11} className="shrink-0 text-amber-400" />
                </span>
              )}
              <span
                className="shrink-0 text-[10px] tabular-nums text-emerald-400"
                title="Brand score, which lowers the attraction price customers see"
              >
                +{row.brandScore}
              </span>
              <span className="ml-auto flex items-center gap-1 pl-1">
                {row.slots.map((slot) =>
                  slot.campaign ? (
                    <span
                      key={slot.slotNumber}
                      title={`Campaign ${
                        MARKETING_TIER_CONFIG[slot.campaign.tier].label
                      } · +${slot.campaign.brandBonus} brand · ${
                        slot.campaign.workers
                      } workers${slot.campaign.isDecaying ? " · decaying" : ""}`}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded border px-1.5 py-1 leading-none",
                        slot.campaign.isDecaying
                          ? "border-zinc-700 bg-zinc-800/60 opacity-70"
                          : "border-fuchsia-700/70 bg-fuchsia-950/40"
                      )}
                    >
                      <span className="text-[11px] font-bold text-fuchsia-300">
                        {MARKETING_TIER_CONFIG[slot.campaign.tier].label}
                      </span>
                      <span className="flex items-center gap-0.5">
                        {slot.campaign.resourceTypes.map((type, index) => (
                          <ResourceGlyph
                            key={`${type}-${index}`}
                            type={type}
                            size={7}
                          />
                        ))}
                      </span>
                    </span>
                  ) : (
                    <button
                      key={slot.slotNumber}
                      type="button"
                      disabled={!row.canRun}
                      onClick={() =>
                        setTarget({
                          companyId: row.companyId,
                          symbol: row.symbol,
                          sectorName: row.sectorName,
                          sectorEnum: row.sectorEnum,
                          color: row.color,
                          slotNumber: slot.slotNumber,
                          researchMarker: row.researchMarker,
                          cashOnHand: row.cashOnHand,
                        })
                      }
                      title={
                        row.canRun
                          ? `Run a campaign in slot ${slot.slotNumber}`
                          : `Slot ${slot.slotNumber} open`
                      }
                      className={cn(
                        "flex h-[22px] w-6 shrink-0 items-center justify-center rounded border border-dashed transition-colors",
                        row.canRun
                          ? "cursor-pointer border-fuchsia-500/70 bg-fuchsia-500/10 text-fuchsia-300 hover:border-fuchsia-400 hover:bg-fuchsia-500/20"
                          : "border-zinc-800 text-zinc-700"
                      )}
                    >
                      {row.canRun ? (
                        <RiAddLine size={12} />
                      ) : (
                        <span className="text-[10px]">·</span>
                      )}
                    </button>
                  )
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <BoardCampaignModal target={target} onClose={() => setTarget(null)} />
    </BoardSection>
  );
}

export default BoardMarketingPanel;
