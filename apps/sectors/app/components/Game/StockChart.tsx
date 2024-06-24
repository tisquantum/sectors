import React, { useState } from "react";
import { Avatar, AvatarGroup, Divider } from "@nextui-org/react";
import { stockGridPrices } from "@server/data/constants";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { sectorColors } from "@server/data/gameData";

const StockChart = () => {
  const { gameId } = useGame();
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: { gameId },
    });
  if (isLoading) return <div>Loading...</div>;
  if (companies == undefined) return null;
  return (
    <>
      <div className="grid grid-cols-10 gap-3 p-4">
        {stockGridPrices.map((value, index) => {
          const companiesOnCell = companies.filter(
            (company) => company.currentStockPrice === value
          );

          return (
            <div
              key={index}
              className={`relative ring-1 bg-slate-800 p-2 text-center min-h-[81px] ${
                value === 0 ? "text-red-500 font-bold" : ""
              }`}
            >
              {value === 0 ? "INSOLVENT" : value}
              <Divider />
              {companiesOnCell.length > 0 && (
                <div className="flex flex-col mt-2">
                  {companiesOnCell.map((company) => (
                    <div
                      className="flex shadow-md rounded-md p-1"
                      style={{
                        backgroundColor: sectorColors[company.Sector.name],
                      }}
                    >
                      {company.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default StockChart;
