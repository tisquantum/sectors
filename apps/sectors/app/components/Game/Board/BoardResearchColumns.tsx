"use client";

import { useMemo, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { sectorColors } from "@server/data/gameData";
import type { Company, Sector } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
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

interface SectorResearch {
  sector: Sector;
  color: string;
  marker: number;
  companies: Company[];
}

/** One sector's shared 12-space research track, drawn bottom-up as a column. */
function ResearchColumn({
  entry,
  onOpen,
}: {
  entry: SectorResearch;
  onOpen: () => void;
}) {
  const spaces = Array.from({ length: TRACK_LENGTH }, (_, i) => TRACK_LENGTH - i);

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${entry.sector.name} research ${entry.marker}/12 · stage ${stageFor(
        entry.marker
      )}`}
      className="flex min-w-0 flex-1 basis-0 flex-col items-stretch gap-0.5 rounded border border-zinc-800 bg-zinc-900/50 p-1 transition-colors hover:border-zinc-600"
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
      <span className="text-center text-[9px] uppercase tracking-wider text-zinc-500">
        Stage {stageFor(entry.marker)}
      </span>
    </button>
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
  const { gameId } = useGame();
  const [openEntry, setOpenEntry] = useState<SectorResearch | null>(null);

  const { data: sectors } = trpc.sector.listSectors.useQuery(
    { where: { gameId }, orderBy: { name: "asc" } },
    { enabled: !!gameId }
  );
  const { data: companies } = trpc.company.listCompanies.useQuery(
    { where: { gameId }, orderBy: { name: "asc" } },
    { enabled: !!gameId }
  );

  const entries = useMemo<SectorResearch[]>(() => {
    if (!sectors) return [];
    return sectors
      .map((sector) => ({
        sector,
        color: sectorColors[sector.name] ?? "#52525b",
        marker: sector.researchMarker ?? 0,
        companies: (companies ?? []).filter(
          (company) => company.sectorId === sector.id
        ),
      }))
      .filter((entry) => entry.companies.length > 0);
  }, [sectors, companies]);

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
                onOpen={() => setOpenEntry(entry)}
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
