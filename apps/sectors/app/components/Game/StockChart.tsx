import React, { useEffect, useState } from "react";
import { Avatar, AvatarGroup, Divider } from "@nextui-org/react";
import { stockGridPrices } from "@server/data/constants";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { sectorColors } from "@server/data/gameData";
import { CompanyWithSectorAndStockHistory } from "@server/prisma/prisma.types";
import { LineChart } from "@tremor/react";
import { PhaseName } from "@server/prisma/prisma.client";

interface ChartData {
  phaseId: string;
  stockPrice: number;
}

const StockChart = () => {
  const { gameId } = useGame();
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithSectorAndStockHistory.useQuery({
      where: { gameId },
    });
  const [selectedCompany, setSelectedCompany] = useState<
    CompanyWithSectorAndStockHistory | undefined
  >(undefined);
  const [chartData, setChartData] = useState<ChartData[] | null>(null);
  useEffect(() => {
    if (selectedCompany) {
      const data = selectedCompany.StockHistory.map((stockHistory) => ({
        phaseId: stockHistory.phaseId,
        stockPrice: stockHistory.price,
      }));
      setChartData(data);
    }
  }, [selectedCompany]);
  if (isLoading) return <div>Loading...</div>;
  if (companies == undefined) return null;
  const handleCompanySelect: React.MouseEventHandler<HTMLDivElement> = (
    event
  ) => {
    console.log("Company selected", event.currentTarget.textContent);
    setSelectedCompany(
      companies.find(
        (company) => company.name === event.currentTarget.textContent
      )
    );
  };
  console.log("selectedCompany", selectedCompany);
  console.log("chartData", chartData);

  const valueFormatter = function (number: number) {
    return "$ " + new Intl.NumberFormat("us").format(number).toString();
  };

  return (
    <div className="flex flex-col">
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
                      className="flex shadow-md rounded-md p-1 cursor-pointer"
                      style={{
                        backgroundColor: sectorColors[company.Sector.name],
                      }}
                      onClick={handleCompanySelect}
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
      {selectedCompany && chartData && (
        <LineChart
          data={chartData}
          index="phase"
          categories={["stockPrice"]}
          yAxisLabel="Stock Price"
          xAxisLabel="Stock Price Updated"
          valueFormatter={valueFormatter}
        />
      )}
    </div>
  );
};

export default StockChart;
