import React, { useEffect, useState } from "react";
import { Avatar, AvatarGroup, Divider } from "@nextui-org/react";
import {
  stockGridPrices,
  StockTierChartRange,
  stockTierChartRanges,
} from "@server/data/constants";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { sectorColors } from "@server/data/gameData";
import { CompanyWithSectorAndStockHistory } from "@server/prisma/prisma.types";
import { LineChart } from "@tremor/react";
import { Company, PhaseName, StockTier } from "@server/prisma/prisma.client";
import {
  RiCheckboxBlankCircleFill,
  RiCheckboxCircleFill,
} from "@remixicon/react";
interface ChartData {
  phaseId: string;
  stockPrice: number;
}

const tierColors: { [key in StockTier]: string } = {
  [StockTier.TIER_1]: "bg-blue-800",
  [StockTier.TIER_2]: "bg-violet-800",
  [StockTier.TIER_3]: "bg-yellow-800",
  [StockTier.TIER_4]: "bg-orange-800",
  [StockTier.TIER_5]: "bg-red-800",
};

const getTierForStockPrice = (
  price: number
): StockTierChartRange | undefined => {
  return stockTierChartRanges.find(
    (range) => price >= range.chartMinValue && price <= range.chartMaxValue
  );
};

const friendlyTierName = (tier: StockTier) => {
  return tier.replace("TIER_", "");
};

const Legend = () => {
  return (
    <div className="flex flex-col">
      <h3 className="text-lg">Stock Chart Legend</h3>
      <div className="flex space-x-4 p-4">
        {stockTierChartRanges.map((range) => (
          <div key={range.tier} className="flex items-center space-x-2">
            <div className={`w-4 h-4 ${tierColors[range.tier]}`} />
            <span>
              Tier {friendlyTierName(range.tier)}: {range.fillSize} shares
            </span>
          </div>
        ))}
      </div>
      <p>
        Stocks must sell this amount of shares before they can advance one step
        on the stock chart. A sell always moves the stock one step down.
      </p>
    </div>
  );
};

const TierSharesFulfilled = ({
  tierSharesFulfilled,
  tier,
}: {
  tierSharesFulfilled: number;
  tier: StockTier | undefined;
}) => {
  if (tier == undefined) return null;
  const tierRange = stockTierChartRanges.find((range) => range.tier === tier);
  if (tierRange == undefined) return null;

  const circles = [];
  for (let i = 0; i < tierRange.fillSize; i++) {
    if (i < tierSharesFulfilled) {
      circles.push(<RiCheckboxCircleFill key={i} className="text-green-500" />);
    } else {
      circles.push(
        <RiCheckboxBlankCircleFill key={i} className="text-gray-500" />
      );
    }
  }

  return <div className="flex items-center space-x-1">{circles}</div>;
};

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
      <Legend />
      <div className="grid grid-cols-10 gap-3 p-4">
        {stockGridPrices.map((value, index) => {
          const companiesOnCell = companies.filter(
            (company) => company.currentStockPrice === value
          );
          const tier = getTierForStockPrice(value)?.tier;
          const backgroundColor = tier ? tierColors[tier] : "";

          return (
            <div
              key={index}
              className={`relative ring-1 p-2 text-center min-h-[81px] ${backgroundColor} ${
                value === 0 ? "text-red-500 font-bold" : ""
              }`}
            >
              {value === 0 ? "INSOLVENT" : value}
              <Divider />
              {companiesOnCell.length > 0 && (
                <div className="flex flex-col mt-2 gap-2">
                  {companiesOnCell.map((company) => (
                    <div
                      key={company.id}
                      className="flex flex-col items-center shadow-md rounded-md p-1 cursor-pointer border-2 border-slate-700"
                      style={{
                        backgroundColor: sectorColors[company.Sector.name],
                      }}
                      onClick={handleCompanySelect}
                    >
                      <span className="subpixel-antialiased text-slate-100">
                        {company.name}
                      </span>
                      <TierSharesFulfilled
                        tierSharesFulfilled={company.tierSharesFulfilled}
                        tier={tier}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedCompany && chartData && (
        <div className="flex flex-col justify-center items-center">
          <h3>{selectedCompany.name}</h3>
          <LineChart
            data={chartData}
            index="phase"
            categories={["stockPrice"]}
            yAxisLabel="Stock Price"
            xAxisLabel="Stock Price Updated"
            colors={[sectorColors[selectedCompany.Sector.name]]}
            valueFormatter={valueFormatter}
          />
        </div>
      )}
    </div>
  );
};

export default StockChart;
