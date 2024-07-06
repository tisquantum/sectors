import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  Company,
  RevenueDistribution,
  Sector,
} from "@server/prisma/prisma.client";
import { Button, Radio, RadioGroup } from "@nextui-org/react";

const DistributeSelection = ({
  company,
}: {
  company: Company & { Sector: Sector };
}) => {
  const handleSubmit = async () => {
    //submit vote
  };

  return (
    <div className="flex flex-col gap-1">
      <RadioGroup orientation="horizontal">
        <Radio value={RevenueDistribution.DIVIDEND_FULL}>Dividend Full</Radio>
        <Radio value={RevenueDistribution.DIVIDEND_FIFTY_FIFTY}>
          Dividend Half
        </Radio>
        <Radio value={RevenueDistribution.RETAINED}>Company Retains</Radio>
      </RadioGroup>
      <Button onClick={handleSubmit}>Submit Vote</Button>
    </div>
  );
};

const OperatingRoundRevenueVote = () => {
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
      <h1>Operating Round Revenue Vote</h1>
      <div className="grid grid-cols-3 gap-4">
        {
          //display all companies with revenue greater than 0
          productionResults.productionResults.map((productionResult) => (
            <div className="flex flex-col bg-slate-800 p-4" key={productionResult.id}>
              <h2>{productionResult.Company.name}</h2>
              <div className="flex flex-col">
                <div className="flex gap-3">
                  <span>Cash on Hand: ${productionResult.Company.cashOnHand}</span>
                  <span>Stock Price: ${productionResult.Company.currentStockPrice}</span>
                  <span>Supply: {productionResult.Company.supplyMax}</span>
                  <span>
                    Demand: {productionResult.Company.demandScore +
                      productionResult.Company.Sector.demand}
                  </span>
                  <span>Revenue: {productionResult.revenue}</span>
                </div>
                {productionResult.Company && (
                  <DistributeSelection company={productionResult.Company} />
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};
export default OperatingRoundRevenueVote;
