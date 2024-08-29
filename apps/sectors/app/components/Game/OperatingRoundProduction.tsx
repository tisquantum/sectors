import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  CompanyTierData,
  PRETIGE_REWARD_OPERATION_COST_PERCENTAGE_REDUCTION,
  throughputRewardOrPenalty,
  ThroughputRewardType,
} from "@server/data/constants";
import CompanyInfo from "../Company/CompanyInfo";
import { CompanyStatus } from "@server/prisma/prisma.client";
import { RiFundsFill, RiIncreaseDecreaseFill } from "@remixicon/react";
import { Tooltip } from "@nextui-org/react";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";
import ThroughputLegend from "./ThroughputLegend";
import CompanyPriorityList from "../Company/CompanyPriorityOperatingRound";

const OperatingRoundProduction = () => {
  const { currentPhase } = useGame();
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
  return (
    <div className="p-6 rounded-lg shadow-md flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Operating Round Production</h1>
      <div className="flex flex-wrap gap-8">
        <div className="bg-slate-800 p-4 rounded-lg shadow-md flex gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Operations Priority</h2>
            <CompanyPriorityList companies={companiesWithSector} />
          </div>
          <div>
            <ThroughputLegend />
          </div>
        </div>
        {operatingRound.productionResults.map((productionResult) => (
          <div
            className="flex flex-col bg-slate-800 text-white p-4 rounded-lg shadow-md"
            key={productionResult.id}
          >
            <CompanyInfo
              company={productionResult.Company}
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
                className={tooltipStyle}
                content={
                  <p>
                    Revenue is calculated by multiplying the unit price times
                    units sold. The units sold is whatever is less, the
                    customers wanting product from the company or the supply of
                    the company. The amount of customers who visit the company
                    is equal to the company demand score.
                  </p>
                }
              >
                <span>Revenue: ${productionResult.revenue}</span>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatingRoundProduction;
