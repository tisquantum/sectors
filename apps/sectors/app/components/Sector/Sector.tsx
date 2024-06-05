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
const SectorComponent = ({ sectors, companies }: any) => {
  const sectorsWithCompanies = sectors.map((sector: any) => {
    const sectorCompanies = companies.filter(
      (company: any) => company.sectorId === sector.id
    );
    return {
      ...sector,
      companies: sectorCompanies,
    };
  });
  return (
    <Accordion selectionMode="multiple">
      {sectorsWithCompanies.map((sector: any) => (
        <AccordionItem
          key={sector.id}
          startContent={<Avatar name={sector.name} size="md" />}
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
          <Companies companies={sector.companies} />
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default SectorComponent;
