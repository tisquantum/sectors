"use client";

import React from "react";
import Companies from "../Company/Companies";
import { Accordion, AccordionItem, Avatar, Tooltip } from "@nextui-org/react";
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
} from "@remixicon/react";
import { useGame } from "../Game/GameContext";
import { trpc } from "@sectors/app/trpc";
import { sectorColors } from "@server/data/gameData";
import { SectorWithCompanies } from "@server/prisma/prisma.types";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";

const SectorComponent = () => {
  const { gameId } = useGame();
  const { data: sectorsWithCompanies, isLoading } =
    trpc.sector.listSectorsWithCompanies.useQuery({
      where: { gameId },
    });
  if (isLoading) return <div>Loading...</div>;
  if (sectorsWithCompanies == undefined) return null;
  const getSectorColor = (sectorName: string) => {
    return sectorColors[sectorName];
  };
  return (
    <Accordion selectionMode="multiple">
      {sectorsWithCompanies.map((sector: SectorWithCompanies) => (
        <AccordionItem
          key={sector.id}
          startContent={
            <Avatar
              className={`text-stone-200 font-extrabold`}
              style={{ backgroundColor: getSectorColor(sector.name) }}
              name={String(sector.name).toUpperCase()}
              size="lg"
            />
          }
          title={sector.name}
          subtitle={
            <div className="flex flex-col">
              <div className="flex items-center">
                <Tooltip
                  className={tooltipStyle}
                  content={
                    <p>
                      The base demand for this sector. Determines how many many
                      customers will be 'spooled' to sector during economy
                      phase. Also used in conjunction with company demand when
                      calculating goods sold.
                    </p>
                  }
                >
                  <div className="ml-2 text-small text-default-500 flex">
                    <RiHandCoinFill size={18} className="mr-1" />{" "}
                    {sector.demand + (sector.demandBonus || 0)}
                  </div>
                </Tooltip>
                <Tooltip
                  className={tooltipStyle}
                  content={
                    <p>
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
                  className={tooltipStyle}
                  content={
                    <p>
                      The consumers waiting to buy product from this sector.
                    </p>
                  }
                >
                  <div className="ml-2 text-small text-default-500 flex">
                    <RiTeamFill size={18} className="mr-1" /> {sector.consumers}
                  </div>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip
                  className={tooltipStyle}
                  content={
                    <p>
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
                  className={tooltipStyle}
                  content={
                    <p>
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
