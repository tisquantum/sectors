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
  const [consumersMoving, setConsumersMoving] = useState<number[]>([]);

  const animationInterval = 3000;
  const currentCompany = sortedCompanies[currentCompanyIndex];

  const companyDemand =
    calculateDemand(currentCompany.demandScore, currentCompany.baseDemand) || 0;
  const companySupply = calculateCompanySupply(
    currentCompany.supplyMax,
    currentCompany.supplyBase,
    currentCompany.supplyCurrent
  );
  const maximumConsumersWhoWillVisit = Math.min(companyDemand, companySupply);

  const handleConsumerMove = useCallback(() => {
    if (
      sectorConsumers > 0 &&
      moneyEarned[currentCompanyIndex] <
        maximumConsumersWhoWillVisit * currentCompany.unitPrice
    ) {
      setConsumersMoving((prev) => [...prev, prev.length]);
      setSectorConsumers((prev) => prev - 1);
    } else {
      setCurrentCompanyIndex((prev) => (prev + 1) % sortedCompanies.length);
      setConsumersMoving([]); // Reset consumers moving for the next company
    }
  }, [
    sectorConsumers,
    currentCompanyIndex,
    moneyEarned,
    maximumConsumersWhoWillVisit,
    sortedCompanies.length,
  ]);

  useEffect(() => {
    const interval = setInterval(handleConsumerMove, animationInterval);
    return () => clearInterval(interval);
  }, [handleConsumerMove]);

  return (
    <motion.div className="flex items-start space-x-4">
      {/* Sector and Consumers */}
      <div className="flex flex-col items-center">
        <span>{sector.name}</span>
        <div className="flex space-x-2">
          {Array.from({ length: sectorConsumers + consumersMoving.length }).map(
            (_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 1 }}
                animate={
                  index < consumersMoving.length ? { y: 50, opacity: 0 } : {}
                }
                transition={{ duration: 1 }}
                className="relative"
                onAnimationComplete={() => {
                  if (index < consumersMoving.length) {
                    setMoneyEarned((prev) => {
                      const newEarnings = [...prev];
                      newEarnings[currentCompanyIndex] +=
                        currentCompany.unitPrice;
                      return newEarnings;
                    });
                  }
                }}
              >
                <RiTeamFill size={30} />
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* Company Information */}
      <AnimatePresence>
        <motion.div
          key={currentCompanyIndex}
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 1 }}
          className="flex flex-col"
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
