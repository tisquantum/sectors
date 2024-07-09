import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  CompanyTierData,
  throughputRewardOrPenalty,
  ThroughputRewardType,
} from "@server/data/constants";

const OperatingRoundProduction = () => {
  const { currentPhase } = useGame();
  console.log("currentPhase", currentPhase);
  const { data: operatingRound, isLoading } =
    trpc.operatingRound.getOperatingRoundWithProductionResults.useQuery({
      where: {
        id: currentPhase?.operatingRoundId,
      },
    });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!operatingRound) {
    return <div>No operating round found</div>;
  }
  return (
    <div>
      <h1>Operating Round Production</h1>
      <div className="grid grid-cols-3 gap-4">
        {operatingRound.productionResults.map((productionResult) => (
          <div
            className="flex flex-col bg-slate-800 p-4"
            key={productionResult.id}
          >
            <h2 className="text-xl">{productionResult.Company.name}</h2>
            <span className="text-lg">
              {productionResult.Company.Sector.name}
            </span>
            <span className="text-lg">
              Operating Costs $
              {
                CompanyTierData[productionResult.Company.companyTier]
                  .operatingCosts
              }
            </span>
            <div className="flex gap-3">
              <span>Supply: {productionResult.Company.supplyMax}</span>
              <span>
                Demand:{" "}
                {productionResult.Company.demandScore +
                  productionResult.Company.Sector.demand}
              </span>
              <span>Throughput: {productionResult.throughputResult}</span>
              {throughputRewardOrPenalty(productionResult.throughputResult)
                .type == ThroughputRewardType.SECTOR_REWARD ? (
                <span>Prestige: +1</span>
              ) : (
                <span>Share Steps: -{productionResult.steps}</span>
              )}
              <div className="flex flex-col">
                <span>Revenue: {productionResult.revenue}</span>
                <span>
                  Unit Price ${productionResult.Company.unitPrice} * Company
                  Supply: {productionResult.Company.supplyMax} OR (Company
                  Demand: {productionResult.Company.demandScore} + Sector
                  Demand: {productionResult.Company.Sector.demand})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatingRoundProduction;
