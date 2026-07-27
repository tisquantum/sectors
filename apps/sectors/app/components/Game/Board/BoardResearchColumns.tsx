"use client";

import { useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { sectorColors } from "@server/data/gameData";
import { RESEARCH_COSTS_BY_PHASE } from "@server/data/constants";
import {
  CompanyStatus,
  PhaseName,
  type Company,
  type Sector,
} from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import { RiFlaskFill } from "@remixicon/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { BoardSection } from "./BoardSection";
import { TRACK_COLUMN_HEIGHT } from "./BoardResourceColumns";
import type { FocusLevel } from "./boardFocus";

const TRACK_LENGTH = 12;

/** Demand bonus granted once the marker reaches each milestone space. */
const MILESTONE_BONUS: Record<number, number> = { 3: 2, 6: 3, 9: 4, 12: 5 };

function demandBonusFor(marker: number): number {
  if (marker >= 12) return 5;
  if (marker >= 9) return 4;
  if (marker >= 6) return 3;
  if (marker >= 3) return 2;
  return 0;
}

function stageFor(marker: number): number {
  if (marker >= 10) return 4;
  if (marker >= 7) return 3;
  if (marker >= 4) return 2;
  return 1;
}

/** Cost stage runs on thirds of the track, unlike the factory-tier stage. */
function researchCostFor(marker: number): number {
  const stage = Math.min(Math.floor(marker / 3) + 1, 4);
  return RESEARCH_COSTS_BY_PHASE[stage - 1] ?? RESEARCH_COSTS_BY_PHASE[0];
}

interface Funder {
  companyId: string;
  symbol: string;
  cashOnHand: number;
  hasOrderThisTurn: boolean;
}

interface SectorResearch {
  sector: Sector;
  color: string;
  marker: number;
  companies: Company[];
  /** Companies here that the viewing player can spend on right now. */
  funders: Funder[];
}

/** One sector's shared 12-space research track, drawn bottom-up as a column. */
function ResearchColumn({
  entry,
  cost,
  isFunding,
  onOpen,
  onFund,
}: {
  entry: SectorResearch;
  cost: number;
  isFunding: boolean;
  onOpen: () => void;
  onFund: (funder: Funder) => void;
}) {
  const spaces = Array.from({ length: TRACK_LENGTH }, (_, i) => TRACK_LENGTH - i);

  return (
    <div className="flex min-w-0 flex-1 basis-0 flex-col items-stretch gap-0.5 rounded border border-zinc-800 bg-zinc-900/50 p-1">
      <button
        type="button"
        onClick={onOpen}
        title={`${entry.sector.name} research ${entry.marker}/12 · stage ${stageFor(
          entry.marker
        )}`}
        className="flex min-w-0 flex-col items-stretch gap-0.5 rounded transition-colors hover:bg-zinc-800/40"
      >
        <span
          className="h-1 w-full rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        {/* Stacked to match the resource columns, which need the width for their names. */}
        <span className="w-full truncate text-center text-[10px] font-medium uppercase tracking-wide text-zinc-300">
          {entry.sector.name}
        </span>
        <span className="text-center text-sm font-bold tabular-nums text-zinc-200">
          {entry.marker}/12
          <span className="ml-1 text-xs text-emerald-400">
            +{demandBonusFor(entry.marker)}
          </span>
        </span>
        <div
          className="flex flex-col gap-px"
          style={{ height: `${TRACK_COLUMN_HEIGHT}px` }}
        >
          {spaces.map((space) => {
            const isReached = space <= entry.marker;
            const isCurrent = space === entry.marker;
            const bonus = MILESTONE_BONUS[space];
            return (
              <span
                key={space}
                className={cn(
                  "flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[1px] text-[9px] leading-none tabular-nums",
                  isReached
                    ? "font-semibold text-black/70"
                    : "bg-zinc-800/50 text-zinc-500",
                  bonus && !isReached && "bg-emerald-950/60 text-emerald-500/80",
                  isCurrent && "outline outline-1 outline-white/80"
                )}
                style={isReached ? { backgroundColor: entry.color } : undefined}
              >
                {bonus ? `+${bonus}` : space}
              </span>
            );
          })}
        </div>
      </button>
      {entry.funders.length > 0 ? (
        <div className="flex flex-col gap-px">
          {entry.funders.map((funder) => {
            const affordable = funder.cashOnHand >= cost;
            const disabled =
              isFunding || funder.hasOrderThisTurn || !affordable;
            return (
              <button
                key={funder.companyId}
                type="button"
                disabled={disabled}
                onClick={() => onFund(funder)}
                title={
                  funder.hasOrderThisTurn
                    ? `${funder.symbol} has already funded research this turn`
                    : affordable
                      ? `Fund research for ${funder.symbol} — $${cost}, charged when operations resolve`
                      : `${funder.symbol} only has $${funder.cashOnHand}`
                }
                className={cn(
                  "flex items-center justify-center gap-1 rounded border border-dashed py-0.5 text-[10px] font-semibold leading-none transition-colors",
                  funder.hasOrderThisTurn
                    ? "border-sky-700/60 bg-sky-950/40 text-sky-400"
                    : disabled
                      ? "cursor-not-allowed border-zinc-800 text-zinc-600"
                      : "cursor-pointer border-emerald-500/70 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                )}
              >
                {funder.hasOrderThisTurn ? (
                  "queued"
                ) : (
                  <>
                    <RiFlaskFill size={10} />
                    {entry.funders.length > 1 ? funder.symbol : `$${cost}`}
                  </>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="text-center text-[9px] uppercase tracking-wider text-zinc-500">
          Stage {stageFor(entry.marker)}
        </span>
      )}
    </div>
  );
}

/**
 * Research progress for every sector as parallel columns. Progress is shared by
 * all companies in a sector, so the column is the sector's position.
 */
export function BoardResearchColumns({
  focus,
  className,
}: {
  focus: FocusLevel;
  className?: string;
}) {
  const { gameId, currentTurn, currentPhase, authPlayer } = useGame();
  const [openEntry, setOpenEntry] = useState<SectorResearch | null>(null);
  const [fundingCompanyId, setFundingCompanyId] = useState<string | null>(null);

  const canFund =
    currentPhase?.name === PhaseName.MODERN_OPERATIONS ||
    currentPhase?.name === PhaseName.MARKETING_AND_RESEARCH_ACTION ||
    currentPhase?.name === PhaseName.RESEARCH_ACTION;

  const { data: sectors } = trpc.sector.listSectors.useQuery(
    { where: { gameId }, orderBy: { name: "asc" } },
    { enabled: !!gameId }
  );
  const { data: companies } = trpc.company.listCompanies.useQuery(
    { where: { gameId }, orderBy: { name: "asc" } },
    { enabled: !!gameId }
  );
  const { data: pendingResearch } =
    trpc.modernOperations.getPendingResearchOrders.useQuery(
      { gameId, gameTurnId: currentTurn?.id },
      { enabled: !!gameId }
    );

  const utils = trpc.useUtils();
  const fundResearch = trpc.modernOperations.submitResearchAction.useMutation({
    onSuccess: () => {
      toast.success("Research funded, resolves with operations", {
        duration: 3000,
      });
      utils.modernOperations.getPendingResearchOrders.invalidate();
    },
    onError: (error) => toast.error(error.message, { duration: 6000 }),
    onSettled: () => setFundingCompanyId(null),
  });

  const entries = useMemo<SectorResearch[]>(() => {
    if (!sectors) return [];
    const orderedCompanies = new Set(
      (pendingResearch ?? []).map((order) => order.companyId)
    );
    return sectors
      .map((sector) => {
        const inSector = (companies ?? []).filter(
          (company) => company.sectorId === sector.id
        );
        return {
          sector,
          color: sectorColors[sector.name] ?? "#52525b",
          marker: sector.researchMarker ?? 0,
          companies: inSector,
          funders:
            canFund && authPlayer
              ? inSector
                  .filter(
                    (company) =>
                      company.ceoId === authPlayer.id &&
                      (company.status === CompanyStatus.ACTIVE ||
                        company.status === CompanyStatus.INSOLVENT)
                  )
                  .map((company) => ({
                    companyId: company.id,
                    symbol: company.stockSymbol,
                    cashOnHand: company.cashOnHand,
                    hasOrderThisTurn: orderedCompanies.has(company.id),
                  }))
              : [],
        };
      })
      .filter((entry) => entry.companies.length > 0);
  }, [sectors, companies, pendingResearch, canFund, authPlayer]);

  return (
    <BoardSection
      title="Research"
      hint="Shared per sector · milestones unlock factory tiers and demand"
      focus={focus}
      className={className}
      bodyClassName="p-1"
    >
      {entries.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-zinc-600">
          No sectors in play yet.
        </p>
      ) : (
        <div className="flex min-w-0 flex-col gap-0.5">
          {/* Mirrors the resource groups' label so both sets of columns align. */}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Progress
          </span>
          <div className="flex items-start gap-1">
            {entries.map((entry) => (
              <ResearchColumn
                key={entry.sector.id}
                entry={entry}
                cost={researchCostFor(entry.marker)}
                isFunding={fundingCompanyId === entry.sector.id}
                onOpen={() => setOpenEntry(entry)}
                onFund={(funder) => {
                  if (!authPlayer || fundingCompanyId) return;
                  setFundingCompanyId(entry.sector.id);
                  fundResearch.mutate({
                    companyId: funder.companyId,
                    gameId,
                    playerId: authPlayer.id,
                    sectorId: entry.sector.id,
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!openEntry}
        onOpenChange={(open) => !open && setOpenEntry(null)}
        className="dark bg-zinc-950 text-foreground"
      >
        <ModalContent>
          {openEntry && (
            <>
              <ModalHeader className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: openEntry.color }}
                  />
                  {openEntry.sector.name} research
                </div>
                <span className="text-xs font-normal text-zinc-400">
                  Space {openEntry.marker} of 12 · stage{" "}
                  {stageFor(openEntry.marker)} · +
                  {demandBonusFor(openEntry.marker)} sector demand
                </span>
              </ModalHeader>
              <ModalBody className="gap-3 pb-5 text-sm text-zinc-300">
                <p className="leading-relaxed">
                  Research is how a sector unlocks bigger factories: stage 1
                  allows Factory I, stage 2 adds Factory II, stage 3 adds Factory
                  III, and stage 4 adds Factory IV. Milestone spaces also grant
                  standing demand bonuses of +2, +3, +4 and +5.
                </p>
                <p className="leading-relaxed">
                  The track belongs to the sector, not to any one company. Every
                  company below contributes to the same marker; the numbers are
                  their lifetime contributions.
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="pb-1">Company</th>
                      <th className="pb-1 text-right">Contributed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openEntry.companies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-t border-zinc-800/80"
                      >
                        <td className="py-1.5">{company.name}</td>
                        <td className="py-1.5 text-right tabular-nums text-zinc-400">
                          {company.researchProgress
                            ? `+${company.researchProgress}`
                            : "—"}
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
    </BoardSection>
  );
}
