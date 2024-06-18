"use client";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import React from "react";
import PlayerOrder from "../Player/PlayerOrder";
import PlayerOrderInput from "../Player/PlayerOrderInput";
import { organizeCompaniesBySector } from "@sectors/app/helpers";
import { trpc } from "@sectors/app/trpc";
import { useGame } from "./GameContext";
import { notFound } from "next/navigation";

const orders = [
  { orderType: "MO", orderAmount: 2, isSell: false, playerName: "Alice" },
  { orderType: "LO", orderAmount: 5, isSell: true, playerName: "Bob" },
  { orderType: "SO", term: 3, playerName: "Charlie" },
  { orderType: "SO", term: 1, playerName: "Dave" },
  { orderType: "LO", orderAmount: 10, isSell: false, playerName: "Eve" },
  { orderType: "MO", orderAmount: 4, isSell: true, playerName: "Frank" },
];

// Define colors for each sector
const sectorColors: { [key: string]: string } = {
  sector1: "bg-red-400",
  sector2: "bg-green-400",
  sector3: "bg-blue-400",
  // Add more sectors and their corresponding colors as needed
};

const StockRoundOrderGrid = ({ handleOrder }: any) => {
  const { gameId } = useGame();
  const { data: companies, isLoading } = trpc.company.listCompanies.useQuery({
    where: { gameId },
  });
  if (isLoading) return null;
  if (companies == undefined) return notFound();
  const companiesBySector = organizeCompaniesBySector(companies);
  const [showOrderInput, setShowOrderInput] = React.useState<
    string | undefined
  >(undefined);
  const [focusedOrder, setFocusedOrder] = React.useState<any>(null);
  const handleDisplayOrderInput = (company: any) => {
    //   setShowOrderInput(companyId);
    //   console.log("Order input displayed for company with ID:", companyId);
    handleOrder(company);
    setFocusedOrder(company);
  };

  const handleClose = () => {
    setShowOrderInput(undefined);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {Object.keys(companiesBySector).flatMap((sectorId) =>
        companiesBySector[sectorId].map((company: any) => (
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
                  <PlayerOrder orders={orders} />
                </div>
                <div>
                  <div className="my-3">OPEN MARKET (4)</div>
                  <PlayerOrder orders={orders} isHidden />
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  className={
                    focusedOrder?.id == company.id
                      ? "bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg"
                      : ""
                  }
                  onClick={() => handleDisplayOrderInput(company)}
                >
                  Place Order
                </Button>
              </CardFooter>
            </Card>
          </div>
        ))
      )}
    </div>
  );
};

export default StockRoundOrderGrid;
