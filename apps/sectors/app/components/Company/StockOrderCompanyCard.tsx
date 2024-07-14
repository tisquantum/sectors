import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import {
  Company,
  Phase,
  PhaseName,
  Share,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  CompanyWithSector,
  PlayerOrderConcealedWithPlayer,
  PlayerOrderWithPlayerCompany,
} from "@server/prisma/prisma.types";
import CompanyInfo from "./CompanyInfo";
import PlayerOrderConcealed from "../Player/PlayerOrderConcealed";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import { set } from "lodash";
import { motion, AnimatePresence } from "framer-motion";

type CompanyCardProps = {
  company: CompanyWithSector;
  orders: PlayerOrderConcealedWithPlayer[]; // Replace with the actual type
  isRevealRound: boolean;
  isInteractive: boolean;
  focusedOrder: CompanyWithSector; // Replace with the actual type
  currentPhase?: Phase;
  playerOrdersRevealed: PlayerOrderWithPlayerCompany[]; // Replace with the actual type
};

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  orders,
  isRevealRound,
  isInteractive,
  focusedOrder,
  currentPhase,
  playerOrdersRevealed,
}) => {
  const [isIpo, setIsIpo] = useState<boolean>(false);
  const [showPlayerInput, setShowPlayerInput] = useState<boolean>(false);
  useEffect(() => {
    if (currentPhase?.name == PhaseName.STOCK_ACTION_RESULT) {
      setShowPlayerInput(false);
    }
  }, [currentPhase?.name]);
  const ipoOrders = orders.filter(
    (order) =>
      order.companyId == company.id &&
      order.location == ShareLocation.IPO &&
      order.phaseId !== currentPhase?.id
  );

  const openMarketOrders = orders.filter(
    (order) =>
      order.companyId == company.id &&
      order.location == ShareLocation.OPEN_MARKET &&
      order.phaseId !== currentPhase?.id
  );

  const handleDisplayOrderInput = (company: Company, isIpo?: boolean) => {
    setIsIpo(true);
    setShowPlayerInput(true);
  };

  return (
    <div className="flex">
      <Card
        className={`z-3 ${
          focusedOrder?.id == company.id
            ? "border border-pink-500 animate-glow"
            : ""
        } ${company.status === "INACTIVE" ? "inactive-stripes" : ""}`}
      >
        <CardHeader className="bg-gray-950">
          <div className="flex flex-col w-full">
            <CompanyInfo company={company} showBarChart />
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
                } p-2`}
              >
                IPO (
                {
                  company.Share.filter(
                    (share: Share) => share.location == ShareLocation.IPO
                  ).length
                }
                ){" "}
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
                <PlayerOrderConcealed orders={ipoOrders} />
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
                <PlayerOrder
                  orders={playerOrdersRevealed.filter(
                    (order) =>
                      order.companyId == company.id &&
                      order.location == ShareLocation.IPO &&
                      order.phaseId !== currentPhase?.id
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
                  company.status === "INACTIVE" && "bg-gray-950 rounded-md"
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
                  company.status === "INACTIVE" &&
                  orders.length > 0 &&
                  "bg-slate-950 rounded-md p-2"
                }`}
              >
                <PlayerOrderConcealed orders={openMarketOrders} />
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
                <PlayerOrder
                  orders={playerOrdersRevealed.filter(
                    (order) =>
                      order.companyId == company.id &&
                      order.location == ShareLocation.OPEN_MARKET &&
                      order.phaseId !== currentPhase?.id
                  )}
                />
              </div>
            )}
            {isInteractive &&
              (company.Share.filter(
                (share: Share) => share.location == ShareLocation.OPEN_MARKET
              ).length > 0 ||
                company.Share.filter(
                  (share: Share) => share.location == ShareLocation.PLAYER
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
      <AnimatePresence>
        {showPlayerInput && (
          <motion.div
            className="z-0 h-full"
            initial={{ x: "-100%", opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full">
              <CardBody className="justify-center">
                <PlayerOrderInput
                  currentOrder={company}
                  handleCancel={() => {
                    setShowPlayerInput(false);
                  }}
                  isIpo={isIpo} // Pass IPO state here
                  handlePlayerInputConfirmed={() => {}} // Callback on input confirmed
                />
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyCard;
