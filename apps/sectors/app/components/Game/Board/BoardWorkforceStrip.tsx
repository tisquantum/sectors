"use client";

import { useMemo } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { DEFAULT_WORKERS, ECONOMY_SCORE_VALUES } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { trpc } from "@sectors/app/trpc";
import { cn } from "@/lib/utils";
import { useGame } from "../GameContext";
import { BoardInfo, BoardSection } from "./BoardSection";
import type { FocusLevel } from "./boardFocus";

const TRACK_LENGTH = ECONOMY_SCORE_VALUES.length;

/**
 * The workforce and economy track as a single horizontal ladder. Workers fill
 * left to right; the economy score is read off the rightmost filled space.
 */
export function BoardWorkforceStrip({ focus }: { focus: FocusLevel }) {
  const { gameId, gameState } = useGame();
  const detail = useDisclosure();

  const { data: allocation } =
    trpc.modernOperations.getWorkerAllocationBySector.useQuery(
      { gameId },
      { enabled: !!gameId }
    );

  const totalWorkers = DEFAULT_WORKERS;
  const allocatedFromData =
    allocation?.reduce((sum, sector) => sum + sector.totalWorkers, 0) ?? 0;
  const pool = gameState?.workforcePool ?? 0;
  const availableWorkers =
    pool > 0 ? pool : Math.max(0, totalWorkers - allocatedFromData);
  const allocatedWorkers = Math.max(0, totalWorkers - availableWorkers);
  const economyScore =
    allocatedWorkers > 0
      ? ECONOMY_SCORE_VALUES[allocatedWorkers - 1]
      : ECONOMY_SCORE_VALUES[0];

  const spaceToSector = useMemo(() => {
    const map = new Map<number, { color: string; sectorName: string }>();
    if (!allocation || allocatedWorkers <= 0) return map;
    let space = 1;
    for (const sector of [...allocation].sort(
      (a, b) => b.totalWorkers - a.totalWorkers
    )) {
      const color = sectorColors[sector.name] ?? "#71717a";
      for (let i = 0; i < sector.totalWorkers && space <= allocatedWorkers; i++) {
        map.set(space, { color, sectorName: sector.name });
        space++;
      }
    }
    return map;
  }, [allocation, allocatedWorkers]);

  const spaces = Array.from({ length: TRACK_LENGTH }, (_, i) => i + 1);

  return (
    <BoardSection
      title="Workforce · Economy"
      hint={`${availableWorkers} free · ${allocatedWorkers} working · economy score ${economyScore}`}
      info={
        <BoardInfo title="Workforce and economy">
          <p>
            One track holds every worker in the game. Green spaces on the right
            are the <b>free pool</b>; coloured dots on the left are workers a
            company has hired, tinted by the sector employing them. Factories,
            marketing campaigns and research all draw from the same pool, so a
            busy table runs short of labour.
          </p>
          <p>
            The number above the last occupied space is the{" "}
            <b>economy score</b>, and it sets how many consumers are released
            from the pool into the sectors each turn. More people working means
            more people shopping.
          </p>
          <p>
            Workers are not free: at every earnings call a company pays its
            sector&apos;s salary for each worker it employs, whether or not
            customers turned up.
          </p>
        </BoardInfo>
      }
      focus={focus}
      bodyClassName="p-1.5"
    >
      <button
        type="button"
        onClick={detail.onOpen}
        className="flex w-full items-stretch gap-px"
        title="Workforce track — press for the sector breakdown"
      >
        {spaces.map((space) => {
          const isAvailable = space > allocatedWorkers;
          const isEconomyScore =
            allocatedWorkers > 0 && space === allocatedWorkers;
          const sector = spaceToSector.get(space);
          const spaceScore = ECONOMY_SCORE_VALUES[space - 1];
          const isMilestone = spaceScore !== ECONOMY_SCORE_VALUES[space - 2];

          return (
            <span
              key={space}
              title={
                isAvailable
                  ? `Open worker · economy score ${spaceScore}`
                  : `${sector?.sectorName ?? "Allocated"} · economy score ${spaceScore}`
              }
              className={cn(
                "relative flex h-9 flex-1 flex-col items-center justify-end rounded-[2px] border pb-0.5",
                isAvailable
                  ? "border-emerald-800/50 bg-emerald-950/40"
                  : "border-zinc-700/50 bg-zinc-800/60",
                isEconomyScore &&
                  "z-10 border-sky-400 ring-1 ring-sky-400 ring-offset-0"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 text-[8px] leading-none tabular-nums",
                  isMilestone ? "font-semibold text-zinc-400" : "text-zinc-600"
                )}
              >
                {spaceScore}
              </span>
              {isAvailable ? (
                <span className="mb-0.5 h-2 w-2 rounded-full bg-emerald-500/85" />
              ) : (
                <span
                  className="mb-0.5 h-2 w-2 rounded-full border border-black/50"
                  style={{ backgroundColor: sector?.color ?? "#52525b" }}
                />
              )}
            </span>
          );
        })}
      </button>

      {allocation && allocation.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {allocation
            .filter((sector) => sector.totalWorkers > 0)
            .map((sector) => (
              <span
                key={sector.sectorId}
                className="flex items-center gap-1 text-[10px] text-zinc-400"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: sectorColors[sector.name] ?? "#71717a" }}
                />
                {sector.name} {sector.totalWorkers}
              </span>
            ))}
        </div>
      )}

      <Modal
        isOpen={detail.isOpen}
        onOpenChange={detail.onOpenChange}
        size="2xl"
        className="dark bg-zinc-950 text-foreground"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-0.5">
            <span>Workforce track</span>
            <span className="text-xs font-normal text-zinc-400">
              Economy score {economyScore} · {allocatedWorkers} of {totalWorkers}{" "}
              workers allocated
            </span>
          </ModalHeader>
          <ModalBody className="gap-3 pb-5 text-sm text-zinc-300">
            <p className="leading-relaxed">
              Workers move onto the track as companies build factories, run
              marketing campaigns and fund research. The economy score is read
              from the rightmost occupied space, and it sets how many consumers
              leave the pool for the sectors each turn.
            </p>
            {allocation && allocation.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="pb-1">Sector</th>
                    <th className="pb-1 text-right">Workers</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.map((sector) => (
                    <tr
                      key={sector.sectorId}
                      className="border-t border-zinc-800/80"
                    >
                      <td className="flex items-center gap-2 py-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: sectorColors[sector.name] ?? "#71717a",
                          }}
                        />
                        {sector.name}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {sector.totalWorkers}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </BoardSection>
  );
}
