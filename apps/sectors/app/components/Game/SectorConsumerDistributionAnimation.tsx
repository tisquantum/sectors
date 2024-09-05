import React, { useState, useEffect, useCallback } from "react";
import {
  RiBox2Fill,
  RiHandCoinFill,
  RiMoneyDollarBoxFill,
  RiPriceTag3Fill,
  RiTeamFill,
} from "@remixicon/react";
import { getCompanyActionOperatingRoundTurnOrder } from "@server/data/constants";
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
  const totalConsumersWhoWillMoveAcrossAllCompaniesInSector = companies.reduce(
    (acc, company) => {
      const companyDemand =
        calculateDemand(company.demandScore, company.baseDemand) || 0;
      const companySupply = calculateCompanySupply(
        company.supplyMax,
        company.supplyBase,
        company.supplyCurrent
      );
      const maximumConsumersWhoWillVisit = Math.min(
        companyDemand,
        companySupply
      );
      return acc + maximumConsumersWhoWillVisit;
    },
    0
  );
  const sortedCompanies = getCompanyActionOperatingRoundTurnOrder(companies);
  const sectorConsumersStatic = consumerOveride || sector.consumers;
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
  const [calculatedCompanySupply, setCalculatedCompanySupply] = useState(0);
  const [calculatedCompanyDemand, setCalculatedCompanyDemand] = useState(0);
  const currentCompany = sortedCompanies[currentCompanyIndex];

  const companyDemand =
    calculateDemand(currentCompany.demandScore, currentCompany.baseDemand) || 0;
  const companySupply = calculateCompanySupply(
    currentCompany.supplyMax,
    currentCompany.supplyBase,
    currentCompany.supplyCurrent
  );
  const maximumConsumersWhoWillVisit = Math.min(companyDemand, companySupply);
  useEffect(() => {
    setCalculatedCompanySupply(companySupply);
    setCalculatedCompanyDemand(companyDemand);
  }, [companySupply, companyDemand]);
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
    if (currentCompanyIndex === 0) {
      setSectorConsumers(consumerOveride || sector.consumers);
      setCurrentConsumersMovedAcrossAllCompaniesInSector(0);
    }
  }, [currentCompanyIndex]);

  useEffect(() => {
    if (
      moneyEarned[currentCompanyIndex] <
        maximumConsumersWhoWillVisit * currentCompany.unitPrice &&
      currentConsumersMovedAcrossAllCompaniesInSector > 0
    ) {
      setCalculatedCompanyDemand((prev) => prev - 1);
      setCalculatedCompanySupply((prev) => prev - 1);
      setMoneyEarned((prev) => {
        const newEarnings = [...prev];
        newEarnings[currentCompanyIndex] += currentCompany.unitPrice;
        return newEarnings;
      });
    }
  }, [currentConsumersMovedAcrossAllCompaniesInSector]);
  useEffect(() => {
    handleConsumerMove();
  }, [moneyEarned]);

  const list = {
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        staggerChildren: 1,
      },
    },
    hidden: {
      y: 50,
      opacity: 0,
    },
  };

  // Define the child variants
  const item = {
    visible: { y: 0, opacity: 1 },
    hidden: {
      y: 50,
      opacity: 0,
    },
  };
  return (
    <div
      className={`flex flex-col items-center space-x-4 rounded-md my-2 bg-[${
        sectorColors[sector.name]
      }]`}
    >
      {/* Sector and Consumers */}
      <div className={`flex flex-col items-center`}>
        <span>{sector.name}</span>
        <ul className="flex space-x-2">
          {Array.from({ length: sectorConsumersStatic }).map((_, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 1, y: 0 }}
              animate={
                index < totalConsumersWhoWillMoveAcrossAllCompaniesInSector && {
                  opacity: 0,
                  y: 30,
                }
              }
              transition={{ duration: 1, delay: (index + 1) * 1 }}
              className="relative"
              style={{ width: 30, height: 30 }} // Fixed size
              onAnimationComplete={() => {
                setCurrentConsumersMovedAcrossAllCompaniesInSector(
                  (prev) => prev + 1
                );
              }}
            >
              <RiTeamFill size={30} />
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Company Information */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentCompanyIndex}
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{
            duration: 1,
            delay: 1 * (maximumConsumersWhoWillVisit - 1),
          }}
          className="flex flex-col bg-slate-500 rounded-md p-2 m-1"
          style={{ width: 200, minHeight: 100 }} // Fixed width/height
        >
          <span>{currentCompany.name}</span>
          <div className="flex gap-1 items-center">
            <span className="flex items-center">
              <RiPriceTag3Fill size={20} /> ${currentCompany.unitPrice}
            </span>
          </div>
          <div className="flex gap-1 items-center">
            <RiHandCoinFill size={18} className="ml-2" />
            <span
              className={
                calculatedCompanyDemand != companyDemand
                  ? calculatedCompanyDemand == 0
                    ? "text-red-500"
                    : "text-yellow-500"
                  : ""
              }
            >
              {calculatedCompanyDemand}
            </span>
          </div>
          <div className="flex gap-1 items-center">
            <RiBox2Fill size={18} className="ml-2" />
            <span
              className={
                calculatedCompanySupply != companySupply
                  ? calculatedCompanySupply == 0
                    ? "text-red-500"
                    : "text-yellow-500"
                  : ""
              }
            >
              {calculatedCompanySupply}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <RiMoneyDollarBoxFill size={30} />
            <motion.span
              key={moneyEarned[currentCompanyIndex]}
              initial={{ scale: 1 }}
              animate={{ scale: 1.5 }}
              transition={{ duration: 1, delay: 1 }}
            >
              {moneyEarned[currentCompanyIndex]}
            </motion.span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SectorConsumerDistributionAnimation;
