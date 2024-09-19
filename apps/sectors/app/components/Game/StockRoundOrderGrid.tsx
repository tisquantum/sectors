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
  OrderType,
  Phase,
  PhaseName,
  Player,
  ShareLocation,
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

const StockRoundOrderGrid = ({
  handleOrder,
  forwardedRef,
}: {
  handleOrder?: (company: Company, isIpo?: boolean) => void;
  forwardedRef?: HTMLDivElement | null;
}) => {
  const { closeDrawer } = useDrawer();
  const { gameId, currentPhase, gameState, authPlayer } = useGame();
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
      where: { stockRoundId: gameState?.currentStockRoundId },
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
        stockRoundId: gameState?.currentStockRoundId,
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
  if (isLoading) return null;
  if (isLoadingPhases) return null;
  if (companies == undefined) return notFound();
  if (currentPhase == undefined) return notFound();
  if (phasesOfStockRound == undefined) return notFound();
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
          </div>
        </Tab>
        <Tab key="derivatives" title="Derivatives">
          <Derivatives isInteractive={isInteractive} />
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
            <h2 className="text-xl font-bold mt-8 mb-4">Derivatives</h2>
            <DerivativesTable isInteractive={isInteractive} />
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
                <Tabs>
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
                        data={selectedCompanyOrder.company.StockHistory.map(
                          (stockHistory, index) => ({
                            phaseId: `${index + 1} ${stockHistory.Phase.name}`,
                            stockPrice: stockHistory.price,
                            stockAction: stockHistory.action,
                            steps: stockHistory.stepsMoved,
                          })
                        )}
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
