"use client";

import { trpc } from "@sectors/app/trpc";
import { useGame } from "../GameContext";
import {
  Company,
  CompanyStatus,
  RevenueDistribution,
  Sector,
  SectorName,
} from "@server/prisma/prisma.client";
import { Radio, RadioGroup, Tooltip, Spinner } from "@nextui-org/react";
import { useState, useMemo } from "react";
import { ShareLocation } from "@server/prisma/prisma.client";
import {
  CompanyTierData,
  FACTORY_CUSTOMER_LIMITS,
} from "@server/data/constants";
import CompanyInfo from "../../Company/CompanyInfo";
import ShareHolders from "../../Company/ShareHolders";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import {
  baseToolTipStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import CompanyPriorityList from "../../Company/CompanyPriorityOperatingRound";
import { Info } from "lucide-react";
import { OperationMechanicsVersion } from "@server/prisma/prisma.client";

// Consumption phase revenue data structure
interface ConsumptionRevenue {
  companyId: string;
  revenue: number;
  consumersReceived: number;
  factories: {
    id: string;
    size: string;
    profit: number;
    consumersReceived: number;
    maxConsumers: number;
  }[];
}

const DistributeSelectionV2 = ({
  company,
  consumptionRevenue,
  operatingRoundId,
}: {
  company: Company & { Sector: Sector };
  consumptionRevenue: ConsumptionRevenue;
  operatingRoundId: string;
}) => {
  const { authPlayer, gameId } = useGame();
  const [isSubmit, setIsSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch company shares to calculate dividends
  const { data: companyShares } = trpc.share.listSharesWithRelations.useQuery(
    {
      where: { companyId: company.id },
    },
    { enabled: !!company.id }
  );

  // Calculate dividend information
  const dividendInfo = useMemo(() => {
    if (!companyShares || consumptionRevenue.revenue <= 0) {
      return null;
    }

    // Each company has 10 shares in rotation
    const TOTAL_SHARES_IN_ROTATION = 10;

    // Filter shares eligible for dividends (PLAYER and OPEN_MARKET, not IPO)
    const eligibleShares = companyShares.filter(
      (share) =>
        share.location === ShareLocation.PLAYER ||
        share.location === ShareLocation.OPEN_MARKET
    );
    const totalEligibleShares = eligibleShares.length;

    // Calculate dividend per share based on total shares in rotation (10)
    // Dividend per share = revenue / 10 (rounded down)
    const dividendFullPerShare = Math.floor(consumptionRevenue.revenue / TOTAL_SHARES_IN_ROTATION);
    // Total dividends paid = per share * number of eligible shares
    const totalDividendsFull = dividendFullPerShare * totalEligibleShares;
    const companyRetainsFull = consumptionRevenue.revenue - totalDividendsFull;

    // For half dividend: half revenue / 10 shares (rounded down)
    const dividendHalfPerShare = Math.floor(
      Math.floor(consumptionRevenue.revenue / 2) / TOTAL_SHARES_IN_ROTATION
    );
    const totalDividendsHalf = dividendHalfPerShare * totalEligibleShares;
    const companyRetainsHalf = consumptionRevenue.revenue - totalDividendsHalf;

    // Get player's shares in this company
    const playerShares = eligibleShares.filter(
      (share) =>
        share.location === ShareLocation.PLAYER &&
        share.playerId === authPlayer?.id
    );
    const playerShareCount = playerShares.length;

    // Calculate player earnings (rounded down)
    const playerEarningsFull = Math.floor(dividendFullPerShare * playerShareCount);
    const playerEarningsHalf = Math.floor(dividendHalfPerShare * playerShareCount);

    return {
      dividendFullPerShare,
      dividendHalfPerShare,
      playerShareCount,
      playerEarningsFull,
      playerEarningsHalf,
      companyRetainsFull,
      companyRetainsHalf,
      companyRetainsAll: consumptionRevenue.revenue,
    };
  }, [companyShares, consumptionRevenue.revenue, authPlayer?.id]);

  // If revenue is negative, must retain (company loses money from cash on hand)
  const isNegativeRevenue = consumptionRevenue.revenue < 0;
  const [selected, setSelected] = useState<RevenueDistribution>(() => {
    // Initialize based on revenue - negative must be retained
    return isNegativeRevenue
      ? RevenueDistribution.RETAINED
      : RevenueDistribution.DIVIDEND_FULL;
  });

  const useVoteRevenueDistributionMutation =
    trpc.revenueDistributionVote.createRevenueDistributionVote.useMutation({
      onSettled: () => {
        setIsLoading(false);
        setIsSubmit(true);
      },
    });

  const handleSubmit = async () => {
    if (!authPlayer) {
      return;
    }
    setIsLoading(true);
    //submit vote
    // For modern operations, productionResultId is not needed (uses FactoryProduction instead)
    useVoteRevenueDistributionMutation.mutate({
      operatingRoundId: operatingRoundId,
      // productionResultId is optional for modern operations - omit it
      playerId: authPlayer.id || "",
      companyId: company.id,
      revenueDistribution: selected,
      gameId,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {isNegativeRevenue && (
        <div className="text-yellow-400 text-sm p-2 bg-yellow-900/20 rounded border border-yellow-700/50">
          ⚠️ Negative revenue must be retained. Company will lose $
          {Math.abs(consumptionRevenue.revenue)} from cash on hand.
        </div>
      )}
      <RadioGroup
        orientation="vertical"
        value={selected}
        onValueChange={(value) => {
          // Prevent changing selection if revenue is negative
          if (!isNegativeRevenue) {
            setSelected(value as RevenueDistribution);
          }
        }}
        isDisabled={isNegativeRevenue}
        classNames={{
          wrapper: "gap-2",
        }}
      >
        <Radio
          value={RevenueDistribution.DIVIDEND_FULL}
          isDisabled={isNegativeRevenue}
          classNames={{
            base: "max-w-full",
            wrapper: "hidden",
            label: "w-full",
          }}
        >
          <div
            className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all ${
              selected === RevenueDistribution.DIVIDEND_FULL
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                selected === RevenueDistribution.DIVIDEND_FULL
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-500 bg-transparent"
              }`}>
                {selected === RevenueDistribution.DIVIDEND_FULL && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-white">Dividend Full</span>
                {dividendInfo && (
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-400">
                      ${dividendInfo.dividendFullPerShare.toFixed(2)}/share
                    </span>
                    {dividendInfo.playerShareCount > 0 && (
                      <span className="text-green-400 font-medium">
                        Your {dividendInfo.playerShareCount} shares: ${dividendInfo.playerEarningsFull.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Radio>
        <Radio
          value={RevenueDistribution.DIVIDEND_FIFTY_FIFTY}
          isDisabled={isNegativeRevenue}
          classNames={{
            base: "max-w-full",
            wrapper: "hidden",
            label: "w-full",
          }}
        >
          <div
            className={`flex items-center justify-between w-full p-3 rounded-lg border-2 transition-all ${
              selected === RevenueDistribution.DIVIDEND_FIFTY_FIFTY
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                selected === RevenueDistribution.DIVIDEND_FIFTY_FIFTY
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-500 bg-transparent"
              }`}>
                {selected === RevenueDistribution.DIVIDEND_FIFTY_FIFTY && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-semibold text-white">Dividend Half</span>
                {dividendInfo && (
                  <div className="flex flex-col gap-1 mt-1 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">
                        ${dividendInfo.dividendHalfPerShare.toFixed(2)}/share
                      </span>
                      {dividendInfo.playerShareCount > 0 && (
                        <span className="text-green-400 font-medium">
                          Your {dividendInfo.playerShareCount} shares: ${dividendInfo.playerEarningsHalf.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-blue-400 font-medium">
                      Company retains: ${dividendInfo.companyRetainsHalf.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Radio>
        <Radio
          value={RevenueDistribution.RETAINED}
          classNames={{
            base: "max-w-full",
            wrapper: "hidden",
            label: "w-full",
          }}
        >
          <div
            className={`flex items-center gap-3 w-full p-3 rounded-lg border-2 transition-all ${
              selected === RevenueDistribution.RETAINED
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              selected === RevenueDistribution.RETAINED
                ? "border-blue-500 bg-blue-500"
                : "border-gray-500 bg-transparent"
            }`}>
              {selected === RevenueDistribution.RETAINED && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-semibold text-white">Company Retains</span>
              {dividendInfo && (
                <span className="text-blue-400 font-medium mt-1 text-sm">
                  Company retains: ${dividendInfo.companyRetainsAll.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </Radio>
      </RadioGroup>
      {isSubmit ? (
        <div className="text-green-400 text-sm text-center py-2">✓ Vote Submitted</div>
      ) : (
        <DebounceButton onClick={handleSubmit} isLoading={isLoading} className="w-full">
          Submit Vote
        </DebounceButton>
      )}
    </div>
  );
};

const OperatingRoundRevenueVoteV2 = () => {
  const { gameId, currentPhase, currentTurn, gameState, authPlayer } =
    useGame();

  // Only render for modern operation mechanics
  if (
    gameState.operationMechanicsVersion !== OperationMechanicsVersion.MODERN
  ) {
    return null;
  }

  // Get production data for current turn
  const { data: productionWithRelations, isLoading: productionLoading } =
    trpc.factoryProduction.getGameTurnProduction.useQuery(
      {
        gameId: gameId || "",
        gameTurnId: currentTurn?.id || "",
      },
      { enabled: !!gameId && !!currentTurn?.id }
    );

  // Get companies with sectors
  const { data: companiesWithSector, isLoading: companiesLoading } =
    trpc.company.listCompaniesWithSector.useQuery(
      {
        where: {
          gameId: gameId || "",
          status: { in: [CompanyStatus.ACTIVE, CompanyStatus.INSOLVENT] },
        },
      },
      { enabled: !!gameId }
    );

  // Get player's shares to determine which companies they own
  const { data: playerWithShares, isLoading: sharesLoading } =
    trpc.player.playerWithShares.useQuery(
      {
        where: { id: authPlayer?.id },
      },
      { enabled: !!authPlayer?.id }
    );

  // Get companies the player owns shares in
  const playerOwnedCompanyIds = useMemo(() => {
    if (!playerWithShares?.Share) {
      return new Set<string>();
    }
    return new Set(playerWithShares.Share.map((share) => share.companyId));
  }, [playerWithShares]);

  // Transform production data into ConsumptionRevenue format
  // Include ALL companies the player owns shares in, even if they have no production
  const consumptionRevenueData = useMemo(() => {
    if (!companiesWithSector) {
      return [];
    }

    // Group production records by company
    const companyRevenueMap = new Map<string, ConsumptionRevenue>();

    // Process production records - include ALL production records
    // Even if customersServed is 0, we still want to show the company if it has production data
    if (productionWithRelations) {
      productionWithRelations.forEach((production: any) => {
        const factory = production.Factory;
        const company = production.Company;

        if (!factory || !company) {
          return;
        }

        const companyId = company.id;
        const factorySize = factory.size as keyof typeof FACTORY_CUSTOMER_LIMITS;
        const maxCustomers = FACTORY_CUSTOMER_LIMITS[factorySize] || 0;

        if (!companyRevenueMap.has(companyId)) {
          companyRevenueMap.set(companyId, {
            companyId,
            revenue: 0,
            consumersReceived: 0,
            factories: [],
          });
        }

        const companyData = companyRevenueMap.get(companyId)!;
        // Use profit if available, otherwise revenue
        const productionRevenue = production.profit ?? production.revenue ?? 0;
        companyData.revenue += productionRevenue;
        companyData.consumersReceived += production.customersServed || 0;
        companyData.factories.push({
          id: factory.id,
          size: factory.size,
          profit: productionRevenue,
          consumersReceived: production.customersServed || 0,
          maxConsumers: maxCustomers,
        });
      });
    }

    // Add companies the player owns shares in that have no production data
    companiesWithSector.forEach((company) => {
      if (
        playerOwnedCompanyIds.has(company.id) &&
        !companyRevenueMap.has(company.id)
      ) {
        companyRevenueMap.set(company.id, {
          companyId: company.id,
          revenue: 0,
          consumersReceived: 0,
          factories: [],
        });
      }
    });

    // Filter to only show companies the player owns shares in
    const filtered = Array.from(companyRevenueMap.values()).filter((revenue) =>
      playerOwnedCompanyIds.has(revenue.companyId)
    );

    // Debug logging
    console.log(
      "[RevenueVote] Player owned company IDs:",
      Array.from(playerOwnedCompanyIds)
    );
    console.log(
      "[RevenueVote] Total production records:",
      productionWithRelations?.length || 0
    );
    console.log(
      "[RevenueVote] Companies in revenue map:",
      Array.from(companyRevenueMap.keys())
    );
    console.log(
      "[RevenueVote] Companies in revenue map with data:",
      Array.from(companyRevenueMap.entries()).map(([id, data]) => ({
        id,
        revenue: data.revenue,
        consumers: data.consumersReceived,
        factories: data.factories.length,
      }))
    );
    console.log(
      "[RevenueVote] Filtered companies:",
      filtered.map((r) => ({
        companyId: r.companyId,
        revenue: r.revenue,
        consumers: r.consumersReceived,
      }))
    );

    return filtered;
  }, [productionWithRelations, companiesWithSector, playerOwnedCompanyIds]);

  if (productionLoading || companiesLoading || sharesLoading) {
    return (
      <div className="p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!consumptionRevenueData || consumptionRevenueData.length === 0) {
    return (
      <div className="p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">
          Consumption Phase Revenue Vote
        </h1>
        <p className="text-gray-400 mb-4">
          Vote on how to distribute revenue earned from consumer consumption
        </p>
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            No production data available for this turn.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Revenue will appear here after the consumption phase is resolved.
          </p>
        </div>
      </div>
    );
  }

  const operatingRoundId = currentPhase?.operatingRoundId || "";
  console.log(
    "[OperatingRoundRevenueVoteV2] consumptionRevenueData",
    consumptionRevenueData,
    companiesWithSector
  );
  return (
    <div className="p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        Consumption Phase Revenue Vote
      </h1>
      <p className="text-gray-400 mb-4">
        Vote on how to distribute revenue earned from consumer consumption
      </p>
      <div className="flex flex-col gap-4">
        {consumptionRevenueData.map((companyRevenue) => {
          // Find the actual company object
          const company = companiesWithSector?.find(
            (c) => c.id === companyRevenue.companyId
          );

          if (!company) {
            return null;
          }

          const revenueColor =
            companyRevenue.revenue < 0
              ? "text-red-400"
              : companyRevenue.revenue > 0
              ? "text-green-400"
              : "text-gray-400";

          return (
            <div
              key={companyRevenue.companyId}
              className="flex flex-col bg-slate-800 p-4 rounded-lg shadow-md border border-gray-700"
            >
              <div className="flex flex-col gap-2">
                <span className="text-lg font-semibold text-white">
                  {company.name}
                </span>
                <span className={`${revenueColor} font-bold`}>
                  Revenue: ${companyRevenue.revenue}
                </span>
                {companyRevenue.consumersReceived > 0 ? (
                  <span className="text-md my-2 text-gray-300">
                    Consumers Received: {companyRevenue.consumersReceived}
                  </span>
                ) : (
                  <span className="text-md my-2 text-gray-500 italic">
                    No consumers served this turn
                  </span>
                )}
                {/* Factory Breakdown */}
                {companyRevenue.factories.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <span className="text-sm font-medium text-gray-300">
                      Factory Performance:
                    </span>
                    {companyRevenue.factories.map((factory) => {
                      const capacityPercent =
                        factory.maxConsumers > 0
                          ? (
                              (factory.consumersReceived /
                                factory.maxConsumers) *
                              100
                            ).toFixed(0)
                          : "0";
                      const isFullCapacity =
                        factory.consumersReceived === factory.maxConsumers;

                      return (
                        <div
                          key={factory.id}
                          className="flex justify-between items-center bg-gray-800 rounded p-2"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-300">
                              {factory.size.replace("_", " ")}
                            </span>
                            <span className="text-xs text-blue-400">
                              {factory.consumersReceived}/{factory.maxConsumers}{" "}
                              consumers
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-green-400 font-bold">
                              ${factory.profit}
                            </span>
                            <span
                              className={`text-xs ${
                                isFullCapacity
                                  ? "text-green-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {capacityPercent}% capacity
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Voting UI - Only show for positive revenue */}
                {companyRevenue.revenue > 0 && (
                  <div className="mt-4">
                    <DistributeSelectionV2
                      company={company as Company & { Sector: Sector }}
                      consumptionRevenue={companyRevenue}
                      operatingRoundId={operatingRoundId}
                    />
                  </div>
                )}
                {/* Negative revenue - automatically retained, no vote needed */}
                {companyRevenue.revenue < 0 && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Negative revenue will be automatically retained.
                      Company will lose ${Math.abs(companyRevenue.revenue)} from
                      cash on hand during revenue distribution resolution.
                    </p>
                  </div>
                )}
                {/* Zero revenue - no vote needed */}
                {companyRevenue.revenue === 0 && (
                  <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded">
                    <p className="text-gray-400 text-sm">
                      No revenue to distribute this turn.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperatingRoundRevenueVoteV2;
