"use client";

import React from "react";
import Companies from "../Company/Companies";
import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
} from "@nextui-org/react";
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
import SectorInfo from "./SectorInfo";

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
          subtitle={<SectorInfo sector={sector} />}
        >
          <Companies sectorId={sector.id} />
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default SectorComponent;
