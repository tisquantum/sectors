import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RiHandCoinFill, RiTeamFill } from "@remixicon/react";
import { Tooltip } from "@nextui-org/react";
import EconomySector from "./EconomySector";
import { Sector } from "@server/prisma/prisma.client";
import { useGame } from "./GameContext";
import { sectorColors } from "@server/data/gameData";
import { sectorPriority } from "@server/data/constants";

const SectorComponent = ({
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
  return (
    <div
      className={`flex flex-col gap-2 text-slate-200 p-4 justify-center items-center rounded-md ${sectorColor}`}
      style={{ backgroundColor: sectorColor }}
    >
      <div className="text-xl">{sector.name}</div>
      <div className="text-xl flex gap-2">
        <RiHandCoinFill /> {sector.demand + (sector.demandBonus || 0)}
      </div>
      <div>Consumers {cumulativeConsumers + consumersMoving}</div>

      {/* Static Consumers */}
      <div className="grid grid-cols-5 gap-2">
        {Array(cumulativeConsumers)
          .fill(0)
          .map((_, index) => (
            <div key={`static-${index}`}>
              <RiTeamFill size={30} />
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
              <RiTeamFill size={30} />
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
  const sectorConsumers = sectors.map((sector) => sector.consumers);
  let remainingEconomyScore = economyScore;
  let sectorIndex = 0;

  // Loop until the remaining economy score is depleted
  while (remainingEconomyScore > 0) {
    const sector = sectors[sectorIndex];
    const sectorDemand = sector.demand + (sector.demandBonus || 0);

    // Determine how many consumers can be subtracted from the current sector
    const consumersToMove = Math.min(sectorDemand, remainingEconomyScore);

    // Add the consumers to the result array
    sectorConsumers[sectorIndex] -= consumersToMove;

    // Subtract from the remaining economy score
    remainingEconomyScore -= consumersToMove;

    // Move to the next sector (loop back to the beginning if needed)
    sectorIndex = (sectorIndex + 1) % sectors.length;
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
    gameState.consumerPoolNumber
  );
  const [economyScore, setEconomyScore] = useState(gameState.economyScore);
  const [currentSectorIndex, setCurrentSectorIndex] = useState(0);
  const [consumersMoving, setConsumersMoving] = useState(0);
  const [cumulativeConsumers, setCumulativeConsumers] = useState(
    calculatePreviousSectorConsumers(sectors, gameState.economyScore)
  );
  const currentSector = sectors[currentSectorIndex];
  const sectorDemand = currentSector.demand + (currentSector.demandBonus || 0);

  return (
    <div className="flex flex-col gap-2 text-xl">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Consumer Pool Section */}
          <div className="flex relative">
            <Tooltip content="The number of consumers available to purchase goods and services each turn.">
              <div className="flex gap-2 text-xl">
                <span>Consumer Pool</span>
                <span>{currentConsumerPool + economyScore}</span>
              </div>
            </Tooltip>
          </div>

          {/* Economy Score Section */}
          <div className="flex relative">
            <Tooltip content="The economy score reflects the overall economic status.">
              <div className="flex gap-2 text-xl">
                <span>Economy Score</span>
                <span>{economyScore}</span>
              </div>
            </Tooltip>
          </div>
        </div>
        <ul className="flex flex-wrap space-x-2">
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
                if (currentConsumerPool > 0 && economyScore > 0) {
                  if (consumersMoving < sectorDemand) {
                    setConsumersMoving((prev) => prev + 1);
                    setCurrentConsumerPool((prev) => prev - 1);
                    setEconomyScore((prev) => prev - 1);
                  } else {
                    setCumulativeConsumers((prev) => {
                      const newCumulative = [...prev];
                      newCumulative[currentSectorIndex] += consumersMoving;
                      return newCumulative;
                    });
                    setConsumersMoving(0); // Reset consumers for the next sector
                    // Move to the next sector
                    setCurrentSectorIndex((prev) =>
                      prev + 1 < sectors.length ? prev + 1 : 0
                    );
                    setConsumersMoving((prev) => prev + 1);
                    setCurrentConsumerPool((prev) => prev - 1);
                    setEconomyScore((prev) => prev - 1);
                  }
                }
              }}
            >
              <RiTeamFill size={30} />
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Sectors with Consumers Moving */}
      <div className="flex gap-3">
        {sectors.map((sector, index) => (
          <SectorComponent
            key={sector.id}
            sector={sector}
            sectorColor={sectorColors[sector.name]}
            sectorIndex={index}
            consumersMoving={index === currentSectorIndex ? consumersMoving : 0}
            cumulativeConsumers={cumulativeConsumers[index]}
          />
        ))}
      </div>
    </div>
  );
};

export default EndTurnSectorConsumerDistributionAnimation;
