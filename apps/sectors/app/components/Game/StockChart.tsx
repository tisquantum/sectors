import React, { useEffect, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tab,
  Tabs,
  useDisclosure,
} from "@nextui-org/react";
import {
  CompanyTierData,
  stockGridPrices,
  StockTierChartRange,
  stockTierChartRanges,
} from "@server/data/constants";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { sectorColors, sectorColorVariants } from "@server/data/gameData";
import { CompanyWithSectorAndStockHistory } from "@server/prisma/prisma.types";
import { LineChart } from "@tremor/react";
import {
  Company,
  CompanyStatus,
  PhaseName,
  StockTier,
} from "@server/prisma/prisma.client";
import {
  RiBox2Fill,
  RiCheckboxBlankCircleFill,
  RiCheckboxCircleFill,
  RiExpandUpDownFill,
  RiFundsFill,
  RiHandCoinFill,
  RiIncreaseDecreaseFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiSparkling2Fill,
  RiStarFill,
  RiSwap3Fill,
} from "@remixicon/react";
import "./StockChart.css";
import CompanyInfo from "../Company/CompanyInfo";

interface ChartData {
  phaseId: string;
  stockPrice: number;
}

interface AllChartData {
  [companyName: string]: number | string | undefined;
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
      <div className="flex items-center space-x-2">
        <RiFundsFill />
        <h3 className="text-lg"> Stock Chart Legend</h3>
      </div>
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
        Shareholders must buy these amount of shares from the OPEN MARKET before
        they can advance one step on the stock chart. A sell always moves the
        stock one step down.
      </p>
      <p>
        Operations revenue distributed to shareholders will also increase the
        stock price by a given number of steps. Should these steps push the
        price into a new tier, that stock price movement is halted.
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

  return <div className="flex flex-wrap items-center space-x-1">{circles}</div>;
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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  useEffect(() => {
    if (selectedCompany) {
      const stockHistory = selectedCompany.StockHistory;
      const data = stockHistory
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((stockHistory, index) => ({
          phaseId: `${index + 1} ${stockHistory.Phase.name}`,
          stockPrice: stockHistory.price,
          stockAction: stockHistory.action,
          steps: stockHistory.stepsMoved,
        }));
      setChartData(data);
    }
  }, [selectedCompany]);

  if (isLoading) return <div>Loading...</div>;
  if (companies == undefined) return null;

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompany(companies.find((company) => company.id === companyId));
    onOpen();
  };

  const valueFormatter = function (number: number) {
    return "$ " + new Intl.NumberFormat("us").format(number).toString();
  };
  const companyColorsMap = companies.reduce((acc, company, index) => {
    const sector = company.Sector.name;
    const colorVariantIndex = index % 10; // Cycle through the 10 color variants
    const colorVariant = sectorColorVariants[sector][colorVariantIndex];

    return {
      ...acc,
      [company.id]: colorVariant,
    };
  }, {});

  const colorsArray: string[] = Object.values(companyColorsMap) || [];
  const groupedData =
    companies
      ?.flatMap((company) => {
        return company.StockHistory.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        ) // Sort by createdAt
          .map((stockHistory, index) => ({
            indexer: `${index + 1} ${stockHistory.Phase.name}`,
            phaseId: stockHistory.phaseId, // Generate consistent phaseId
            phaseName: stockHistory.Phase.name,
            companyName: company.name,
            stockPrice: stockHistory.price,
            createdAt: stockHistory.createdAt, // Ensure createdAt is included for consistency
          }));
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) ?? []; // Final sort to ensure order across companies

  interface PhaseEntry {
    indexer: string;
    phaseId: string;
    phaseName: string;
    [key: string]: string | number; // Allows dynamic company names as keys with stock prices as values
  }

  interface LastKnownPrices {
    [phaseId: string]: {
      [companyName: string]: number; // Company names as keys with last known stock prices as values
    };
  }

  const allChartData: PhaseEntry[] = [];
  const lastKnownPrices: LastKnownPrices = {}; // Keeps track of the last known price for each company
  // Process groupedData into allChartData
  groupedData.forEach(
    ({ indexer, phaseId, phaseName, companyName, stockPrice }) => {
      let phaseEntry = allChartData.find(
        (entry) => entry.phaseId === phaseId && entry.phaseName === phaseName
      );
      if (!phaseEntry) {
        phaseEntry = { indexer, phaseId, phaseName };
        allChartData.push({
          indexer,
          phaseId,
          phaseName,
          [companyName]: stockPrice,
        });
      }

      phaseEntry[companyName] = stockPrice;
      // Initialize lastKnownPrices for the phaseId if it doesn't exist
      if (!lastKnownPrices[phaseId]) {
        lastKnownPrices[phaseId] = {};
      }
      // Update the last known price for the company at the current phase
      lastKnownPrices[phaseId][companyName] = stockPrice;
    }
  );
  // Ensure every phase entry contains the price for every company
  const companyNames = companies.map((company) => company.name);
  allChartData.forEach((entry) => {
    companyNames.forEach((companyName) => {
      if (!(companyName in entry)) {
        //get the last phase with a known price for this company by iterating over
        //all chart data phases in reverse order from the current phase
        let lastKnownPrice = null;
        for (let i = allChartData.indexOf(entry) - 1; i >= 0; i--) {
          if (companyName in allChartData[i]) {
            if (
              lastKnownPrices[allChartData[i].phaseId][companyName] &&
              lastKnownPrices[allChartData[i].phaseId][companyName] !== null
            ) {
              lastKnownPrice =
                lastKnownPrices[allChartData[i].phaseId][companyName];
              break;
            }
          }
        }
        entry[companyName] = lastKnownPrice || 0;
      }
    });
  });
  return (
    <div className="flex flex-col">
      <Tabs>
        <Tab key="stock-grid" title="Stock Grid">
          <>
            <Legend />
            <div className="grid grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10 gap-3 p-4">
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
                    {value === 0 ? "BANKRUPT" : value}
                    <Divider />
                    {companiesOnCell.length > 0 && (
                      <div className="flex flex-col mt-2 gap-2">
                        {companiesOnCell.map((company) => (
                          <div
                            key={company.id}
                            className={`relative flex flex-col items-center shadow-md rounded-md p-1 cursor-pointer border-2 border-slate-700 ${
                              company.status === CompanyStatus.INACTIVE
                                ? "red-stripes"
                                : ""
                            }`}
                            style={{
                              backgroundColor:
                                sectorColors[company.Sector.name],
                              opacity:
                                company.status === CompanyStatus.BANKRUPT
                                  ? 0.7
                                  : 1, // Reduce opacity if BANKRUPT
                            }}
                            onClick={() => handleCompanySelect(company.id)}
                          >
                            {company.status === CompanyStatus.INACTIVE ? (
                              <div className="ml-2 p-1 rounded-md text-small text-slate-800 flex bg-yellow-500">
                                <RiSailboatFill
                                  size={18}
                                  className="ml-2 text-slate-800"
                                />
                                <span className="ml-1">
                                  %{company.Sector.sharePercentageToFloat}
                                </span>
                              </div>
                            ) : (
                              <div className="ml-2 p-1 rounded-md text-small text-green-800 flex bg-green-500">
                                <RiSailboatFill size={18} className="ml-2" />
                                <span className="ml-1">
                                  %{company.Sector.sharePercentageToFloat}
                                </span>
                              </div>
                            )}
                            <span className="subpixel-antialiased text-slate-100">
                              {company.name}
                            </span>
                            <TierSharesFulfilled
                              tierSharesFulfilled={company.tierSharesFulfilled}
                              tier={tier}
                            />

                            {company.status === CompanyStatus.BANKRUPT && (
                              <div className="absolute inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center rounded-md">
                                <div className="flex flex-col">
                                  <span
                                    className="text-black text-sm font-bold transform rotate-40"
                                    style={{
                                      display: "inline-block",
                                      color: "black", // Adjust the color if needed to match a stamped look
                                      border: "2px solid black", // Optional: add a border to enhance the stamped effect
                                      padding: "2px 6px", // Optional: add padding to create some space around the text
                                      transform: "rotate(40deg)", // Rotate the text 45 degrees clockwise
                                    }}
                                  >
                                    BANKRUPT
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        </Tab>
        <Tab key="stock-chart" title="Stock Chart" className="w-full">
          <div className="flex w-full flex-col justify-center items-center h-[800px]">
            <LineChart
              className="h-full"
              data={allChartData}
              index="indexer"
              categories={companies.map((company) => company.name)}
              yAxisLabel="Stock Price"
              xAxisLabel="Stock Price Updated"
              colors={colorsArray}
              valueFormatter={valueFormatter}
            />
          </div>
        </Tab>
      </Tabs>
      {selectedCompany && chartData && (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <div className="flex flex-col">
                    <CompanyInfo companyId={selectedCompany.id} />
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col justify-center items-center">
                    <LineChart
                      data={chartData}
                      index="phaseId"
                      categories={["stockPrice"]}
                      yAxisLabel="Stock Price"
                      xAxisLabel="Stock Price Updated"
                      colors={[sectorColors[selectedCompany.Sector.name]]}
                      valueFormatter={valueFormatter}
                    />
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default StockChart;
