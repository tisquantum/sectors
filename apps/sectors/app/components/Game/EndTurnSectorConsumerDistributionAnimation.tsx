import React, { useState, useEffect } from "react";
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
              Sector demand is based on brand score (from marketing) and research slot bonuses. Consumer distribution and worker salaries are determined by sector demand rankings (1st: 50% economy score, 2nd: 30%, 3rd: 20%).
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

const calculatePreviousSectorConsumers = (
  sectors: Sector[],
  economyScore: number
) => {
  // Safety check: return empty array if no sectors
  if (!sectors || sectors.length === 0) {
    console.warn(`[calculatePreviousSectorConsumers] No sectors provided`);
    return [];
  }

  const sectorConsumers = sectors.map((sector) => sector.consumers || 0);
  let remainingEconomyScore = Math.max(0, economyScore);
  let sectorIndex = 0;
  let iterations = 0;
  const MAX_ITERATIONS = sectors.length * 100; // Safety limit: prevent infinite loops

  // Loop until the remaining economy score is depleted
  while (remainingEconomyScore > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Safety check: ensure sector exists
    if (sectorIndex >= sectors.length || sectorIndex < 0) {
      console.error(`[calculatePreviousSectorConsumers] Invalid sectorIndex: ${sectorIndex}, sectors.length: ${sectors.length}`);
      break;
    }

    const sector = sectors[sectorIndex];
    
    // Safety check: ensure sector is defined
    if (!sector) {
      console.error(`[calculatePreviousSectorConsumers] Sector at index ${sectorIndex} is undefined`);
      break;
    }

    const sectorDemand = (sector.demand || 0) + (sector.demandBonus || 0);

    // Safety check: if demand is 0, we can't process this sector
    if (sectorDemand <= 0) {
      // Move to next sector if this one has no demand
      sectorIndex = (sectorIndex + 1) % sectors.length;
      continue;
    }

    // Determine how many consumers can be subtracted from the current sector
    const consumersToMove = Math.min(sectorDemand, remainingEconomyScore);

    // Add the consumers to the result array
    sectorConsumers[sectorIndex] = Math.max(0, sectorConsumers[sectorIndex] - consumersToMove);

    // Subtract from the remaining economy score
    remainingEconomyScore -= consumersToMove;

    // Move to the next sector (loop back to the beginning if needed)
    sectorIndex = (sectorIndex + 1) % sectors.length;
  }

  if (iterations >= MAX_ITERATIONS) {
    console.error(`[calculatePreviousSectorConsumers] MAX_ITERATIONS reached! remainingEconomyScore: ${remainingEconomyScore}`);
  }

  return sectorConsumers.map((consumers) => Math.max(consumers, 0));
};

const EndTurnSectorConsumerDistributionAnimation = ({
  sectors,
}: {
  sectors: Sector[];
}) => {
  const { gameState } = useGame();
  
  const [currentConsumerPool, setCurrentConsumerPool] = useState(
    gameState?.consumerPoolNumber || 0
  );
  const [economyScore, setEconomyScore] = useState(gameState?.economyScore || 0);
  const [currentSectorIndex, setCurrentSectorIndex] = useState(0);
  const [consumersMoving, setConsumersMoving] = useState(0);
  const [cumulativeConsumers, setCumulativeConsumers] = useState(
    calculatePreviousSectorConsumers(sectors, gameState?.economyScore || 0)
  );
  
  // Safety check: ensure sectors array is valid
  if (!sectors || sectors.length === 0) {
    console.warn(`[EndTurnSectorConsumerDistributionAnimation] No sectors provided`);
    return <div>No sectors available</div>;
  }
  
  // Safety check: ensure currentSectorIndex is valid
  const safeSectorIndex = Math.max(0, Math.min(currentSectorIndex, sectors.length - 1));
  const currentSector = sectors[safeSectorIndex];
  
  // Safety check: ensure sector exists and has demand
  if (!currentSector) {
    console.error(`[EndTurnSectorConsumerDistributionAnimation] Invalid sector at index ${safeSectorIndex}`);
    return <div>Error: Invalid sector data</div>;
  }
  
  const sectorDemand = (currentSector.demand || 0) + (currentSector.demandBonus || 0);

  // Calculate research stage for display
  const getResearchStage = (researchMarker: number): number => {
    if (researchMarker >= 10) return 4;
    if (researchMarker >= 7) return 3;
    if (researchMarker >= 4) return 2;
    return 1;
  };

  const getResearchSlotBonus = (researchMarker: number): number => {
    if (researchMarker >= 12) return 4;
    if (researchMarker >= 9) return 3;
    if (researchMarker >= 6) return 2;
    if (researchMarker >= 3) return 1;
    return 0;
  };

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
                Consumer distribution is determined by <strong>sector demand rankings</strong>. Sector demand is the sum of <strong>brand score</strong> (from marketing) and <strong>research slot bonus</strong> (from advancing the sector research track):
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-400 font-medium">1. Brand Score:</span> The sum of all companies&apos; brand scores in the sector. Marketing campaigns increase brand score, which increases sector demand.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">2. Research Bonuses:</span> As companies research in a sector, they advance the sector research track. Each research slot grants a bonus to sector demand:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Slot 3: +1 demand bonus</li>
                      <li>Slot 6: +2 demand bonus</li>
                      <li>Slot 9: +3 demand bonus</li>
                      <li>Slot 12: +4 demand bonus</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">3. Sector Demand:</span> Each sector&apos;s total demand = brand score + research slot bonus. Higher demand = higher ranking.
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
                    <span className="text-blue-400 font-medium">2. Sector Demand Rankings:</span> Sectors are ranked by sector demand (brand score + research slot bonus). Tied sectors share the rank and split the percentage evenly.
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
                <span>{currentConsumerPool + gameState.economyScore}</span>
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
                <span>{economyScore}</span>
              </div>
            </Tooltip>
          </div>
        </div>
        <ul className="flex flex-wrap space-x-1">
          {Array.from({
            length: gameState.consumerPoolNumber + economyScore,
          }).map((_, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 1, y: 0 }}
              animate={
                index < gameState.economyScore && {
                  opacity: 0,
                  y: 30,
                }
              }
              transition={{ duration: 0.5, delay: index * 1 }}
              className="relative"
              style={{ width: 30, height: 30 }}
              onAnimationComplete={() => {
                // Safety checks: ensure we have valid data and sectorDemand > 0
                if (currentConsumerPool > 0 && economyScore > 0 && sectorDemand > 0) {
                  if (consumersMoving < sectorDemand) {
                    setConsumersMoving((prev) => prev + 1);
                    setCurrentConsumerPool((prev) => Math.max(0, prev - 1));
                    setEconomyScore((prev) => Math.max(0, prev - 1));
                  } else {
                    setCumulativeConsumers((prev) => {
                      const newCumulative = [...prev];
                      // Use safe index to prevent out-of-bounds access
                      const safeIndex = Math.max(0, Math.min(currentSectorIndex, sectors.length - 1));
                      newCumulative[safeIndex] = (newCumulative[safeIndex] || 0) + consumersMoving;
                      return newCumulative;
                    });
                    setConsumersMoving(0); // Reset consumers for the next sector
                    // Move to the next sector with bounds checking
                    setCurrentSectorIndex((prev) => {
                      const nextIndex = prev + 1;
                      return nextIndex < sectors.length ? nextIndex : 0;
                    });
                    setConsumersMoving((prev) => prev + 1);
                    setCurrentConsumerPool((prev) => Math.max(0, prev - 1));
                    setEconomyScore((prev) => Math.max(0, prev - 1));
                  }
                }
              }}
            >
              <RiTeamFill size={24} />
            </motion.li>
          ))}
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
            consumersMoving={index === safeSectorIndex ? consumersMoving : 0}
            cumulativeConsumers={cumulativeConsumers[index] || 0}
          />
        ))}
      </div>
    </div>
  );
};

export default EndTurnSectorConsumerDistributionAnimation;
