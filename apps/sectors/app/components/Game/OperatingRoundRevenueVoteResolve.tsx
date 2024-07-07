import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";

const OperatingRoundRevenueVoteResolve = () => {
  const { currentPhase } = useGame();
  const { data: productionResults, isLoading } =
    trpc.operatingRound.getOperatingRoundWithProductionResults.useQuery({
      where: {
        id: currentPhase?.operatingRoundId,
      },
    });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!productionResults) {
    return <div>No operating round found</div>;
  }
  return (
    <div>
      <h1>Operating Round Revenue Vote Resolution</h1>
      <div className="grid grid-cols-3 gap-4">
        {
          //display all companies with revenue greater than 0
          productionResults.productionResults.map((productionResult) => (
            <div
              className="flex flex-col bg-slate-800 p-4"
              key={productionResult.id}
            >
              <h2>{productionResult.Company.name}</h2>
              <div className="flex flex-col">
                <div className="flex gap-3">
                  <span>
                    Cash on Hand: ${productionResult.Company.cashOnHand}
                  </span>
                  <span>
                    Stock Price: ${productionResult.Company.currentStockPrice}
                  </span>
                  <span>Supply: {productionResult.Company.supplyMax}</span>
                  <span>
                    Demand:{" "}
                    {productionResult.Company.demandScore +
                      productionResult.Company.Sector.demand}
                  </span>
                  <span>Revenue: {productionResult.revenue}</span>
                  <div>
                    Vote Results
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default OperatingRoundRevenueVoteResolve;
