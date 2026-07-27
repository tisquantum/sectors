"use client";

import { useMemo } from "react";
import { calculateFactoryConstructionCost } from "@server/data/company-traits";
import { resolveFactoryBlueprint } from "@server/data/helpers";
import { RESEARCH_COSTS_BY_PHASE } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { formatEnumLabel } from "@sectors/app/helpers/labels";
import {
  MARKETING_TIER_CONFIG,
  getMarketingSlotCount,
  getResearchStageFromMarker,
} from "@sectors/app/helpers/tableauSlots";
import {
  RiFlaskFill,
  RiHammerFill,
  RiMegaphoneFill,
} from "@remixicon/react";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { SectorWorkerSalaries } from "../ModernOperations/components/SectorWorkerSalaries";

interface Commitment {
  kind: "factory" | "campaign" | "research";
  detail: string;
  cost: number;
}

/**
 * Reference for the operations phase. Every action is taken on the board, so
 * this panel only explains where to press and totals up what each company you
 * run has already committed this turn.
 */
export function BoardOperationsGuide() {
  const { gameId, gameState, currentTurn, authPlayer } = useGame();

  const { data: factoryOrders } =
    trpc.factoryConstruction.getGameOutstandingOrders.useQuery(
      { gameId, gameTurnId: currentTurn?.id },
      { enabled: !!gameId }
    );
  const { data: researchOrders } =
    trpc.modernOperations.getPendingResearchOrders.useQuery(
      { gameId, gameTurnId: currentTurn?.id },
      { enabled: !!gameId }
    );
  const { data: campaigns } = trpc.marketing.getGameCampaigns.useQuery(
    { gameId },
    { enabled: !!gameId }
  );
  const { data: resources } = trpc.resource.getGameResources.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  const priceByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const resource of resources ?? []) {
      map.set(resource.type, resource.price);
    }
    return map;
  }, [resources]);

  const myCompanies = useMemo(() => {
    if (!authPlayer) return [];
    return (gameState.Company ?? []).filter(
      (company) =>
        company.ceoId === authPlayer.id &&
        company.status !== CompanyStatus.BANKRUPT
    );
  }, [gameState.Company, authPlayer]);

  const rows = useMemo(() => {
    return myCompanies.map((company) => {
      const sector = gameState.sectors.find((s) => s.id === company.sectorId);
      const stage = getResearchStageFromMarker(sector?.researchMarker ?? 0);
      const commitments: Commitment[] = [];

      for (const order of factoryOrders ?? []) {
        if (order.companyId !== company.id) continue;
        commitments.push({
          kind: "factory",
          detail: `Factory ${order.size.replace("FACTORY_", "")} · ${(
            order.resourceTypes ?? []
          )
            .map((type) => formatEnumLabel(type))
            .join(", ")}`,
          cost: calculateFactoryConstructionCost(
            order.size,
            resolveFactoryBlueprint(order.resourceTypes, sector?.sectorName),
            priceByType,
            company
          ),
        });
      }
      for (const order of researchOrders ?? []) {
        if (order.companyId !== company.id) continue;
        commitments.push({
          kind: "research",
          detail: `Research on the ${sector?.name ?? "sector"} track`,
          cost: order.cost,
        });
      }
      for (const campaign of campaigns ?? []) {
        if (campaign.companyId !== company.id) continue;
        if (campaign.gameTurnId !== currentTurn?.id) continue;
        commitments.push({
          kind: "campaign",
          detail: `Campaign ${MARKETING_TIER_CONFIG[campaign.tier].label} · +${
            campaign.brandBonus
          } brand (already paid)`,
          cost: MARKETING_TIER_CONFIG[campaign.tier].cost,
        });
      }

      const dueAtResolve = commitments
        .filter((entry) => entry.kind !== "campaign")
        .reduce((sum, entry) => sum + entry.cost, 0);

      return {
        company,
        sectorName: sector?.name ?? "Unknown",
        color: sectorColors[sector?.name ?? ""] ?? "#52525b",
        stage,
        researchCost:
          RESEARCH_COSTS_BY_PHASE[
            Math.min(Math.floor((sector?.researchMarker ?? 0) / 3), 3)
          ] ?? RESEARCH_COSTS_BY_PHASE[0],
        marketingSlots: getMarketingSlotCount(stage),
        commitments,
        dueAtResolve,
      };
    });
  }, [
    myCompanies,
    gameState.sectors,
    factoryOrders,
    researchOrders,
    campaigns,
    currentTurn?.id,
    priceByType,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {[
          {
            icon: <RiHammerFill size={14} className="text-orange-400" />,
            title: "Build a factory",
            body: "Press an open plot in the Factories panel. Cheaper materials mean a lower unit price, which wins customers. Charged when operations resolve; production starts next turn.",
          },
          {
            icon: <RiMegaphoneFill size={14} className="text-fuchsia-400" />,
            title: "Run a campaign",
            body: "Press an open slot in the Marketing panel. Cash leaves now; brand score and sector demand apply at resolve and last two turns.",
          },
          {
            icon: <RiFlaskFill size={14} className="text-emerald-400" />,
            title: "Fund research",
            body: "Press the fund button under a sector's research column. The track is shared by the whole sector and unlocks bigger factories, more marketing slots and standing demand.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-200">
              {card.icon}
              {card.title}
            </span>
            <p className="text-xs leading-relaxed text-zinc-400">{card.body}</p>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Your companies this turn
          </h3>
          {rows.map((row) => (
            <div
              key={row.company.id}
              className="flex flex-col gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="font-semibold text-zinc-100">
                  {row.company.stockSymbol}
                </span>
                <span className="text-xs text-zinc-500">
                  {row.sectorName} · stage {row.stage} · {row.marketingSlots}{" "}
                  marketing slot{row.marketingSlots === 1 ? "" : "s"} · research
                  costs ${row.researchCost}
                </span>
                <span className="ml-auto text-xs tabular-nums text-zinc-400">
                  cash ${row.company.cashOnHand}
                  {row.dueAtResolve > 0 && (
                    <span
                      className={cn(
                        "ml-2 font-semibold",
                        row.dueAtResolve > row.company.cashOnHand
                          ? "text-rose-400"
                          : "text-amber-400"
                      )}
                    >
                      −${row.dueAtResolve} at resolve
                    </span>
                  )}
                </span>
              </div>
              {row.commitments.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Nothing committed yet this turn.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {row.commitments.map((entry, index) => (
                    <li
                      key={`${entry.kind}-${index}`}
                      className="flex items-center gap-2 text-xs text-zinc-300"
                    >
                      {entry.kind === "factory" && (
                        <RiHammerFill size={12} className="text-orange-400" />
                      )}
                      {entry.kind === "campaign" && (
                        <RiMegaphoneFill
                          size={12}
                          className="text-fuchsia-400"
                        />
                      )}
                      {entry.kind === "research" && (
                        <RiFlaskFill size={12} className="text-emerald-400" />
                      )}
                      <span className="min-w-0 flex-1">{entry.detail}</span>
                      <span className="tabular-nums text-zinc-400">
                        ${entry.cost}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Worker salaries and sector demand
        </h3>
        <SectorWorkerSalaries />
      </div>
    </div>
  );
}

export default BoardOperationsGuide;
