import React, { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { RiHandCoinFill, RiTeamFill, RiInformationLine } from "@remixicon/react";
import { Tooltip, Accordion, AccordionItem } from "@nextui-org/react";
import { Sector } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { sectorColors } from "@server/data/gameData";
import {
  baseToolTipStyle,
  tooltipStyle,
  tooltipParagraphStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { SectorDemandRankings } from "./SectorDemandRankings";

type SectorPriorityItem = { sectorId: string; priority: number };

/**
 * Compute consumer distribution per sector using 50/30/20 split.
 * When all sectors share the same rank, splits 100% evenly with remainder to priority order.
 * Matches server logic in distributeConsumersToSectors.
 */
function computeDistribution(
  sectors: Sector[],
  totalToDistribute: number,
  sectorPriority: SectorPriorityItem[] | undefined
): number[] {
  if (!sectors.length || totalToDistribute <= 0) {
    return sectors.map(() => 0);
  }
  const demand = (s: Sector) => (s.demand ?? 0) + (s.demandBonus ?? 0);
  const sorted = [...sectors].sort((a, b) => demand(b) - demand(a));
  const rankBySectorId = new Map<string, number>();
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && demand(sorted[i - 1]) !== demand(sorted[i])) {
      currentRank++;
    }
    rankBySectorId.set(sorted[i].id, currentRank);
  }
  const sectorsByRank = new Map<number, Sector[]>();
  for (const s of sectors) {
    const r = rankBySectorId.get(s.id) ?? 1;
    if (!sectorsByRank.has(r)) sectorsByRank.set(r, []);
    sectorsByRank.get(r)!.push(s);
  }
  const prioritySorted = (sectorPriority ?? [])
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((p) => sectors.find((s) => s.id === p.sectorId))
    .filter((s): s is Sector => s != null);
  const inPriorityIds = new Set(prioritySorted.map((s) => s.id));
  const missing = sectors.filter((s) => !inPriorityIds.has(s.id));
  const priorityOrder =
    prioritySorted.length > 0 ? [...prioritySorted, ...missing] : [...sectors];
  const distribution = new Array<number>(sectors.length).fill(0);
  const getIndex = (s: Sector) => sectors.findIndex((x) => x.id === s.id);
  const allSameRank =
    sectorsByRank.size === 1 &&
    sectorsByRank.get(1)?.length === sectors.length;

  if (allSameRank) {
    const base = Math.floor(totalToDistribute / sectors.length);
    let remainder = totalToDistribute - base * sectors.length;
    for (const sector of priorityOrder) {
      const idx = getIndex(sector);
      if (idx < 0) continue;
      const add = base + (remainder > 0 ? 1 : 0);
      distribution[idx] = add;
      if (remainder > 0) remainder--;
    }
  } else {
    const rankPercentages = [0.5, 0.3, 0.2];
    for (let rank = 1; rank <= 3; rank++) {
      const atRank = sectorsByRank.get(rank);
      if (!atRank?.length) continue;
      const pct = rankPercentages[rank - 1];
      const totalForRank = Math.floor(totalToDistribute * pct);
      const basePer = Math.floor(totalForRank / atRank.length);
      let rem = totalForRank - basePer * atRank.length;
      const ordered = priorityOrder.filter((s) =>
        atRank.some((a) => a.id === s.id)
      );
      for (const sector of ordered) {
        const idx = getIndex(sector);
        if (idx < 0) continue;
        const add = basePer + (rem > 0 ? 1 : 0);
        distribution[idx] += add;
        if (rem > 0) rem--;
      }
    }
    let leftover = totalToDistribute - distribution.reduce((a, b) => a + b, 0);
    for (const sector of priorityOrder) {
      if (leftover <= 0) break;
      const idx = getIndex(sector);
      if (idx < 0) continue;
      distribution[idx] += 1;
      leftover--;
    }
  }
  return distribution;
}

const SectorComponentAnimation = ({
  sector,
  sectorColor,
  sectorIndex,
  consumersMoving,
  cumulativeConsumers,
}: {
  sector: Sector;
  sectorColor: string;
  sectorIndex: number;
  consumersMoving: number;
  cumulativeConsumers: number;
}) => {
  const { gameState } = useGame();
  return (
    <div
      className={`flex flex-col gap-2 text-slate-200 p-4 justify-center items-center rounded-md ${sectorColor}`}
      style={{ backgroundColor: sectorColor }}
    >
      {gameState?.sectorPriority && (
        <div className="text-xl">
          {
            gameState.sectorPriority.find((s) => s.sectorId === sector.id)
              ?.priority
          }
        </div>
      )}
      <div className="text-base lg:text-xl">{sector.name}</div>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <div>
            <p className={tooltipParagraphStyle}>
              <strong>Sector Demand:</strong> {sector.demand + (sector.demandBonus || 0)}
            </p>
            <p className={tooltipParagraphStyle}>
              Sector demand is research slot bonuses plus demand bonuses from active marketing (tier I +1, tier II +1, tier III +2 each while active). Brand score does not affect sector demand. Consumer distribution and worker salaries follow sector demand rankings (1st: 50% economy score, 2nd: 30%, 3rd: 20%).
            </p>
            <div className="mt-2 text-xs space-y-1">
              <div>Base Demand: {sector.baseDemand || 0}</div>
              <div>Demand Bonus: {sector.demandBonus || 0}</div>
              <div>Research Stage: {sector.researchMarker >= 10 ? 4 : sector.researchMarker >= 7 ? 3 : sector.researchMarker >= 4 ? 2 : 1}</div>
            </div>
          </div>
        }
      >
        <div className="text-base lg:text-xl flex gap-2 cursor-help">
          <RiHandCoinFill /> {sector.demand + (sector.demandBonus || 0)}
        </div>
      </Tooltip>
      <div className="text-base lg:text-xl">Consumers {cumulativeConsumers + consumersMoving}</div>

      {/* Static Consumers */}
      <div className="grid grid-cols-5 gap-1">
        {Array(cumulativeConsumers)
          .fill(0)
          .map((_, index) => (
            <div key={`static-${index}`}>
              <RiTeamFill size={24} />
            </div>
          ))}

        {/* Animated Consumers */}
        {Array(consumersMoving)
          .fill(0)
          .map((_, index) => (
            <motion.div
              key={`animated-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <RiTeamFill size={24} />
            </motion.div>
          ))}
      </div>
    </div>
  );
};

const EndTurnSectorConsumerDistributionAnimation = ({
  sectors,
}: {
  sectors: Sector[];
}) => {
  const { gameState } = useGame();

  const economyScore = gameState?.economyScore ?? 0;
  const consumerPool = gameState?.consumerPoolNumber ?? 0;
  const totalToDistribute = Math.min(economyScore, consumerPool);

  const { distribution, schedule, baseConsumers } = useMemo(() => {
    const dist = computeDistribution(
      sectors,
      totalToDistribute,
      gameState?.sectorPriority
    );
    const sched: number[] = [];
    for (let i = 0; i < sectors.length; i++) {
      for (let j = 0; j < dist[i]; j++) {
        sched.push(i);
      }
    }
    const base = sectors.map((s, i) =>
      Math.max(0, (s.consumers ?? 0) - dist[i])
    );
    return { distribution: dist, schedule: sched, baseConsumers: base };
  }, [sectors, totalToDistribute, gameState?.sectorPriority]);

  const [currentConsumerPool, setCurrentConsumerPool] = useState(consumerPool);
  const [economyScoreRemaining, setEconomyScoreRemaining] = useState(
    economyScore
  );
  const [cumulativeConsumers, setCumulativeConsumers] = useState(
    () => baseConsumers
  );
  const completedCountRef = useRef(0);

  // Initial pool size and economy score - keep stable so the animating list doesn't change length
  const initialPoolCount = consumerPool + economyScore;
  const initialEconomyScore = economyScore;

  // Safety check: ensure sectors array is valid
  if (!sectors || sectors.length === 0) {
    return <div>No sectors available</div>;
  }

  const currentScheduleIndex = completedCountRef.current;
  const currentSectorIndex =
    schedule.length > 0 && currentScheduleIndex < schedule.length
      ? schedule[currentScheduleIndex]
      : 0;
  const safeSectorIndex = Math.max(
    0,
    Math.min(currentSectorIndex, sectors.length - 1)
  );
  // One consumer "in flight" to the sector currently receiving (for display)
  const hasConsumerInFlight =
    currentScheduleIndex < schedule.length && schedule[currentScheduleIndex] >= 0;

  return (
    <div className="flex flex-col gap-4 text-xl">
      {/* Explanatory Information Section */}
      <Accordion className="w-full bg-gray-800/50 rounded-lg">
        <AccordionItem
          key="explanation"
          aria-label="How Consumer Distribution Works"
          title={
            <div className="flex items-center gap-2">
              <RiInformationLine size={20} />
              <span className="text-base font-semibold">How Consumer Distribution Works</span>
            </div>
          }
          classNames={{
            title: "text-white",
            content: "text-gray-300 text-sm space-y-4 pt-2",
          }}
        >
          <div className="space-y-4 pb-2">
            {/* Sector Demand System Explanation */}
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
              <h4 className="font-semibold text-white mb-2">Sector Demand System</h4>
              <p className={tooltipParagraphStyle}>
                Consumer distribution is determined by <strong>sector demand rankings</strong>. Sector demand is <strong>research slot bonus</strong> plus <strong>active marketing demand bonuses</strong> (tier I +1, tier II +1, tier III +2 per active campaign). Brand score affects factory attraction, not sector demand.
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-400 font-medium">1. Research Bonuses:</span> As companies research in a sector, they advance the sector research track. Each research slot grants a bonus to sector demand:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Slot 3: +2 demand bonus</li>
                      <li>Slot 6: +3 demand bonus</li>
                      <li>Slot 9: +4 demand bonus</li>
                      <li>Slot 12: +5 demand bonus</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">2. Active Marketing:</span> While campaigns run, tier I and tier II each add +1 sector demand and tier III adds +2. Multiple active campaigns stack.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">3. Sector Demand:</span> Each sector&apos;s total demand = research slot bonus + marketing demand bonuses. Higher demand = higher ranking.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">4. Sector Ranking:</span> Sectors are ranked by their total demand value. Sectors with the same demand share the same rank.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">5. Consumer Distribution:</span> Rankings determine consumer distribution using a 50/30/20 split (see below).
                  </div>
                </div>
              </div>
            </div>

            {/* Consumer Distribution Calculation */}
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
              <h4 className="font-semibold text-white mb-2">Consumer Distribution Process</h4>
              <p className={tooltipParagraphStyle}>
                Consumers are distributed from the Consumer Pool based on sector demand rankings:
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-400 font-medium">1. Distribution Amount:</span> The Economy Score determines how many consumers can be distributed from the Consumer Pool.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">2. Sector Demand Rankings:</span> Sectors are ranked by sector demand (research slot bonus + active marketing demand bonuses). Tied sectors share the rank and split the percentage evenly.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">3. Fixed Split:</span> 1st place sector receives 50% of economy score, 2nd place receives 30%, 3rd place receives 20%. If sectors are tied, they split the percentage evenly (e.g., 3 sectors tied for 1st = 16.67% each).
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">4. Bonus Consumers:</span> In addition to the economy score distribution, each sector also receives bonus consumers equal to its sector demand value (guaranteed, outside the 50/30/20 split).
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">5. Consumer Pool:</span> Consumers move from the Consumer Pool into sectors based on sector demand rankings. The pool depletes as the Economy Score is consumed.
                  </div>
                </div>
              </div>
            </div>

            {/* Sector Demand Rankings Breakdown */}
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
              <SectorDemandRankings />
            </div>
          </div>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Consumer Pool Section */}
          <div className="flex relative">
            <Tooltip
              content="The number of consumers available to purchase goods and services each turn."
              classNames={{ base: baseToolTipStyle }}
              className={tooltipStyle}
            >
              <div className="flex gap-2 text-base lg:text-xl">
                <span>Consumer Pool</span>
                <span>{currentConsumerPool + economyScoreRemaining}</span>
              </div>
            </Tooltip>
          </div>

          {/* Economy Score Section */}
          <div className="flex relative">
            <Tooltip
              classNames={{ base: baseToolTipStyle }}
              className={tooltipStyle}
              content={
                <div>
                  <p className={tooltipParagraphStyle}>
                    The Economy Score determines how many consumers can be distributed from the Consumer Pool to sectors.
                  </p>
                  <p className={tooltipParagraphStyle}>
                    It is determined by worker allocation on the workforce track. It starts at 8 when no workers are allocated and increases as workers are put to work in factories, marketing campaigns, or research.
                  </p>
                  <p className={tooltipParagraphStyle}>
                    The score is determined by the rightmost allocated worker&apos;s position on the track. Higher economy score = more consumers can be distributed to sectors this turn.
                  </p>
                </div>
              }
            >
              <div className="flex gap-2 text-base lg:text-xl">
                <span>Economy Score</span>
                <span>{economyScoreRemaining}</span>
              </div>
            </Tooltip>
          </div>
        </div>
        <ul className="flex flex-wrap space-x-1">
          {Array.from({ length: initialPoolCount }).map((_, index) => {
            const isAnimatingOut = index < initialEconomyScore;
            return (
              <motion.li
                key={index}
                initial={{ opacity: 1, y: 0 }}
                animate={
                  isAnimatingOut ? { opacity: 0, y: 30 } : undefined
                }
                transition={{
                  duration: 0.5,
                  delay: isAnimatingOut ? index * 1 : 0,
                }}
                className="relative"
                style={{ width: 30, height: 30 }}
                onAnimationComplete={
                  isAnimatingOut
                    ? () => {
                        const idx = completedCountRef.current;
                        if (idx >= schedule.length) return;
                        const sectorIdx = schedule[idx];
                        completedCountRef.current = idx + 1;
                        setCumulativeConsumers((prev) => {
                          const next = [...prev];
                          next[sectorIdx] = (next[sectorIdx] ?? 0) + 1;
                          return next;
                        });
                        setCurrentConsumerPool((prev) =>
                          Math.max(0, prev - 1)
                        );
                        setEconomyScoreRemaining((prev) =>
                          Math.max(0, prev - 1)
                        );
                      }
                    : undefined
                }
              >
                <RiTeamFill size={24} />
              </motion.li>
            );
          })}
        </ul>
      </div>

      {/* Sectors with Consumers Moving */}
      <div className="flex flex-wrap gap-3">
        {sectors.map((sector, index) => (
          <SectorComponentAnimation
            key={sector.id}
            sector={sector}
            sectorColor={sectorColors[sector.name]}
            sectorIndex={index}
            consumersMoving={hasConsumerInFlight && index === safeSectorIndex ? 1 : 0}
            cumulativeConsumers={cumulativeConsumers[index] || 0}
          />
        ))}
      </div>
    </div>
  );
};

export default EndTurnSectorConsumerDistributionAnimation;
