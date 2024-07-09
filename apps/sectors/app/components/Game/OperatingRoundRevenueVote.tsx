import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  Company,
  ProductionResult,
  RevenueDistribution,
  Sector,
} from "@server/prisma/prisma.client";
import { Button, Radio, RadioGroup } from "@nextui-org/react";
import { useState } from "react";
import { CompanyTierData } from "@server/data/constants";

const DistributeSelection = ({
  company,
  productionResult,
  operatingRoundId,
}: {
  company: Company & { Sector: Sector };
  productionResult: ProductionResult;
  operatingRoundId: number;
}) => {
  const { authPlayer } = useGame();
  const [isSubmit, setIsSubmit] = useState(false);
  const [selected, setSelected] = useState<RevenueDistribution>(
    RevenueDistribution.DIVIDEND_FULL
  );

  const useVoteRevenueDistributionMutation =
    trpc.revenueDistributionVote.createRevenueDistributionVote.useMutation();
  const handleSubmit = async () => {
    //submit vote
    useVoteRevenueDistributionMutation.mutate({
      operatingRoundId: operatingRoundId,
      productionResultId: productionResult.id,
      playerId: authPlayer.id || "",
      companyId: company.id,
      revenueDistribution: selected,
    });
    setIsSubmit(true);
  };

  return (
    <div className="flex flex-col gap-1">
      <RadioGroup
        orientation="horizontal"
        value={selected}
        onValueChange={(value) => setSelected(value as RevenueDistribution)}
      >
        <Radio value={RevenueDistribution.DIVIDEND_FULL}>Dividend Full</Radio>
        <Radio value={RevenueDistribution.DIVIDEND_FIFTY_FIFTY}>
          Dividend Half
        </Radio>
        <Radio value={RevenueDistribution.RETAINED}>Company Retains</Radio>
      </RadioGroup>
      {isSubmit ? (
        <div>Vote Submitted</div>
      ) : (
        <Button onClick={handleSubmit}>Submit Vote</Button>
      )}
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
            <div
              className="flex flex-col bg-slate-800 p-4"
              key={productionResult.id}
            >
              <h2 className="text-xl">{productionResult.Company.name}</h2>
              <span className="text-lg">
                Operating Costs $
                {
                  CompanyTierData[productionResult.Company.companyTier]
                    .operatingCosts
                }
              </span>
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
                  <span>
                    Unit Price: {productionResult.Company.unitPrice} * ( Supply
                    Max: {productionResult.Company.supplyMax} OR Company Demand
                    Score: {productionResult.Company.demandScore} + Sector Base
                    Demand: {productionResult.Company.Sector.demand})
                  </span>
                </div>
                {productionResult.Company && (
                  <DistributeSelection
                    company={productionResult.Company}
                    productionResult={productionResult}
                    operatingRoundId={productionResult.operatingRoundId}
                  />
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
