import React, { useState, useEffect, useCallback } from "react";
import {
  RiBox2Fill,
  RiHandCoinFill,
  RiMoneyDollarBoxFill,
  RiTeamFill,
} from "@remixicon/react";
import { getCompanyOperatingRoundTurnOrder } from "@server/data/constants";
import { calculateCompanySupply, calculateDemand } from "@server/data/helpers";
import { Company, Sector } from "@server/prisma/prisma.client";
import { motion, AnimatePresence } from "framer-motion";
import { sectorColors } from "@server/data/gameData";

const SectorConsumerDistributionAnimation = ({
  sector,
  companies,
  consumerOveride,
}: {
  sector: Sector;
  companies: Company[];
  consumerOveride?: number;
}) => {
  const sortedCompanies = getCompanyOperatingRoundTurnOrder(companies);
  const [sectorConsumers, setSectorConsumers] = useState(
    consumerOveride || sector.consumers
  );
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  const [moneyEarned, setMoneyEarned] = useState(() =>
    sortedCompanies.map(() => 0)
  );
  const [
    currentConsumersMovedAcrossAllCompaniesInSector,
    setCurrentConsumersMovedAcrossAllCompaniesInSector,
  ] = useState<number>(0);
  const animationInterval = 900;
  const currentCompany = sortedCompanies[currentCompanyIndex];

  const companyDemand =
    calculateDemand(currentCompany.demandScore, currentCompany.baseDemand) || 0;
  const companySupply = calculateCompanySupply(
    currentCompany.supplyMax,
    currentCompany.supplyBase,
    currentCompany.supplyCurrent
  );
  const maximumConsumersWhoWillVisit = Math.min(companyDemand, companySupply);

  const handleConsumerMove = () => {
    if (
      sectorConsumers > 0 &&
      moneyEarned[currentCompanyIndex] <
        maximumConsumersWhoWillVisit * currentCompany.unitPrice
    ) {
      setSectorConsumers((prev) => prev - 1);
    } else {
      setCurrentCompanyIndex((prev) => {
        if (prev + 1 > sortedCompanies.length - 1) {
          return prev;
        } else {
          return prev + 1;
        }
      });
    }
  };

  useEffect(() => {
    console.log(
      "maximumConsumersWhoWillVisit",
      maximumConsumersWhoWillVisit,
      currentCompany.name,
      currentCompanyIndex,
      sectorConsumers
    );
    if (currentCompanyIndex === 0) {
      setSectorConsumers(consumerOveride || sector.consumers);
      setCurrentConsumersMovedAcrossAllCompaniesInSector(0);
    }
  }, [currentCompanyIndex]);

  useEffect(() => {
    handleConsumerMove();
  }, [moneyEarned]);
  return (
    <motion.div
      className={`flex flex-col items-center space-x-4 rounded-md my-2 bg-[${
        sectorColors[sector.name]
      }]`}
    >
      {/* Sector and Consumers */}
      <div className={`flex flex-col items-center`}>
        <span>{sector.name}</span>
        <div className="flex space-x-2">
          {Array.from({ length: sectorConsumers }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 1 }}
              animate={
                maximumConsumersWhoWillVisit > 0 &&
                index <= currentConsumersMovedAcrossAllCompaniesInSector
                  ? { y: 50, opacity: 0 }
                  : {}
              }
              transition={{ duration: 1 }}
              className="relative"
              style={{ width: 30, height: 30 }} // Fixed size
              onAnimationComplete={() => {
                console.log(
                  "onAnimationComplete",
                  index,
                  currentConsumersMovedAcrossAllCompaniesInSector,
                  currentCompany.name
                );
                setMoneyEarned((prev) => {
                  const newEarnings = [...prev];
                  newEarnings[currentCompanyIndex] += currentCompany.unitPrice;
                  return newEarnings;
                });
                setCurrentConsumersMovedAcrossAllCompaniesInSector(
                  (prev) => prev + 1
                );
              }}
            >
              <RiTeamFill size={30} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Company Information */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentCompanyIndex}
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 1 }}
          className="flex flex-col"
          style={{ width: 200, minHeight: 100 }} // Fixed width/height
        >
          <span>{currentCompany.name}</span>
          <div className="flex gap-1">
            <RiHandCoinFill size={18} className="ml-2" />
            <span>{companyDemand}</span>
          </div>
          <div className="flex gap-1">
            <RiBox2Fill size={18} className="ml-2" />
            <span>{companySupply}</span>
          </div>
          <div className="flex gap-1">
            <RiMoneyDollarBoxFill size={30} />
            <motion.span
              key={moneyEarned[currentCompanyIndex]}
              initial={{ scale: 1 }}
              animate={{ scale: 1.5 }}
              transition={{ duration: 0.5 }}
            >
              {moneyEarned[currentCompanyIndex]}
            </motion.span>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default SectorConsumerDistributionAnimation;
