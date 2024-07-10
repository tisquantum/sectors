import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { RevenueDistributionVoteWithRelations } from "@server/prisma/prisma.types";
import { Avatar, Chip } from "@nextui-org/react";
import CompanyInfo from "../Company/CompanyInfo";
import { CompanyTierData } from "@server/data/constants";

const OperatingRoundRevenueVoteResolve = () => {
  const { currentPhase } = useGame();
  const { data: productionResults, isLoading } =
    trpc.operatingRound.getOperatingRoundWithProductionResults.useQuery({
      where: {
        id: currentPhase?.operatingRoundId,
      },
    });
  const {
    data: revenueDistributionVote,
    isLoading: isRevenueDistributionVoteLoading,
  } =
    trpc.revenueDistributionVote.listRevenueDistributionVotesWithRelations.useQuery(
      {
        where: {
          operatingRoundId: currentPhase?.operatingRoundId,
        },
      }
    );
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!productionResults) {
    return <div>No operating round found</div>;
  }
  if (isRevenueDistributionVoteLoading) {
    return <div>Loading...</div>;
  }
  if (!revenueDistributionVote) {
    return <div>No revenue distribution vote found</div>;
  }
  return (
    <div>
      <h1>Operating Round Revenue Vote Resolution</h1>
      <div className="grid grid-cols-3 gap-4">
        {
          //display all companies with revenue greater than 0
          productionResults.productionResults.map((productionResult) => {
            const operatingCosts =
              CompanyTierData[productionResult.Company.companyTier]
                .operatingCosts;
            const revenue = productionResult.revenue;
            const shareCount = productionResult.Company.Share.length;

            const dividendFull =
              shareCount > 0 ? Math.floor(revenue / shareCount) : 0;
            const dividendHalf =
              shareCount > 0 ? Math.floor(revenue / 2 / shareCount) : 0;
            const retainedRevenueHalf = revenue / 2;

            return (
              <div
                className="flex flex-col bg-slate-800 p-4"
                key={productionResult.id}
              >
                <CompanyInfo company={productionResult.Company} />
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
                    <span>To Company (Full): ${revenue}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span>Vote Results</span>
                  <div className="flex gap-3">
                    {revenueDistributionVote
                      .filter(
                        (vote: RevenueDistributionVoteWithRelations) =>
                          vote.companyId === productionResult.Company.id
                      )
                      .map((vote: RevenueDistributionVoteWithRelations) => (
                        <Chip
                          key={vote.id}
                          avatar={<Avatar name={vote.Player.nickname} />}
                        >
                          <span>{vote.revenueDistribution}</span>
                        </Chip>
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default OperatingRoundRevenueVoteResolve;
