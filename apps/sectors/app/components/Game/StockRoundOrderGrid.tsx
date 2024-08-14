"use client";

import { Button, Tab, Tabs } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import {
  isCurrentPhaseInteractive,
  organizeCompaniesBySector,
} from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";
import {
  Company,
  Phase,
  PhaseName,
  Player,
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
}: {
  handleOrder?: (company: Company, isIpo?: boolean) => void;
}) => {
  const { gameId, currentPhase, gameState, authPlayer } = useGame();
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithRelations.useQuery({
      where: { gameId },
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
    data: playerOrdersRevealed,
    isLoading: isLoadingPlayerOrdersRevealed,
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
    refetchPhasesOfStockRound();
  }, [currentPhase?.id]);
  useEffect(() => {
    if (playerOrdersConcealed && currentPhase) {
      isOrderInputOpenPlayerOrderCounter(
        playerOrdersConcealed,
        authPlayer,
        currentPhase,
        setIsOrderInputOpen
      );
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
              orders={orders}
              handleDisplayOrderInput={handleDisplayOrderInput}
              handleCompanySelect={handleCompanySelect}
              handleButtonSelect={companyCardButtonClicked}
            />
            <h2 className="text-xl font-bold mt-8 mb-4">Derivatives</h2>
            <DerivativesTable />
          </div>
        </Tab>
      </Tabs>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-slate-900 flex flex-col rounded-t-[10px] h-full w-96 fixed top-[64.9px] right-0">
          {selectedCompanyOrder && (
            <div className="flex flex-col justify-center items-center bg-slate-900 p-4">
              <h2 className="text-white text-2xl font-bold mb-2">
                {selectedCompanyOrder.isIpo ? "IPO Order" : "Open Market Order"}
              </h2>
              <PlayerOrderInput
                currentOrder={selectedCompanyOrder.company}
                handleCancel={() => {}}
                isIpo={selectedCompanyOrder.isIpo} // Pass IPO state here
                handlePlayerInputConfirmed={() => {
                  companyCardButtonClicked();
                }} // Callback on input confirmed
              />
              <div className="h-96">
                <CompanyInfo
                  company={selectedCompanyOrder.company}
                  showBarChart
                />
              </div>
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
                  sectorColors[selectedCompanyOrder.company.Sector.name],
                ]}
                valueFormatter={valueFormatter}
              />
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
