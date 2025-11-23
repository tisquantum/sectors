import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  CompanyTierData,
  PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION,
  sectorPriority,
  throughputRewardOrPenalty,
  ThroughputRewardType,
} from "@server/data/constants";
import CompanyInfo from "../Company/CompanyInfo";
import { CompanyStatus, SectorName } from "@server/prisma/prisma.client";
import { RiFundsFill, RiIncreaseDecreaseFill } from "@remixicon/react";
import { Tooltip } from "@nextui-org/react";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import ThroughputLegend from "./ThroughputLegend";
import CompanyPriorityList from "../Company/CompanyPriorityOperatingRound";
import SectorConsumerDistributionAnimation from "./SectorConsumerDistributionAnimation";
import { CompanyWithSector } from "@server/prisma/prisma.types";

const OperatingRoundProduction = () => {
  const { currentPhase, gameState } = useGame();
  const { data: operatingRound, isLoading } =
    trpc.operatingRound.getOperatingRoundWithProductionResults.useQuery({
      where: {
        id: currentPhase?.operatingRoundId,
      },
    });
  const { data: companiesWithSector, isLoading: isLoadingCompanies } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: {
        gameId: currentPhase?.gameId,
        status: CompanyStatus.ACTIVE,
      },
    });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!operatingRound) {
    return <div>No operating round found</div>;
  }
  if (isLoadingCompanies) {
    return <div>Loading companies...</div>;
  }
  if (!companiesWithSector) {
    return <div>No companies found</div>;
  }
  //organize companies by sector
  const companiesOrganizedBySector = companiesWithSector.reduce(
    (acc, company: CompanyWithSector) => {
      const sectorName = company.Sector.sectorName;
      if (!acc[sectorName]) {
        acc[sectorName] = [];
      }
      acc[sectorName].push(company);
      return acc;
    },
    {} as Record<SectorName, CompanyWithSector[]>
  );
  //organize sectors by priority order
  const sectorNames = Object.keys(companiesOrganizedBySector).sort(
    (a, b) =>
      sectorPriority.indexOf(a as SectorName) -
      sectorPriority.indexOf(b as SectorName)
  ) as SectorName[];
  return (
    <div className="p-6 rounded-lg shadow-md flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Operating Round Production</h1>
      <div className="flex flex-col gap-1">
        {sectorNames.map((sectorName: SectorName) => {
          const consumersMoved = operatingRound.productionResults
            .filter(
              (productionResult) =>
                productionResult.Company.sectorId ===
                companiesOrganizedBySector[sectorName][0].Sector.id
            )
            .reduce(
              (acc, productionResult) => acc + productionResult.consumers,
              0
            );
          const currentSectorConsumers =
            companiesOrganizedBySector[sectorName][0].Sector.consumers;
          return (
            <SectorConsumerDistributionAnimation
              key={sectorName}
              sector={companiesOrganizedBySector[sectorName][0].Sector}
              companies={companiesOrganizedBySector[sectorName]}
              consumerOveride={currentSectorConsumers + consumersMoved}
            />
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-4">
          {operatingRound.productionResults.map((productionResult) => (
            <div
              className="flex flex-col bg-slate-800 text-white p-4 rounded-lg shadow-md"
              key={productionResult.id}
            >
              <CompanyInfo
                companyId={productionResult.Company.id}
                showingProductionResults
              />
              <div className="flex flex-col m-2 rounded-md bg-gray-950 p-2">
                <span className="text-lg">Production Results</span>
                <span className="flex gap-1 items-center">
                  <RiIncreaseDecreaseFill size={18} />{" "}
                  {productionResult.throughputResult}
                </span>
                {throughputRewardOrPenalty(productionResult.throughputResult)
                  .type === ThroughputRewardType.SECTOR_REWARD ? (
                  <span>
                    %{PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION}{" "}
                    Operation Cost Reduction
                  </span>
                ) : (
                  <span className="flex gap-1">
                    <RiFundsFill />
                    {productionResult.steps == 0
                      ? "0"
                      : `-${productionResult.steps}`}
                  </span>
                )}
                <Tooltip
                  classNames={{ base: baseToolTipStyle }}
                  className={tooltipStyle}
                  content={
                    <p>
                      Revenue is calculated by multiplying the unit price times
                      units sold. The units sold is whatever is less, the
                      company demand or the company supply. The maximum amount
                      of customers who will visit a company before moving to the
                      next company in priority order is equal to the company
                      demand score.
                    </p>
                  }
                >
                  <span>Revenue: ${productionResult.revenue}</span>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-800 p-4 rounded-lg shadow-md flex flex-col gap-4 overflow-auto scrollbar">
          <div>
            <h2 className="text-lg font-semibold mb-2">Operations Priority</h2>
            <CompanyPriorityList companies={companiesWithSector} />
          </div>
          <div className="bg-slate-800">
            <ThroughputLegend />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatingRoundProduction;
