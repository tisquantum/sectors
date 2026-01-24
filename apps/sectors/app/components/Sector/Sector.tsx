"use client";

import React from "react";
import Companies from "../Company/Companies";
import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Tooltip,
} from "@nextui-org/react";
import {
  ArrowUturnUpIcon,
  ArrowsRightLeftIcon,
  RocketLaunchIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import {
  RiHandCoinFill,
  RiAdvertisementFill,
  RiSailboatFill,
  RiTeamFill,
  RiMoneyDollarCircleFill,
  RiFundsFill,
  RiTimeLine,
} from "@remixicon/react";
import { useGame } from "../Game/GameContext";
import { trpc } from "@sectors/app/trpc";
import { sectorColors } from "@server/data/gameData";
import { SectorWithCompanies } from "@server/prisma/prisma.types";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { calculateAverageStockPrice } from "@server/data/helpers";

// Helper function to calculate research stage from researchMarker
const getResearchStage = (researchMarker: number): number => {
  if (researchMarker >= 10) return 4;
  if (researchMarker >= 7) return 3;
  if (researchMarker >= 4) return 2;
  return 1;
};

// Helper function to get waiting area capacity based on research stage
const getWaitingAreaCapacity = (researchStage: number): number => {
  switch (researchStage) {
    case 1: return 3;
    case 2: return 5;
    case 3: return 7;
    case 4: return 10;
    default: return 3;
  }
};

const SectorComponent = () => {
  const { gameId, gameState } = useGame();
  const { data: sectorsWithCompanies, isLoading } =
    trpc.sector.listSectorsWithCompanies.useQuery(
      {
        where: { gameId },
      },
      {
        // Prevent excessive refetching
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 30000, // 30 seconds
      }
    );
  if (isLoading) return <div>Loading...</div>;
  if (sectorsWithCompanies == undefined) return null;
  const getSectorColor = (sectorName: string) => {
    return sectorColors[sectorName];
  };
  return (
    <Accordion selectionMode="multiple" className="p-0 w-full">
      {sectorsWithCompanies.map((sector: SectorWithCompanies) => (
        <AccordionItem
          key={sector.id}
          startContent={
            <Badge
              content={
                gameState.sectorPriority.find((p) => p.sectorId === sector.id)
                  ?.priority
              }
            >
              <Avatar
                className={`text-stone-200 font-extrabold`}
                style={{ backgroundColor: getSectorColor(sector.name) }}
                name={String(sector.name).toUpperCase()}
                size="lg"
              />
            </Badge>
          }
          title={sector.name}
          subtitle={
            <div className="flex flex-col">
              <div className="flex items-center">
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p className={tooltipParagraphStyle}>
                      Sector demand is based on research bonuses. Consumer distribution and worker salaries are determined by sector demand rankings (1st: 50% economy score, 2nd: 30%, 3rd: 20%).
                    </p>
                  }
                >
                  <div className="ml-2 text-small text-default-500 flex">
                    <RiHandCoinFill size={18} className="mr-1" />{" "}
                    {sector.demand + (sector.demandBonus || 0)}
                  </div>
                </Tooltip>
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p className={tooltipParagraphStyle}>
                      Share percentage required to float companies in this
                      sector.
                    </p>
                  }
                >
                  <div className="ml-2 text-small text-default-500 flex">
                    <RiSailboatFill size={18} className="ml-2" />
                    <span className="ml-1">
                      {sector.sharePercentageToFloat}%
                    </span>
                  </div>
                </Tooltip>
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p className={tooltipParagraphStyle}>
                      The consumers waiting to buy product from this sector.
                    </p>
                  }
                >
                  <div className="ml-2 text-small text-default-500 flex">
                    <RiTeamFill size={18} className="mr-1" /> {sector.consumers}
                  </div>
                </Tooltip>
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <div className={tooltipParagraphStyle}>
                      <p className="mb-2">
                        <strong>Waiting Area:</strong> Consumers who couldn't be served by factories are placed here.
                      </p>
                      <p className="mb-2">
                        <strong>Capacity:</strong> Based on research stage (Stage 1: 3, Stage 2: 5, Stage 3: 7, Stage 4: 10)
                      </p>
                      <p className="mb-2">
                        <strong>If capacity not exceeded:</strong> Consumers stay and their markers return to the draw bag for next turn.
                      </p>
                      <p>
                        <strong>If capacity exceeded:</strong> All waiting consumers return to global pool and sector loses 1 demand permanently.
                      </p>
                    </div>
                  }
                >
                  <div className="ml-2 text-small text-default-500 flex">
                    <RiTimeLine size={18} className="mr-1" />{" "}
                    {sector.waitingArea || 0}/
                    {getWaitingAreaCapacity(getResearchStage(sector.researchMarker || 0))}
                  </div>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p className={tooltipParagraphStyle}>
                      Minimum|Maximum starting unit price for a company created
                      in this sector.
                    </p>
                  }
                >
                  <div className="text-small text-default-500 flex">
                    <span>UNIT &nbsp;</span>
                    <div className="text-small text-default-500 flex">
                      {sector.unitPriceMin}
                    </div>
                    |
                    <div className="text-small text-default-500 flex">
                      {sector.unitPriceMax}
                    </div>
                  </div>
                </Tooltip>
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p className={tooltipParagraphStyle}>
                      Minimum|Maximum starting ipo price for a company created
                      in this sector.
                    </p>
                  }
                >
                  <div className="text-small text-default-500 flex">
                    <span>IPO &nbsp;</span>
                    <div className="text-small text-default-500 flex">
                      {sector.ipoMin}
                    </div>
                    |
                    <div className="text-small text-default-500 flex">
                      {sector.ipoMax}
                    </div>
                  </div>
                </Tooltip>
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p className={tooltipParagraphStyle}>
                      Average stock price across all ACTIVE and INSOLVENT
                      companies in the sector.
                    </p>
                  }
                >
                  <div className="text-small text-default-500 flex">
                    <RiFundsFill size={18} className="mr-1" />
                    {calculateAverageStockPrice(sector.Company)}
                  </div>
                </Tooltip>
              </div>
            </div>
          }
        >
          <Companies sectorId={sector.id} />
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default SectorComponent;
