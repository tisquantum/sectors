import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
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
            <h2>{productionResult.Company.name}</h2>
            <div className="flex gap-3">
              <span>Supply: {productionResult.Company.supplyMax}</span>
              <span>
                Demand:{" "}
                {productionResult.Company.demandScore +
                  productionResult.Company.Sector.demand}
              </span>
              <span>Revenue: {productionResult.revenue}</span>
              <span>Throughput: {productionResult.throughputResult}</span>
              {throughputRewardOrPenalty(productionResult.throughputResult)
                .type == ThroughputRewardType.SECTOR_REWARD ? (
                <span>Prestige: +1</span>
              ) : (
                <span>Share Steps: {productionResult.steps}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatingRoundProduction;
