import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RiHandCoinFill, RiTeamFill, RiInformationLine } from "@remixicon/react";
import { Tooltip, Accordion, AccordionItem } from "@nextui-org/react";
import EconomySector from "./EconomySector";
import { Sector } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { sectorColors } from "@server/data/gameData";
import { sectorPriority } from "@server/data/constants";
import SectorComponent from "../Sector/Sector";
import {
  baseToolTipStyle,
  tooltipStyle,
  tooltipParagraphStyle,
} from "@sectors/app/helpers/tailwind.helpers";

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
              <strong>Effective Demand:</strong> {sector.demand + (sector.demandBonus || 0)}
            </p>
            <p className={tooltipParagraphStyle}>
              This is the number of consumers this sector can attract per distribution cycle.
            </p>
            <div className="mt-2 text-xs space-y-1">
              <div>Base Demand: {sector.baseDemand || 0}</div>
              <div>Demand Bonus: {sector.demandBonus || 0}</div>
              <div>Research Stage: {sector.researchMarker >= 16 ? 4 : sector.researchMarker >= 11 ? 3 : sector.researchMarker >= 6 ? 2 : 1}</div>
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
    if (researchMarker >= 16) return 4;
    if (researchMarker >= 11) return 3;
    if (researchMarker >= 6) return 2;
    return 1;
  };

  const getResearchStageBonus = (researchMarker: number): number => {
    const stage = getResearchStage(researchMarker);
    switch (stage) {
      case 2: return 2;
      case 3: return 3;
      case 4: return 5;
      default: return 0;
    }
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
            {/* Sector Demand Calculation */}
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
              <h4 className="font-semibold text-white mb-2">Sector Demand Calculation</h4>
              <p className={tooltipParagraphStyle}>
                Each sector's effective demand determines how many consumers it can attract:
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-medium">Effective Demand =</span>
                </div>
                <div className="ml-4 space-y-1">
                  <div>• Base Sector Demand (from game initialization)</div>
                  <div>• + Sum of Brand Scores (all companies in the sector)</div>
                  <div>• + (Worker Allocation ÷ 2)</div>
                  <div className="ml-4 text-gray-400">Worker Allocation = Factory Workers + Marketing Workers + Research Workers</div>
                  <div>• + Research Stage Bonus</div>
                  <div className="ml-4 text-gray-400">
                    Stage 1 (0-5): +0 | Stage 2 (6-10): +2 | Stage 3 (11-15): +3 | Stage 4 (16-20): +5
                  </div>
                </div>
              </div>
            </div>

            {/* Consumer Distribution Calculation */}
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
              <h4 className="font-semibold text-white mb-2">Consumer Distribution Process</h4>
              <p className={tooltipParagraphStyle}>
                Consumers are distributed from the Consumer Pool based on the Economy Score:
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-400 font-medium">1. Distribution Amount:</span> The Economy Score determines how many consumers can be distributed. This equals the number of consumers that move from the Consumer Pool to sectors.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">2. Proportional Distribution:</span> Consumers are distributed proportionally based on each sector's effective demand relative to total sector demand.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">3. Priority Order:</span> Sectors are processed in priority order (left to right). Each sector receives consumers equal to its demand value per cycle, cycling through sectors until the Economy Score is fully consumed.
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">4. Consumer Pool:</span> Consumers move from the Consumer Pool (shown above) into sectors based on their demand. The pool depletes as the Economy Score is consumed.
                  </div>
                </div>
              </div>
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
                    It starts at 10 and increases by 1 for every 2 workers allocated to factories, marketing campaigns, or research.
                  </p>
                  <p className={tooltipParagraphStyle}>
                    Higher economy score = more consumers can be distributed to sectors this turn.
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
