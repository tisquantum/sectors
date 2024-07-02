"use client";

import { Company } from "@server/prisma/prisma.client";
import CompaniesAccordion from "./CompaniesAccordion";
import { CompanyWithSector } from "@server/prisma/prisma.types";

// const Companies: React.FC<{ companies: Company[] }> = ({ companies }) => {
const Companies = ({companies}: {companies: CompanyWithSector[]}) => {
  return (
    <div>
        <CompaniesAccordion companies={companies} />
    </div>
  );
};

export default Companies;
