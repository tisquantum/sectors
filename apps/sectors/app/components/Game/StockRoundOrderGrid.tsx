"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
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
  CompanyStatus,
  PhaseName,
  Share,
  ShareLocation,
} from "@server/prisma/prisma.client";
import PlayerOrderConcealed from "../Player/PlayerOrderConcealed";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import { sectorColors } from "@server/data/gameData";
import {
  RiBox2Fill,
  RiExpandUpDownFill,
  RiHandCoinFill,
  RiIncreaseDecreaseFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiSparkling2Fill,
  RiWallet3Fill,
} from "@remixicon/react";
import "./StockRoundOrderGrid.css";
import { CompanyTierData } from "@server/data/constants";
import CompanyInfo from "../Company/CompanyInfo";

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
  console.log("playerOrdersConcealed", playerOrdersConcealed);
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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {Object.keys(companiesBySector).flatMap((sectorId) =>
        companiesBySector[sectorId].companies.map(
          (company: CompanyWithSector) => (
            <div
              key={company.id}
              className={`z-0 p-4`}
              style={{
                backgroundColor: sectorColors[company.Sector.name],
              }}
            >
              <Card
                className={`
                  ${
                    focusedOrder?.id == company.id
                      ? "border border-pink-500 animate-glow"
                      : ""
                  } 
                    ${
                      company.status === CompanyStatus.INACTIVE
                        ? "inactive-stripes"
                        : ""
                    }`}
              >
                <CardHeader className="bg-gray-950">
                  <div className="flex flex-col w-full">
                    <CompanyInfo company={company} showBarChart />
                  </div>
                </CardHeader>
                <CardBody>
                  <div
                    className={`flex flex-col ${
                      company.status == CompanyStatus.INACTIVE &&
                      "bg-gray-950 rounded-md"
                    }`}
                  >
                    <div>
                      <div
                        className={`${
                          company.status == CompanyStatus.INACTIVE &&
                          "bg-gray-950 rounded-md"
                        } p-2`}
                      >
                        IPO (
                        {
                          company.Share.filter(
                            (share: Share) =>
                              share.location == ShareLocation.IPO
                          ).length
                        }
                        ){" "}
                        <span className="font-bold">
                          @ ${company.ipoAndFloatPrice}
                        </span>
                      </div>
                    </div>
                    {!isRevealRound && (
                      <div
                        className={`${
                          company.status == CompanyStatus.INACTIVE &&
                          orders.length > 0 &&
                          "bg-slate-950 rounded-md p-2"
                        }`}
                      >
                        <PlayerOrderConcealed
                          orders={orders.filter(
                            (order) =>
                              order.companyId == company.id &&
                              order.location == ShareLocation.IPO &&
                              order.phaseId !== currentPhase?.id // Don't show orders from the current phase, only to be revealed in the "reveal step"
                          )}
                        />
                      </div>
                    )}
                    {isRevealRound && (
                      <div
                        className={`${
                          company.status == CompanyStatus.INACTIVE &&
                          orders.length > 0 &&
                          "bg-slate-950 rounded-md p-2"
                        }`}
                      >
                        <PlayerOrder
                          orders={playerOrdersRevealed.filter(
                            (order) =>
                              order.companyId == company.id &&
                              order.location == ShareLocation.IPO &&
                              order.phaseId !== currentPhase?.id // Don't show orders from the current phase, only to be revealed in the "reveal step"
                          )}
                        />
                      </div>
                    )}
                    {isInteractive &&
                      company.Share.filter(
                        (share: Share) => share.location == ShareLocation.IPO
                      ).length > 0 && (
                        <Button
                          className={
                            focusedOrder?.id == company.id
                              ? "my-3 bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                              : "my-3 ring-2 ring-gray-950"
                          }
                          onClick={() => handleDisplayOrderInput(company, true)}
                        >
                          Place Order IPO
                        </Button>
                      )}
                    <div>
                      <div
                        className={`${
                          company.status == CompanyStatus.INACTIVE &&
                          "bg-gray-950 rounded-md"
                        } p-2`}
                      >
                        OPEN MARKET (
                        {
                          company.Share.filter(
                            (share: Share) =>
                              share.location == ShareLocation.OPEN_MARKET
                          ).length
                        }
                        ){" "}
                        <span className="font-bold">
                          @ ${company.currentStockPrice}
                        </span>
                      </div>
                    </div>
                    {!isRevealRound && (
                      <div
                        className={`${
                          company.status == CompanyStatus.INACTIVE &&
                          orders.length > 0 &&
                          "bg-slate-950 rounded-md p-2"
                        }`}
                      >
                        <PlayerOrderConcealed
                          orders={orders.filter(
                            (order) =>
                              order.companyId == company.id &&
                              order.location == ShareLocation.OPEN_MARKET &&
                              order.phaseId !== currentPhase?.id
                          )}
                        />
                      </div>
                    )}
                    {isRevealRound && (
                      <div
                        className={`${
                          company.status == CompanyStatus.INACTIVE &&
                          orders.length > 0 &&
                          "bg-slate-950 rounded-md p-2"
                        }`}
                      >
                        <PlayerOrder
                          orders={playerOrdersRevealed.filter(
                            (order) =>
                              order.companyId == company.id &&
                              order.location == ShareLocation.OPEN_MARKET &&
                              order.phaseId !== currentPhase?.id // Don't show orders from the current phase, only to be revealed in the "reveal step"
                          )}
                        />
                      </div>
                    )}
                    {isInteractive &&
                      (company.Share.filter(
                        (share: Share) =>
                          share.location == ShareLocation.OPEN_MARKET
                      ).length > 0 ||
                        company.Share.filter(
                          (share: Share) =>
                            share.location == ShareLocation.PLAYER
                        ).length > 0) && (
                        <Button
                          className={
                            focusedOrder?.id == company.id
                              ? "my-3 bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                              : "my-3 ring-2 ring-gray-950"
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
          )
        )
      )}
    </div>
  );
};

export default StockRoundOrderGrid;
