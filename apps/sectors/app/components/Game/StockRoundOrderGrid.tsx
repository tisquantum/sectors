"use client";

import { Tab, Tabs } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import {
  isCurrentPhaseInteractive,
  organizeCompaniesBySector,
} from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";
import { Company, PhaseName } from "@server/prisma/prisma.client";
import {
  CompanyWithSector,
  PlayerOrderConcealed,
} from "@server/prisma/prisma.types";
import { sectorColors } from "@server/data/gameData";
import "./StockRoundOrderGrid.css";
import CompanyCard from "../Company/StockOrderCompanyCard";
import Derivatives from "./Derivatives";

const StockRoundOrderGrid = ({
  handleOrder,
}: {
  handleOrder?: (company: Company, isIpo?: boolean) => void;
}) => {
  const { gameId, currentPhase, gameState, authPlayer } = useGame();
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithSector.useQuery({
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
    if (playerOrdersConcealed) {
      isOrderInputOpenPlayerOrderCounter(playerOrdersConcealed);
    }
  }, [playerOrdersConcealed]);
  const [isOrderInputOpen, setIsOrderInputOpen] = useState<boolean>(false);
  if (isLoadingPlayerOrdersRevealed) return <div>Loading...</div>;
  if (playerOrdersRevealed == undefined) return null;
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
    //   console.log("Order input displayed for company with ID:", companyId);
    if (!handleOrder) return;
    handleOrder(company, isIpo);
    setFocusedOrder(company);
  };

  const handleClose = () => {
    setShowOrderInput(undefined);
  };

  const isOrderInputOpenPlayerOrderCounter = (
    playerOrdersConcealed: PlayerOrderConcealed[]
  ) => {
    const orderCount = playerOrdersConcealed?.filter(
      (order) =>
        order.playerId === authPlayer.id && order.phaseId == currentPhase.id
    ).length;
    console.log("isOrderInputOpen", orderCount);
    setIsOrderInputOpen(orderCount == 0);
  };
  const companyCardButtonClicked = () => {
    console.log("Company card button clicked");
    setIsOrderInputOpen(true);
  };
  return (
    <Tabs>
      <Tab key="spot-market" title="Spot Market">
        <div className="flex flex-wrap">
          {Object.keys(companiesBySector).flatMap((sectorId) =>
            companiesBySector[sectorId].companies.map(
              (company: CompanyWithSector) => (
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
                    playerOrdersRevealed={playerOrdersRevealed.filter(
                      (order) => order.companyId === company.id
                    )}
                    phasesOfStockRound={phasesOfStockRound}
                    isOrderInputOpen={isOrderInputOpen}
                    handleButtonSelect={companyCardButtonClicked}
                  />
                </div>
              )
            )
          )}
        </div>
      </Tab>
      <Tab key="derivatives" title="Derivatives">
        <Derivatives />
      </Tab>
    </Tabs>
  );
};

export default StockRoundOrderGrid;
