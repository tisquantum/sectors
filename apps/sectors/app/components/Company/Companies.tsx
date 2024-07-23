"use client";

import { Company } from "@server/prisma/prisma.client";
import CompaniesAccordion from "./CompaniesAccordion";
import {
  CompanyWithRelations,
  CompanyWithSector,
} from "@server/prisma/prisma.types";
import { trpc } from "@sectors/app/trpc";

// const Companies: React.FC<{ companies: Company[] }> = ({ companies }) => {
const Companies = ({ sectorId }: { sectorId: string }) => {
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithRelations.useQuery({
      where: { sectorId },
    });
  if (isLoading) return <div>Loading...</div>;
  if (companies == undefined) return null;
  return (
    <div>
      <CompaniesAccordion companies={companies} />
    </div>
  );
};

export default Companies;
