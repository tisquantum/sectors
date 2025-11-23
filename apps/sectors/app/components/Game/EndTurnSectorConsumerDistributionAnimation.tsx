import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RiHandCoinFill, RiTeamFill } from "@remixicon/react";
import { Tooltip } from "@nextui-org/react";
import EconomySector from "./EconomySector";
import { Sector } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { sectorColors } from "@server/data/gameData";
import { sectorPriority } from "@server/data/constants";
import SectorComponent from "../Sector/Sector";
import {
  baseToolTipStyle,
  tooltipStyle,
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
      <div className="text-base lg:text-xl flex gap-2">
        <RiHandCoinFill /> {sector.demand + (sector.demandBonus || 0)}
      </div>
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

  return (
    <div className="flex flex-col gap-2 text-xl">
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
              content="The economy score reflects the overall economic status."
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
