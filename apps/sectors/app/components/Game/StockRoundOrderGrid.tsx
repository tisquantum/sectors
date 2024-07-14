"use client";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import PlayerOrder from "../Player/PlayerOrder";
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
  PhaseName,
  Share,
  ShareLocation,
} from "@server/prisma/prisma.client";
import PlayerOrderConcealed from "../Player/PlayerOrderConcealed";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import { sectorColors } from "@server/data/gameData";
import "./StockRoundOrderGrid.css";
import CompanyInfo from "../Company/CompanyInfo";
import Button from "@sectors/app/components/General/DebounceButton";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import CompanyCard from "../Company/StockOrderCompanyCard";

const StockRoundOrderGrid = ({
  handleOrder,
}: {
  handleOrder?: (company: Company, isIpo?: boolean) => void;
}) => {
  const { gameId, currentPhase, gameState } = useGame();
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
  } = trpc.playerOrder.listPlayerOrdersWithPlayerCompany.useQuery({
    where: {
      stockRoundId: currentPhase?.stockRoundId,
    },
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
  }, [currentPhase?.name]);
  if (isLoadingPlayerOrdersRevealed) return <div>Loading...</div>;
  if (playerOrdersRevealed == undefined) return null;
  if (isLoading) return null;
  if (companies == undefined) return notFound();
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

  return (
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
                orders={orders}
                isRevealRound={isRevealRound}
                isInteractive={isInteractive}
                focusedOrder={focusedOrder}
                currentPhase={currentPhase}
                playerOrdersRevealed={playerOrdersRevealed}
              />
            </div>
          )
        )
      )}
    </div>
  );
};

export default StockRoundOrderGrid;
