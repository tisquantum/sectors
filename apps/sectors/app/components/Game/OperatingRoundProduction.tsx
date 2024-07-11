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
        <div className="bg-slate-800 p-4 rounded-lg shadow-md w-1/4">
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
        <div className="grid grid-cols-3 gap-6 w-3/4">
          {operatingRound.productionResults.map((productionResult) => (
            <div
              className="flex flex-col bg-slate-800 text-white p-4 rounded-lg shadow-md"
              key={productionResult.id}
            >
              <CompanyInfo company={productionResult.Company} />
              <div className="flex flex-col m-2 rounded-md bg-gray-950 p-2">
                <span className="text-lg">Production Results</span>
                {throughputRewardOrPenalty(productionResult.throughputResult)
                  .type === ThroughputRewardType.SECTOR_REWARD ? (
                  <span className="mt-2">Prestige: +1</span>
                ) : (
                  <span className="mt-2">
                    Share Steps: -{productionResult.steps}
                  </span>
                )}
                <span>Revenue: ${productionResult.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperatingRoundProduction;
