import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import {
  Company,
  Phase,
  PhaseName,
  Share,
  ShareLocation,
  StockRound,
} from "@server/prisma/prisma.client";
import {
  CompanyWithRelations,
  CompanyWithSector,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerCompany,
  PlayerOrderWithPlayerRevealed,
} from "@server/prisma/prisma.types";
import CompanyInfo from "./CompanyInfo";
import PlayerOrderConcealed from "../Player/PlayerOrderConcealed";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import { set } from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { RiCurrencyFill } from "@remixicon/react";
import { useGame } from "../Game/GameContext";

type CompanyCardProps = {
  company: CompanyWithRelations;
  orders: PlayerOrderConcealedWithPlayer[]; // Replace with the actual type
  isRevealRound: boolean;
  isInteractive: boolean;
  focusedOrder: CompanyWithRelations; // Replace with the actual type
  currentPhase?: Phase;
  playerOrdersRevealed: PlayerOrderWithPlayerRevealed[]; // Replace with the actual type
  phasesOfStockRound: Phase[];
  isOrderInputOpen?: boolean;
  handleButtonSelect: () => void;
  handleCompanySelect: (company: CompanyWithRelations, isIpo: boolean) => void;
};

//TODO: subround calculations can be refactored with new subround entity
const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  orders,
  isRevealRound,
  isInteractive,
  focusedOrder,
  currentPhase,
  playerOrdersRevealed,
  phasesOfStockRound,
  isOrderInputOpen,
  handleButtonSelect,
  handleCompanySelect,
}) => {
  const { gameState } = useGame();
  const [showButton, setShowButton] = useState<boolean | undefined>(
    isOrderInputOpen
  );
  const [isIpo, setIsIpo] = useState<boolean>(false);
  useEffect(() => {
    setShowButton(isOrderInputOpen);
  }, [isOrderInputOpen]);
  const ipoOrders = (
    gameState.playerOrdersConcealed ? orders : playerOrdersRevealed
  ).filter(
    (order) =>
      order.companyId == company.id &&
      order.location == ShareLocation.IPO &&
      order.phaseId !== currentPhase?.id
  );

  const mapPhaseToStockRound = (phaseId: string) => {
    return phasesOfStockRound.findIndex((phase) => phase.id === phaseId) + 1;
  };

  //group ipoOrders by phase
  let groupedIpoOrdersByPhase = ipoOrders?.reduce((acc, order) => {
    const phaseId = order.phaseId;
    if (!phaseId) return acc;
    if (acc[phaseId]) {
      acc[phaseId].count++;
    } else {
      acc[phaseId] = {
        phaseId: order.phaseId,
        count: 1,
        stockRound: order.Phase.StockRound,
        subRound: mapPhaseToStockRound(order.phaseId),
      };
    }
    return acc;
  }, {} as { [key: string]: { phaseId: string; count: number; stockRound: StockRound | null; subRound: number } });

  // Get the entries (key-value pairs) of the object
  const groupedIpoOrdersByPhaseEntries = Object.entries(
    groupedIpoOrdersByPhase
  );

  // Sort the entries based on subRound
  const sortedGroupedIpoOrdersByPhaseEntries =
    groupedIpoOrdersByPhaseEntries.sort(
      ([, valueA], [, valueB]) => valueA.subRound - valueB.subRound
    );

  // If you need to use the sorted entries as an object again
  groupedIpoOrdersByPhase = Object.fromEntries(
    sortedGroupedIpoOrdersByPhaseEntries
  );

  const openMarketOrders = (
    gameState.playerOrdersConcealed ? orders : playerOrdersRevealed
  ).filter(
    (order) =>
      order.companyId == company.id &&
      order.location == ShareLocation.OPEN_MARKET &&
      order.phaseId !== currentPhase?.id
  );

  //TODO: Identify all phases for the stock round, map them to a number.
  let groupedOpenMarketOrdersByPhase = openMarketOrders?.reduce(
    (acc, order) => {
      const phaseId = order.phaseId;
      if (!phaseId) return acc;
      if (acc[phaseId]) {
        acc[phaseId].count++;
      } else {
        acc[phaseId] = {
          phaseId: order.phaseId,
          count: 1,
          stockRound: order.Phase.StockRound,
          subRound: mapPhaseToStockRound(order.phaseId),
        };
      }
      return acc;
    },
    {} as {
      [key: string]: {
        phaseId: string;
        count: number;
        stockRound: StockRound | null;
        subRound: number;
      };
    }
  );

  // Get the entries (key-value pairs) of the object
  const groupedOpenMarketOrdersByPhaseEntries = Object.entries(
    groupedOpenMarketOrdersByPhase
  );

  // Sort the entries based on subRound
  const sortedGroupedOpenMarketOrdersByPhaseEntries =
    groupedOpenMarketOrdersByPhaseEntries.sort(
      ([, valueA], [, valueB]) => valueA.subRound - valueB.subRound
    );

  // Convert the sorted entries back into an object
  groupedOpenMarketOrdersByPhase = Object.fromEntries(
    sortedGroupedOpenMarketOrdersByPhaseEntries
  );

  const handleDisplayOrderInput = (
    company: CompanyWithRelations,
    isIpo?: boolean
  ) => {
    setIsIpo(isIpo || false);
    //setShowPlayerInput(true);
    handleCompanySelect(company, isIpo || false);
  };
  isRevealRound = !gameState?.playerOrdersConcealed || isRevealRound;

  return (
    <Card
      className={`z-3 max-w-[300px] ${
        company.status === "INACTIVE" ? "inactive-stripes" : ""
      }`}
    >
      <CardHeader className="bg-gray-950">
        <div className="flex flex-col w-full">
          <CompanyInfo companyId={company.id} showBarChart />
        </div>
      </CardHeader>
      <CardBody>
        <div
          className={`flex flex-col ${
            company.status === "INACTIVE" && "bg-gray-950 rounded-md"
          }`}
        >
          <div>
            <div
              className={`${
                company.status === "INACTIVE" && "bg-gray-950 rounded-md"
              } p-2 flex gap-1`}
            >
              IPO <RiCurrencyFill className="h-6 w-6" />
              {
                company.Share.filter(
                  (share: Share) => share.location == ShareLocation.IPO
                ).length
              }{" "}
              <span className="font-bold">@ ${company.ipoAndFloatPrice}</span>
            </div>
          </div>
          {!isRevealRound && (
            <div
              className={`${
                company.status === "INACTIVE" &&
                orders.length > 0 &&
                "bg-slate-950 rounded-md p-2"
              }`}
            >
              <div className="flex flex-col gap-4 w-full">
                {Object.keys(groupedIpoOrdersByPhase).map((index, indexInt) => (
                  <div className="flex flex-col" key={index}>
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-gray-400">
                        {groupedIpoOrdersByPhase[index]?.subRound}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <PlayerOrderConcealed
                        orders={ipoOrders.filter(
                          (order) =>
                            order.phaseId ==
                            groupedIpoOrdersByPhase[index].phaseId
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isRevealRound && (
            <div
              className={`${
                company.status === "INACTIVE" &&
                orders.length > 0 &&
                "bg-slate-950 rounded-md p-2"
              }`}
            >
              <div className="flex flex-col gap-4 w-full">
                {Object.keys(groupedIpoOrdersByPhase).map((index, indexInt) => (
                  <div className="flex flex-col" key={index}>
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-gray-400">
                        {groupedIpoOrdersByPhase[index]?.subRound}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <PlayerOrder
                        orders={playerOrdersRevealed.filter(
                          (order) =>
                            order.phaseId ==
                            groupedIpoOrdersByPhase[index].phaseId
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isInteractive &&
            company.Share.filter(
              (share: Share) => share.location == ShareLocation.IPO
            ).length > 0 && (
              <Drawer.Trigger asChild>
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
              </Drawer.Trigger>
            )}
          <div>
            <div
              className={`${
                company.status === "INACTIVE" && "bg-gray-950 rounded-md"
              } p-2 flex gap-1`}
            >
              OPEN MARKET <RiCurrencyFill className="h-6 w-6" />
              {
                company.Share.filter(
                  (share: Share) => share.location == ShareLocation.OPEN_MARKET
                ).length
              }{" "}
              <span className="font-bold">@ ${company.currentStockPrice}</span>
            </div>
          </div>
          {!isRevealRound && (
            <div
              className={`${
                company.status === "INACTIVE" &&
                orders.length > 0 &&
                "bg-slate-950 rounded-md p-2"
              }`}
            >
              <div className="flex flex-col gap-4 w-full">
                {Object.keys(groupedOpenMarketOrdersByPhase).map(
                  (index, indexInt) => (
                    <div className="flex flex-col" key={index}>
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-400">
                          {groupedOpenMarketOrdersByPhase[index]?.subRound}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <PlayerOrderConcealed
                          orders={openMarketOrders.filter(
                            (order) =>
                              order.phaseId ==
                              groupedOpenMarketOrdersByPhase[index].phaseId
                          )}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {isRevealRound && (
            <div
              className={`${
                company.status === "INACTIVE" &&
                orders.length > 0 &&
                "bg-slate-950 rounded-md p-2"
              }`}
            >
              <div className="flex flex-col gap-4 w-full">
                {Object.keys(groupedOpenMarketOrdersByPhase).map(
                  (index, indexInt) => (
                    <div className="flex flex-col" key={index}>
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-400">
                          {groupedOpenMarketOrdersByPhase[index]?.subRound}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <PlayerOrder
                          orders={playerOrdersRevealed.filter(
                            (order) =>
                              order.phaseId ==
                              groupedOpenMarketOrdersByPhase[index].phaseId
                          )}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {isInteractive && (
            <Drawer.Trigger asChild>
              <Button
                className={
                  focusedOrder?.id == company.id
                    ? "my-3 bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                    : "my-3 ring-2 ring-gray-950"
                }
                onClick={() => handleDisplayOrderInput(company, false)}
              >
                Place Order OPEN MARKET
              </Button>
            </Drawer.Trigger>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default CompanyCard;
