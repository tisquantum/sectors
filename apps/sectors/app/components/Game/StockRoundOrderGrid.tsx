"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import {
  isCurrentPhaseInteractive,
  organizeCompaniesBySector,
} from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";
import {
  Company,
  PhaseName,
  StockLocation,
} from "@server/prisma/prisma.client";
import PlayerOrderConcealed from "../Player/PlayerOrderConcealed";

// Define colors for each sector
const sectorColors: { [key: string]: string } = {
  sector1: "bg-red-400",
  sector2: "bg-green-400",
  sector3: "bg-blue-400",
  // Add more sectors and their corresponding colors as needed
};

const StockRoundOrderGrid = ({
  handleOrder,
}: {
  handleOrder: (company: Company, isIpo?: boolean) => void;
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
  } = trpc.playerOrder.listPlayerOrdersConcealed.useQuery({
    where: { stockRoundId: gameState?.currentStockRoundId },
  });
  console.log('playerOrdersConcealed', playerOrdersConcealed);
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
  if (isLoading) return null;
  if (companies == undefined) return notFound();
  const isRevealRound = currentPhase?.name === PhaseName.STOCK_REVEAL;
  const orders = playerOrdersConcealed ?? [];
  const companiesBySector = organizeCompaniesBySector(companies);
  const handleDisplayOrderInput = (company: Company, isIpo?: boolean) => {
    //   setShowOrderInput(companyId);
    //   console.log("Order input displayed for company with ID:", companyId);
    handleOrder(company, isIpo);
    setFocusedOrder(company);
  };

  const handleClose = () => {
    setShowOrderInput(undefined);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {Object.keys(companiesBySector).flatMap((sectorId) =>
        companiesBySector[sectorId].companies.map((company: any) => (
          <div key={company.id} className={`z-0 p-4 ${sectorColors[sectorId]}`}>
            <Card
              className={
                focusedOrder?.id == company.id
                  ? "border border-pink-500 animate-glow"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex flex-col">
                  <div className="text-lg font-bold">{company.name}</div>
                  <div>Price: $55</div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col">
                  <div className="mb-3">IPO (3)</div>
                  {!isRevealRound && (
                    <PlayerOrderConcealed
                      orders={orders.filter(
                        (order) =>
                          order.companyId == company.id &&
                          order.location == StockLocation.IPO &&
                          order.phaseId !== currentPhase?.id // Don't show orders from the current phase, only to be revealed in the "reveal step"
                      )}
                    />
                  )}
                  {isInteractive && (
                    <Button
                      className={
                        focusedOrder?.id == company.id
                          ? "my-3 bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                          : "my-3"
                      }
                      onClick={() => handleDisplayOrderInput(company, true)}
                    >
                      Place Order IPO
                    </Button>
                  )}
                </div>
                <div>
                  <div className="my-2">OPEN MARKET (4)</div>
                  {!isRevealRound && (
                    <PlayerOrderConcealed
                      orders={orders.filter(
                        (order) =>
                          order.companyId == company.id &&
                          order.location == StockLocation.OPEN_MARKET &&
                          order.phaseId !== currentPhase?.id
                      )}
                    />
                  )}
                  {isInteractive && (
                    <Button
                      className={
                        focusedOrder?.id == company.id
                          ? "my-3 bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                          : "my-3"
                      }
                      onClick={() => handleDisplayOrderInput(company)}
                    >
                      Place Order OPEN MARKET
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        ))
      )}
    </div>
  );
};

export default StockRoundOrderGrid;
