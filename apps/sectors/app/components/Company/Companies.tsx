"use client";

import { Company } from "@server/prisma/prisma.client";
import CompaniesAccordion from "./CompaniesAccordion";

// const Companies: React.FC<{ companies: Company[] }> = ({ companies }) => {
const Companies = ({companies}: {companies: Company[]}) => {
  return (
    <div>
        <CompaniesAccordion companies={companies} />
    </div>
  );
};

export default Companies;
