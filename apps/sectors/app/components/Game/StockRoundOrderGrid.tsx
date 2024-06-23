"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import React, { useState } from "react";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import { organizeCompaniesBySector } from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";
import { Company, PhaseName } from "@server/prisma/prisma.client";
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
  const { gameId, currentPhase } = useGame();
  const { data: companies, isLoading } =
    trpc.company.listCompaniesWithSector.useQuery({
      where: { gameId },
    });
  const { data: playerOrdersConcealed, isLoading: isLoadingOrders } =
    trpc.playerOrder.listPlayerOrdersConcealed.useQuery({
      where: { phaseId: currentPhase?.id },
    });
  const [showOrderInput, setShowOrderInput] = useState<string | undefined>(
    undefined
  );
  const [focusedOrder, setFocusedOrder] = useState<any>(null);
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
                  {!isRevealRound && <PlayerOrderConcealed orders={orders} />}
                  <Button
                    className={
                      focusedOrder?.id == company.id
                        ? "bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                        : ""
                    }
                    onClick={() => handleDisplayOrderInput(company, true)}
                  >
                    Place Order IPO
                  </Button>
                </div>
                <div>
                  <div className="my-3">OPEN MARKET (4)</div>
                  {!isRevealRound && <PlayerOrderConcealed orders={orders} />}
                  <Button
                    className={
                      focusedOrder?.id == company.id
                        ? "bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                        : ""
                    }
                    onClick={() => handleDisplayOrderInput(company)}
                  >
                    Place Order OPEN MARKET
                  </Button>
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
