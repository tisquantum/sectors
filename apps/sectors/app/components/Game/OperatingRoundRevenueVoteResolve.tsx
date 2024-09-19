import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  ProductionResultWithCompany,
  RevenueDistributionVoteWithRelations,
} from "@server/prisma/prisma.types";
import { Avatar, Badge, Chip } from "@nextui-org/react";
import CompanyInfo from "../Company/CompanyInfo";
import { CompanyTierData } from "@server/data/constants";
import PlayerAvatar from "../Player/PlayerAvatar";
import {
  Company,
  RevenueDistribution,
  ShareLocation,
} from "@server/prisma/prisma.client";

const OperatingRoundRevenueVoteResolve = () => {
  const { currentPhase, playersWithShares, gameId } = useGame();
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
        gameId,
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
  const playersWithSharesAboveZero = playersWithShares.filter(
    (player) => player.Share.length > 0
  );
  const renderResultInfo = (
    revenueDistribution: RevenueDistribution | null,
    options: {
      revenue?: number;
      dividendFull?: number;
      dividendHalf?: number;
      retainedRevenueHalf?: number;
    }
  ) => {
    switch (revenueDistribution) {
      case RevenueDistribution.DIVIDEND_FULL:
        return (
          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold">Dividends</span>
            <span>Full Per Share: ${options.dividendFull}</span>
          </div>
        );
      case RevenueDistribution.DIVIDEND_FIFTY_FIFTY:
        return (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold">Dividends</span>
              <span>Half Per Share: ${options.dividendHalf}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold">Retained Revenue</span>
              <span>To Company (Half): ${options.retainedRevenueHalf}</span>
            </div>
          </>
        );
      case RevenueDistribution.RETAINED:
        return (
          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold">Retained Revenue</span>
            <span>To Company (Full): ${options.revenue}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const calculateDividendFullRetainedRevenue = (
    productionResult: ProductionResultWithCompany
  ) => {
    const shareCount = productionResult.Company.Share.filter(
      (share) => share.location === ShareLocation.IPO
    ).length;
    const totalShares = productionResult.Company.Share.length;
    return shareCount > 0
      ? Math.floor((productionResult.revenue / totalShares) * shareCount)
      : 0;
  };
  return (
    <div>
      <h1 className="text-2xl">Operating Round Revenue Vote Resolution</h1>
      <div className="flex flex-wrap gap-4">
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
            const retainedRevenueHalf = Math.floor(revenue / 2);

            return (
              <div
                className="flex flex-col bg-slate-800 p-4"
                key={productionResult.id}
              >
                <CompanyInfo
                  companyId={productionResult.Company.id}
                  showBarChart
                />
                <div className="flex flex-col gap-2 rounded-md bg-gray-950 m-2 p-2">
                  <span className="text-lg">Production Results</span>
                  <span>
                    Result:{" "}
                    {productionResult.revenueDistribution ||
                      RevenueDistribution.RETAINED}
                  </span>
                  <span>Revenue: ${revenue}</span>
                  <span className="text-md my-2">
                    Operating Costs: ${operatingCosts}
                  </span>
                  {renderResultInfo(productionResult.revenueDistribution, {
                    revenue,
                    dividendFull,
                    dividendHalf,
                    retainedRevenueHalf,
                  })}
                  <div className="flex gap-5 mt-1">
                    {productionResult?.revenueDistribution ===
                      RevenueDistribution.DIVIDEND_FULL && (
                      <>
                        {playersWithSharesAboveZero.map((playerWithShares) => {
                          const doesPlayerOwnAnyShares =
                            playerWithShares.Share.filter(
                              (share) =>
                                share.companyId === productionResult?.companyId
                            ).length > 0;
                          if (!doesPlayerOwnAnyShares) {
                            return null;
                          }
                          return (
                            <PlayerAvatar
                              player={playerWithShares}
                              key={playerWithShares.id}
                              badgeContent={
                                "$" +
                                playerWithShares.Share.filter(
                                  (share) =>
                                    share.companyId ===
                                    productionResult?.companyId
                                ).length *
                                  dividendFull
                              }
                            />
                          );
                        })}
                        {/* <Badge
                          content={
                            "$" +
                            calculateDividendFullRetainedRevenue(
                              productionResult
                            )
                          }
                        >
                          <Avatar name={productionResult.Company.stockSymbol} />
                        </Badge> */}
                      </>
                    )}
                    {productionResult?.revenueDistribution ===
                      RevenueDistribution.DIVIDEND_FIFTY_FIFTY && (
                      <>
                        {playersWithSharesAboveZero.map((playerWithShares) => {
                          const doesPlayerOwnAnyShares =
                            playerWithShares.Share.filter(
                              (share) =>
                                share.companyId === productionResult?.companyId
                            ).length > 0;
                          if (!doesPlayerOwnAnyShares) {
                            return null;
                          }
                          return (
                            <PlayerAvatar
                              player={playerWithShares}
                              key={playerWithShares.id}
                              badgeContent={
                                "$" +
                                playerWithShares.Share.filter(
                                  (share) =>
                                    share.companyId ===
                                    productionResult?.companyId
                                ).length *
                                  dividendHalf
                              }
                            />
                          );
                        })}
                        <Badge content={"$" + retainedRevenueHalf}>
                          <Avatar name={productionResult.Company.stockSymbol} />
                        </Badge>
                      </>
                    )}
                    {(productionResult?.revenueDistribution ===
                      RevenueDistribution.RETAINED ||
                      !productionResult?.revenueDistribution) && (
                      <Badge content={"$" + revenue}>
                        <Avatar name={productionResult.Company.stockSymbol} />
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="mb-1">Vote Results</span>
                  <div className="flex flex-col my-2 gap-3">
                    {revenueDistributionVote
                      .filter(
                        (vote: RevenueDistributionVoteWithRelations) =>
                          vote.companyId === productionResult.Company.id
                      )
                      .map((vote: RevenueDistributionVoteWithRelations) => (
                        <Chip
                          key={vote.id}
                          className="my-2"
                          avatar={
                            <PlayerAvatar
                              player={vote.Player}
                              badgeContent={vote.weight}
                            />
                          }
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
