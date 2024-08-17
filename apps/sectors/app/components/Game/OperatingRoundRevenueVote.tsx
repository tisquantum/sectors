import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  Company,
  ProductionResult,
  RevenueDistribution,
  Sector,
} from "@server/prisma/prisma.client";
import { Radio, RadioGroup } from "@nextui-org/react";
import { useState } from "react";
import { CompanyTierData } from "@server/data/constants";
import CompanyInfo from "../Company/CompanyInfo";
import ShareHolders from "../Company/ShareHolders";
import Button from "@sectors/app/components/General/DebounceButton";

const DistributeSelection = ({
  company,
  productionResult,
  operatingRoundId,
}: {
  company: Company & { Sector: Sector };
  productionResult: ProductionResult;
  operatingRoundId: number;
}) => {
  const { authPlayer, gameId } = useGame();
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
      gameId,
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
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        Operating Round Production Vote
      </h1>
      <div className="flex flex-wrap gap-1">
        {operatingRound.productionResults.map((productionResult) => {
          const operatingCosts =
            CompanyTierData[productionResult.Company.companyTier]
              .operatingCosts;
          const revenue = productionResult.revenue;
          const shareCount = productionResult.Company.Share.length;

          const dividendFull =
            shareCount > 0 ? Math.floor(revenue / shareCount) : 0;
          const dividendHalf =
            shareCount > 0 ? Math.floor(revenue / 2 / shareCount) : 0;
          const retainedRevenueHalf = Math.floor(revenue / 2);

          return (
            <div
              className="flex flex-col bg-slate-800 p-4 rounded-lg shadow-md"
              key={productionResult.id}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <CompanyInfo company={productionResult.Company} />
                  <ShareHolders companyId={productionResult.Company.id} />
                </div>
                <div className="flex flex-col gap-2 rounded-md bg-gray-950 m-2 p-2">
                  <span className="text-lg">Production Results</span>
                  <span>Revenue: ${revenue}</span>
                  <span className="text-md my-2">
                    Operating Costs: ${operatingCosts}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold">Dividends</span>
                    <span>Full Per Share: ${dividendFull}</span>
                    <span>Half Per Share: ${dividendHalf}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-semibold">
                      Retained Revenue
                    </span>
                    <span>To Company (Half): ${retainedRevenueHalf}</span>
                    <span>To Company (Retains): ${revenue}</span>
                  </div>
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
          );
        })}
      </div>
    </div>
  );
};
export default OperatingRoundRevenueVote;
