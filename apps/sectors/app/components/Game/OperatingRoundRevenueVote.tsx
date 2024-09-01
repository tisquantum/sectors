import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import {
  Company,
  CompanyStatus,
  ProductionResult,
  RevenueDistribution,
  Sector,
  SectorName,
} from "@server/prisma/prisma.client";
import { Radio, RadioGroup } from "@nextui-org/react";
import { useState } from "react";
import { CompanyTierData } from "@server/data/constants";
import CompanyInfo from "../Company/CompanyInfo";
import ShareHolders from "../Company/ShareHolders";
import Button from "@sectors/app/components/General/DebounceButton";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import SectorConsumerDistributionAnimation from "./SectorConsumerDistributionAnimation";

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
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<RevenueDistribution>(
    RevenueDistribution.DIVIDEND_FULL
  );

  const useVoteRevenueDistributionMutation =
    trpc.revenueDistributionVote.createRevenueDistributionVote.useMutation({
      onSettled: () => {
        setIsLoading(false);
        setIsSubmit(true);
      },
    });
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
        <DebounceButton onClick={handleSubmit} isLoading={isLoading}>
          Submit Vote
        </DebounceButton>
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
  const { data: companiesWithSector, isLoading: isLoadingCompanies } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: {
        gameId: currentPhase?.gameId,
        status: CompanyStatus.ACTIVE,
      },
    });
  if (isLoadingCompanies) {
    return <div>Loading companies...</div>;
  }
  if (!companiesWithSector) {
    return <div>No companies found</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!operatingRound) {
    return <div>No operating round found</div>;
  }
  //organize companies by sector
  const companiesOrganizedBySector = companiesWithSector.reduce(
    (acc, company: CompanyWithSector) => {
      const sectorName = company.Sector.name as SectorName; // Explicitly cast to SectorName
      if (!acc[sectorName]) {
        acc[sectorName] = [];
      }
      acc[sectorName].push(company);
      return acc;
    },
    {} as Record<SectorName, CompanyWithSector[]>
  );
  const sectorNames = Object.keys(companiesOrganizedBySector) as SectorName[];

  return (
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        Operating Round Production Vote
      </h1>
      <div className="flex flex-col gap-1">
        {sectorNames.map((sectorName: SectorName) => (
          <SectorConsumerDistributionAnimation
            key={sectorName}
            sector={companiesOrganizedBySector[sectorName][0].Sector}
            companies={companiesOrganizedBySector[sectorName]}
            consumerOveride={
              companiesOrganizedBySector[sectorName][0].Sector.consumers +
              operatingRound.productionResults
                .filter(
                  (productionResult) =>
                    productionResult.Company.sectorId ===
                    companiesOrganizedBySector[sectorName][0].Sector.id
                )
                .reduce(
                  (acc, productionResult) => acc + productionResult.consumers,
                  0
                )
            }
          />
        ))}
      </div>
      <div className="grid 2xl:flex flex-wrap sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
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
                <div className="flex flex-col items-center gap-2">
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
