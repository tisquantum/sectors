import React, { useMemo } from 'react';
import { CompanyWithSector } from '@server/prisma/prisma.types';
import { companyPriorityOrderOperations } from '@server/data/helpers';

const CompanyPriorityList = ({ companies }: { companies: CompanyWithSector[] }) => {
  const sortedCompanies = useMemo(() => companyPriorityOrderOperations(companies), [companies]);

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-4">Company Priority List</h2>
      <table className="min-w-full border-collapse border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Rank</th>
            <th className="py-2 px-4 border">Company Name</th>
            <th className="py-2 px-4 border">Sector</th>
            <th className="py-2 px-4 border">Unit Price</th>
            <th className="py-2 px-4 border">Prestige Tokens</th>
            <th className="py-2 px-4 border">Demand Score</th>
            <th className="py-2 px-4 border">Base Demand</th>
            <th className="py-2 px-4 border">Has Economies of Scale</th>
          </tr>
        </thead>
        <tbody>
          {sortedCompanies.map((company: CompanyWithSector, index) => (
            <tr key={company.id} className="p-4 border rounded shadow">
              <td className="py-2 px-4 border">{index + 1}</td>
              <td className="py-2 px-4 border">{company.name}</td>
              <td className="py-2 px-4 border">{company.Sector.name}</td>
              <td className="py-2 px-4 border">${company.unitPrice.toFixed(2)}</td>
              <td className="py-2 px-4 border">{company.prestigeTokens}</td>
              <td className="py-2 px-4 border">{company.demandScore}</td>
              <td className="py-2 px-4 border">{company.baseDemand}</td>
              <td className="py-2 px-4 border">{company.hasEconomiesOfScale ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 p-4 border-t">
        <h4 className="text-xl font-semibold mb-2">Priority Sorting Explanation:</h4>
        <ul className="list-disc list-inside">
          <li>0: If a company has Economies of Scale, it is considered to be the cheapest company regardless of its unit price.</li>
          <li>1: Companies are sorted by prestige tokens in descending order.</li>
          <li>2: Companies are sorted by unit price in ascending order (cheapest first).</li>
          <li>3: Companies are sorted by demand score in descending order.</li>
        </ul>
      </div>
    </div>
  );
};

export default CompanyPriorityList;
