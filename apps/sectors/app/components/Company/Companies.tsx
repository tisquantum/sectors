"use client";

import CompaniesAccordion from "./CompaniesAccordion";

// const Companies: React.FC<{ companies: Company[] }> = ({ companies }) => {
const Companies = ({companies}: any) => {
  return (
    <div>
        <CompaniesAccordion companies={companies} />
    </div>
  );
};

export default Companies;
