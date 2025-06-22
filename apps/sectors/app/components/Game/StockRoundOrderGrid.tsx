"use client";

import { Button, Tab, Tabs } from "@nextui-org/react";
import React, { useEffect, useRef, useState } from "react";
import {
  isCurrentPhaseInteractive,
  organizeCompaniesBySector,
} from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";
import {
  Company,
  CompanyStatus,
  OperationMechanicsVersion,
  OrderType,
  Phase,
  PhaseName,
  Player,
  ShareLocation,
  Sector,
  AwardTrackType,
} from "@server/prisma/prisma.client";
import {
  CompanyWithRelations,
  CompanyWithSector,
  PlayerOrderConcealed,
} from "@server/prisma/prisma.types";
import { sectorColors } from "@server/data/gameData";
import "./StockRoundOrderGrid.css";
import CompanyCard from "../Company/StockOrderCompanyCard";
import Derivatives from "./Derivatives";
import { Drawer } from "vaul";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import CompanyInfo from "../Company/CompanyInfo";
import { LineChart } from "@tremor/react";
import SpotMarketTable from "./SpotMarketTable";
import DerivativesTable from "./DerivativesTable";
import OrderResults from "./OrderResults";
import { useDrawer } from "../Drawer.context";
import CompanyAwardTrack from "../Company/CompanyAwardTrack";
import { ResearchTrack } from "../Company/Research/ResearchTrack";
import { ResourceTracksContainer } from "./ResourceTracksContainer";

function isOrderInputOpenPlayerOrderCounter(
  playerOrdersConcealed: PlayerOrderConcealed[],
  authPlayer: Player,
  currentPhase: Phase,
  setIsOrderInputOpen: (open: boolean) => void
) {
  const orderCount = playerOrdersConcealed?.filter(
    (order) =>
      order.playerId === authPlayer.id && order.phaseId == currentPhase.id
  ).length;
  setIsOrderInputOpen(orderCount == 0);
}

interface SectorResearchTracksProps {
  gameId: string;
}

interface WorkforceTrackProps {
  gameId: string;
}

function WorkforceTrack({ gameId }: WorkforceTrackProps) {
  const { data: game } = trpc.game.getGame.useQuery({ id: gameId });

  if (!game) return null;

  const spaces = Array.from({ length: 40 }, (_, i) => i + 1);
  const economyScore = game.economyScore;
  const availableWorkers = game.workforcePool;

  return (
    <div className="mt-4 p-4 bg-gray-500 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Workforce Track</h3>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Available Workers: {availableWorkers}
          </span>
          <span className="text-sm font-medium">
            Economy Score: {economyScore}
          </span>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {spaces.map((space) => (
            <div
              key={space}
              className={`
              relative h-16 pt-4 border rounded flex items-center justify-center
              ${space <= availableWorkers ? "bg-green-100" : "bg-gray-200"}
              ${space === economyScore ? "ring-2 ring-blue-500" : ""}
            `}
            >
              <div className="absolute top-1 text-xs text-gray-600">
                {space}
              </div>
              {space <= availableWorkers && (
                <div className="w-4 h-4 bg-green-500 shadow-md border border-green-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SectorResearchTracks({ gameId }: SectorResearchTracksProps) {
  const { data: sectors } = trpc.sector.listSectors.useQuery({
    where: { gameId },
    orderBy: { name: "asc" },
  });
  const { data: companies } = trpc.company.listCompanies.useQuery({
    where: { gameId },
    orderBy: { name: "asc" },
  });

  if (!sectors || !companies) return null;

  // Group companies by sector
  const companiesBySector = companies.reduce(
    (acc: Record<string, Company[]>, company: Company) => {
      if (company.sectorId) {
        if (!acc[company.sectorId]) {
          acc[company.sectorId] = [];
        }
        acc[company.sectorId].push(company);
      }
      return acc;
    },
    {}
  );

  // Filter sectors to only show those with companies in the game
  const activeSectors = sectors.filter(
    (sector: Sector) => companiesBySector[sector.id]
  );

  // Create a 20-space track with rewards at specific milestones
  const createResearchSpaces = (currentProgress: number) => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `space-${i + 1}`,
      number: i + 1,
      phase: Math.ceil((i + 1) / 5),
      isUnlocked: i + 1 <= currentProgress * 5,
      hasReward: [5, 10, 15, 20].includes(i + 1),
      reward: [5, 10, 15, 20].includes(i + 1)
        ? {
            type: i + 1 === 20 ? ("MARKET_FAVOR" as const) : ("GRANT" as const),
            amount: i + 1 === 20 ? 2 : 1,
          }
        : undefined,
    }));
  };

  return (
    <div className="space-y-4">
      <WorkforceTrack gameId={gameId} />
      {activeSectors.map((sector: Sector) => (
        <div
          key={sector.id}
          className="p-4 rounded-lg shadow"
          style={{
            backgroundColor: sectorColors[sector.name] || "#ffffff",
          }}
        >
          <h3 className="text-lg font-semibold mb-2">{sector.name}</h3>

          {/* Single Research Track for the Sector */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium">Sector Research Track</h4>
              <span className="text-sm text-gray-600">
                Sector Progress: {sector.researchMarker}
              </span>
            </div>

            {/* Main Research Track */}
            <div className="relative">
              <ResearchTrack
                spaces={createResearchSpaces(sector.researchMarker)}
                currentProgress={sector.researchMarker}
                currentPhase={Math.ceil(sector.researchMarker / 5)}
              />

              {/* Company Markers */}
              <div className="mt-2 space-y-1">
                {companiesBySector[sector.id]?.map((company: Company) => (
                  <div key={company.id} className="flex items-center text-sm">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          sectorColors[sector.name || "GENERAL"],
                        position: "absolute",
                        left: `${(company.researchProgress / 20) * 100}%`,
                        transform: "translateX(-50%)",
                        marginTop: "-1.5rem",
                      }}
                    />
                    <span className="text-gray-600">
                      {company.name}: {company.researchProgress}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const StockRoundOrderGrid = ({
  handleOrder,
  forwardedRef,
}: {
  handleOrder?: (company: Company, isIpo?: boolean) => void;
  forwardedRef?: HTMLDivElement | null;
}) => {
  const { closeDrawer } = useDrawer();
  const { gameId, currentPhase, gameState, authPlayer } = useGame();
  const { data: companyAwardTracks, isLoading: isLoadingCompanyAwardTracks } =
    trpc.companyAwardTrack.listCompanyAwardTracks.useQuery({
      where: {
        gameId,
      },
    });
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithRelations.useQuery({
      where: { gameId, status: { not: CompanyStatus.BANKRUPT } },
    });
  const {
    data: playerOrdersConcealed,
    isLoading: isLoadingOrders,
    refetch: refetchPlayerOrdersConcealed,
  } = trpc.playerOrder.listPlayerOrdersConcealed.useQuery(
    {
      where: { stockRoundId: currentPhase?.stockRoundId },
    },
    {
      enabled: currentPhase?.name == PhaseName.STOCK_ACTION_REVEAL,
    }
  );
  const {
    data: playerOrdersConcealedSpotMarket,
    isLoading: isLoadingOrdersSpotMarket,
    refetch: refetchPlayerOrdersConcealedSpotMarket,
  } = trpc.playerOrder.listPlayerOrdersConcealed.useQuery(
    {
      where: {
        stockRoundId: currentPhase?.stockRoundId,
        OR: [
          { orderType: OrderType.MARKET },
          { orderType: OrderType.LIMIT },
          { orderType: OrderType.SHORT },
        ],
      },
    },
    {
      enabled: currentPhase?.name == PhaseName.STOCK_ACTION_REVEAL,
    }
  );
  const {
    data: playerOrdersRevealed,
    isLoading: isLoadingPlayerOrdersRevealed,
    refetch: refetchPlayerOrdersRevealed,
  } = trpc.playerOrder.listPlayerOrdersWithPlayerRevealed.useQuery({
    where: {
      stockRoundId: currentPhase?.stockRoundId,
    },
    gameId,
  });
  const {
    data: phasesOfStockRound,
    isLoading: isLoadingPhases,
    refetch: refetchPhasesOfStockRound,
  } = trpc.phase.listPhases.useQuery({
    where: {
      stockRoundId: currentPhase?.stockRoundId,
      name: PhaseName.STOCK_ACTION_ORDER,
    },
    orderBy: { createdAt: "asc" },
  });
  const [showOrderInput, setShowOrderInput] = useState<string | undefined>(
    undefined
  );
  const [focusedOrder, setFocusedOrder] = useState<any>(null);
  const [isInteractive, setIsInteractive] = useState<boolean>(
    isCurrentPhaseInteractive(currentPhase?.name)
  );
  useEffect(() => {
    //Make sure the glowing effect from placing an order gets removed when we are viewing phase results
    if (!isInteractive) {
      setFocusedOrder(null);
    }
  }, [isInteractive]);
  useEffect(() => {
    setIsInteractive(isCurrentPhaseInteractive(currentPhase?.name));
    refetchPlayerOrdersConcealed();
    refetchPlayerOrdersConcealedSpotMarket();
    refetchPhasesOfStockRound();
    refetchPlayerOrdersRevealed();
  }, [currentPhase?.id]);
  useEffect(() => {
    if (authPlayer && playerOrdersConcealed && currentPhase) {
      isOrderInputOpenPlayerOrderCounter(
        playerOrdersConcealed,
        authPlayer,
        currentPhase,
        setIsOrderInputOpen
      );
    }
    if (currentPhase?.name !== PhaseName.STOCK_ACTION_ORDER) {
      closeDrawer();
    }
  }, [playerOrdersConcealed, currentPhase]);
  const [isOrderInputOpen, setIsOrderInputOpen] = useState<boolean>(false);
  const [selectedCompanyOrder, setSelectedCompanyOrder] = useState<
    { company: CompanyWithRelations; isIpo: boolean } | undefined
  >(undefined);
  if (isLoading) return <div>Loading...</div>;
  if (isLoadingPhases) return <div>Loading...</div>;
  if (isLoadingCompanyAwardTracks) return <div>Loading...</div>;
  if (!companies) return <div>No companies found</div>;
  if (!currentPhase) return <div>No current phase found</div>;
  if (!gameState) return <div>No game state found</div>;
  if (!phasesOfStockRound) return <div>No phases of stock round found</div>;
  const isRevealRound = currentPhase?.name === PhaseName.STOCK_ACTION_REVEAL;
  const orders = playerOrdersConcealed ?? [];
  const companiesBySector = organizeCompaniesBySector(companies);
  const handleDisplayOrderInput = (company: Company, isIpo?: boolean) => {
    //   setShowOrderInput(companyId);
    if (!handleOrder) return;
    handleOrder(company, isIpo);
    setFocusedOrder(company);
  };

  const handleClose = () => {
    setShowOrderInput(undefined);
  };

  const companyCardButtonClicked = () => {
    setIsOrderInputOpen(false);
  };
  const handleCompanySelect = (
    company: CompanyWithRelations,
    isIpo: boolean
  ) => {
    setSelectedCompanyOrder({ company, isIpo });
  };
  const valueFormatter = function (number: number) {
    return "$ " + new Intl.NumberFormat("us").format(number).toString();
  };
  return (
    <>
      <Tabs>
        <Tab key="spot-market" title="Spot Market">
          <div className="flex flex-wrap">
            {Object.keys(companiesBySector).flatMap((sectorId) =>
              companiesBySector[sectorId].companies.map(
                (company: CompanyWithRelations) => (
                  <div
                    key={company.id}
                    className={`z-0 p-4 flex`}
                    style={{
                      backgroundColor: sectorColors[company.Sector.name],
                    }}
                  >
                    <CompanyCard
                      company={company}
                      orders={orders.filter(
                        (order) => order.companyId === company.id
                      )}
                      isRevealRound={isRevealRound}
                      isInteractive={isInteractive}
                      focusedOrder={focusedOrder}
                      currentPhase={currentPhase}
                      playerOrdersRevealed={
                        playerOrdersRevealed?.filter(
                          (order) => order.companyId === company.id
                        ) || []
                      }
                      phasesOfStockRound={phasesOfStockRound}
                      isOrderInputOpen={isOrderInputOpen}
                      handleButtonSelect={companyCardButtonClicked}
                      handleCompanySelect={handleCompanySelect}
                    />
                  </div>
                )
              )
            )}
            <SectorResearchTracks gameId={gameId} />
          </div>
        </Tab>
        {gameState.useOptionOrders && (
          <Tab key="derivatives" title="Derivatives">
            <Derivatives isInteractive={isInteractive} />
          </Tab>
        )}
        <Tab key="resource-market" title="Resource Market">
          <ResourceTracksContainer />
        </Tab>
        <Tab key="table-view" title="Table View">
          <div className="p-4 max-w-full scrollbar">
            <h2 className="text-xl font-bold mb-4">Spot Market</h2>
            <SpotMarketTable
              companies={companies}
              ordersConcealed={playerOrdersConcealedSpotMarket}
              ordersRevealed={playerOrdersRevealed}
              handleDisplayOrderInput={handleDisplayOrderInput}
              handleCompanySelect={handleCompanySelect}
              handleButtonSelect={companyCardButtonClicked}
              isInteractive={isInteractive}
              isRevealRound={isRevealRound}
            />
            {gameState.useOptionOrders && (
              <>
                <h2 className="text-xl font-bold mt-8 mb-4">Derivatives</h2>
                <DerivativesTable isInteractive={isInteractive} />
              </>
            )}
          </div>
        </Tab>
        <Tab key="company-awards" title="Awards Track">
          <div className="p-4 max-w-full scrollbar">
            <div className="flex flex-col gap-4">
              {companyAwardTracks &&
                companyAwardTracks.map((awardTrack) => (
                  <CompanyAwardTrack
                    key={awardTrack.id}
                    companyAwardTrackId={awardTrack.id}
                  />
                ))}
            </div>
          </div>
        </Tab>
      </Tabs>
      <Drawer.Portal container={forwardedRef}>
        <Drawer.Overlay className="z-40 fixed inset-0 bg-black/40" />
        <Drawer.Content className="z-50 bg-slate-900 flex flex-col rounded-t-[10px] h-full w-[400px] fixed bottom-0 right-0">
          {selectedCompanyOrder && (
            <div className="h-full relative bg-slate-900 p-4 overflow-y-scroll scrollbar">
              <div className="flex flex-col justify-center items-center">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {selectedCompanyOrder.isIpo
                    ? `IPO Order ${
                        selectedCompanyOrder.company.Share.filter(
                          (share) => share.location === ShareLocation.IPO
                        ).length
                      }`
                    : `Open Market Order ${
                        selectedCompanyOrder.company.Share.filter(
                          (share) =>
                            share.location === ShareLocation.OPEN_MARKET
                        ).length
                      }`}
                </h2>
                {currentPhase.name === PhaseName.STOCK_ACTION_ORDER && (
                  <PlayerOrderInput
                    currentOrder={selectedCompanyOrder.company}
                    handleCancel={() => {}}
                    isIpo={selectedCompanyOrder.isIpo} // Pass IPO state here
                    handlePlayerInputConfirmed={() => {
                      companyCardButtonClicked();
                    }} // Callback on input confirmed
                  />
                )}
                {gameState?.playerOrdersConcealed && (
                  <div>
                    <OrderResults
                      playerOrdersConcealed={orders.filter(
                        (order) =>
                          order.companyId === selectedCompanyOrder.company.id
                      )}
                      playerOrdersRevealed={
                        playerOrdersRevealed?.filter(
                          (order) =>
                            order.companyId === selectedCompanyOrder.company.id
                        ) || []
                      }
                      currentPhase={currentPhase}
                      phasesOfStockRound={phasesOfStockRound}
                      isRevealRound={isRevealRound}
                    />
                  </div>
                )}
                <Tabs className="mt-4">
                  <Tab key="drawer-company-info" title="Company Info">
                    <div className="h-96">
                      <CompanyInfo
                        companyId={selectedCompanyOrder.company.id}
                        showBarChart
                      />
                    </div>
                  </Tab>
                  <Tab key="drawer-stock-chart" title="Stock Chart">
                    <div className="h-96 w-80">
                      <LineChart
                        className="w-full"
                        data={selectedCompanyOrder.company.StockHistory.filter(
                          (stockHistory) => stockHistory.price !== 0
                        ).map((stockHistory, index) => ({
                          phaseId: `${index + 1} ${stockHistory.Phase.name}`,
                          stockPrice: stockHistory.price,
                          stockAction: stockHistory.action,
                          steps: stockHistory.stepsMoved,
                        }))}
                        index="phaseId"
                        categories={["stockPrice"]}
                        yAxisLabel="Stock Price"
                        xAxisLabel="Stock Price Updated"
                        colors={[
                          sectorColors[
                            selectedCompanyOrder.company.Sector.name
                          ],
                        ]}
                        valueFormatter={valueFormatter}
                      />
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </div>
          )}
          <Drawer.Close asChild>
            <Button>Close drawer</Button>
          </Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </>
  );
};

export default StockRoundOrderGrid;
