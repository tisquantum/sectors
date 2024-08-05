import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  CompanyTierData,
  throughputRewardOrPenalty,
  ThroughputRewardType,
} from "@server/data/constants";
import { companyPriorityOrderOperations } from "@server/data/helpers";
import CompanyInfo from "../Company/CompanyInfo";
import { CompanyStatus } from "@server/prisma/prisma.client";
import { RiIncreaseDecreaseFill } from "@remixicon/react";
import { Tooltip } from "@nextui-org/react";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";

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
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Operating Round Production</h1>
      <div className="flex gap-8">
        <div className="bg-slate-800 p-4 rounded-lg shadow-md flex gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Operations Priority</h2>
            {companyPriorityOrderOperations(companiesWithSector).map(
              (company, index) => (
                <div key={company.id} className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{company.name}</span>
                </div>
              )
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Throughput Legend</h2>
            {
              //iterate from 0 to 7 in for each
              Array.from(Array(8).keys()).map((throughput) => {
                const throughputReward = throughputRewardOrPenalty(throughput);
                return (
                  <div
                    key={throughput}
                    className="flex items-center gap-2 mb-1"
                  >
                    <span className="font-medium flex items-center gap-1">
                      <RiIncreaseDecreaseFill size={18} /> {throughput}:
                    </span>
                    <span>
                      {throughputReward.type ===
                      ThroughputRewardType.SECTOR_REWARD
                        ? "Sector Reward"
                        : `Share Steps ${
                            throughputReward.share_price_steps_down == 0
                              ? "0"
                              : "-" + throughputReward.share_price_steps_down
                          }`}
                    </span>
                  </div>
                );
              })
            }
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
                <span>Share Steps: +1</span>
              ) : (
                <span>
                  Share Steps:{" "}
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
                    is equal to the sector demand plus the company demand.
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
