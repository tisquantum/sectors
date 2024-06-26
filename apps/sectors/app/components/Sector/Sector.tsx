"use client";

import React from "react";
import Companies from "../Company/Companies";
import { Accordion, AccordionItem, Avatar } from "@nextui-org/react";
import {
  ArrowUturnUpIcon,
  ArrowsRightLeftIcon,
  RocketLaunchIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { useGame } from "../Game/GameContext";
import { trpc } from "@sectors/app/trpc";
import { sectorColors } from "@server/data/gameData";
import { SectorWithCompanies } from "@server/prisma/prisma.types";

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
            <div className="flex items-center">
              <p className="text-small text-default-500 flex">
                <ArrowUturnUpIcon className="size-4 mr-1" /> {sector.supply}
              </p>
              <p className="ml-2 text-small text-default-500 flex">
                <ArrowsRightLeftIcon className="size-4 mr-1" /> {sector.demand}
              </p>
              <p className="ml-2 text-small text-default-500 flex">
                <RocketLaunchIcon className="size-4 mr-1" /> $50
              </p>
              <p className="ml-2 text-small text-default-500 flex">
                <StarIcon className="size-4 mr-1" /> +3
              </p>
            </div>
          }
        >
          <Companies companies={sector.Company} />
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default SectorComponent;
