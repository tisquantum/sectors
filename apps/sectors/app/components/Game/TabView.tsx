"use client";

import { PlayerWithStock } from "@server/prisma/prisma.types";
import PlayersOverview from "../Player/PlayersOverview";
import { Accordion, Card, CardBody, Tab, Tabs } from "@nextui-org/react";
import SectorComponent from "../Sector/Sector";

const players: PlayerWithStock[] = [
  {
    gameId: "G1",
    id: "1",
    nickname: "Player 1",
    cashOnHand: 1000,
    companyStockAndStocks: [
      {
        companyStock: { companyId: "C1", stockId: "S1" },
        stock: {
          id: "S1",
          currentPrice: 150,
          companyId: "C1",
          location: "NYSE",
          gameId: "G1",
        },
      },
      {
        companyStock: { companyId: "C1", stockId: "S2" },
        stock: {
          id: "S2",
          currentPrice: 200,
          companyId: "C1",
          location: "NASDAQ",
          gameId: "G1",
        },
      },
      {
        companyStock: { companyId: "C2", stockId: "S3" },
        stock: {
          id: "S3",
          currentPrice: 100,
          companyId: "C2",
          location: "NYSE",
          gameId: "G1",
        },
      },
    ],
  },
  {
    gameId: "G2",
    id: "2",
    nickname: "Player 2",
    cashOnHand: 1200,
    companyStockAndStocks: [
      {
        companyStock: { companyId: "C3", stockId: "S4" },
        stock: {
          id: "S4",
          currentPrice: 100,
          companyId: "C3",
          location: "NYSE",
          gameId: "G2",
        },
      },
    ],
  },
  // Add more players as needed
];

const sectors = [
  {
    id: "sector1",
    name: "Technology",
    supply: 500,
    demand: 600,
    marketingPrice: 150.75,
    floatNumberMin: 10,
    floatNumberMax: 100,
  },
  {
    id: "sector2",
    name: "Healthcare",
    supply: 300,
    demand: 400,
    marketingPrice: 75.25,
    floatNumberMin: 5,
    floatNumberMax: 50,
  },
  {
    id: "sector3",
    name: "Finance",
    supply: 400,
    demand: 500,
    marketingPrice: 120.75,
    floatNumberMin: 8,
    floatNumberMax: 80,
  },
];

export const companies = [
  {
    id: "1",
    name: "Company A",
    currentStockPrice: 150.75,
    previousStockPrice: 145.5,
    cashOnHand: 500000,
    throughput: 120,
    sectorId: "sector1",
    gameId: "game1",
    insolvent: false,
    mergedWithParent: null,
    mergedWithChildren: "",
  },
  {
    id: "2",
    name: "Company B",
    currentStockPrice: 75.25,
    previousStockPrice: 80.0,
    cashOnHand: 200000,
    throughput: 90,
    sectorId: "sector2",
    gameId: "game2",
    insolvent: true,
    mergedWithParent: "Company A",
    mergedWithChildren: "",
  },
  {
    id: "3",
    name: "Company C",
    currentStockPrice: 90.5,
    previousStockPrice: 85.25,
    cashOnHand: 300000,
    throughput: 110,
    sectorId: "sector1",
    gameId: "game1",
    insolvent: false,
    mergedWithParent: null,
    mergedWithChildren: "",
  },
  {
    id: "4",
    name: "Company D",
    currentStockPrice: 120.75,
    previousStockPrice: 115.0,
    cashOnHand: 400000,
    throughput: 130,
    sectorId: "sector3",
    gameId: "game3",
    insolvent: false,
    mergedWithParent: null,
    mergedWithChildren: "",
  },
  {
    id: "5",
    name: "Company E",
    currentStockPrice: 60.25,
    previousStockPrice: 70.0,
    cashOnHand: 100000,
    throughput: 80,
    sectorId: "sector2",
    gameId: "game2",
    insolvent: true,
    mergedWithParent: "Company D",
    mergedWithChildren: "",
  },
  {
    id: "6",
    name: "Company F",
    currentStockPrice: 95.75,
    previousStockPrice: 100.0,
    cashOnHand: 250000,
    throughput: 95,
    sectorId: "sector3",
    gameId: "game3",
    insolvent: false,
    mergedWithParent: null,
    mergedWithChildren: "",
  },
  {
    id: "7",
    name: "Company G",
    currentStockPrice: 85.5,
    previousStockPrice: 80.0,
    cashOnHand: 220000,
    throughput: 100,
    sectorId: "sector1",
    gameId: "game1",
    insolvent: false,
    mergedWithParent: null,
    mergedWithChildren: "",
  },
  {
    id: "8",
    name: "Company H",
    currentStockPrice: 110.25,
    previousStockPrice: 105.0,
    cashOnHand: 450000,
    throughput: 140,
    sectorId: "sector2",
    gameId: "game2",
    insolvent: false,
    mergedWithParent: null,
    mergedWithChildren: "",
  },
  {
    id: "9",
    name: "Company I",
    currentStockPrice: 130.75,
    previousStockPrice: 125.0,
    cashOnHand: 470000,
    throughput: 150,
    sectorId: "sector3",
    gameId: "game3",
    insolvent: false,
    mergedWithParent: null,
    mergedWithChildren: "",
  },
  {
    id: "10",
    name: "Company J",
    currentStockPrice: 50.0,
    previousStockPrice: 55.0,
    cashOnHand: 90000,
    throughput: 70,
    sectorId: "sector1",
    gameId: "game1",
    insolvent: true,
    mergedWithParent: "Company G",
    mergedWithChildren: "",
  },
];

const TabView = ({ gameId }: { gameId: string }) => {
  return (
    <Tabs aria-label="Options" isVertical>
      <Tab key="players" title="Players">
        <Card>
          <PlayersOverview gameId={gameId} />
        </Card>
      </Tab>
      <Tab key="sectors" title="Sectors">
        <Card>
          {/* <SectorComponent sectors={sectors} companies={companies} /> */}
        </Card>
      </Tab>
      <Tab key="history" title="History">
        <Card>
          <CardBody>Display history here.</CardBody>
        </Card>
      </Tab>
      <Tab key="close" title="Close"></Tab>
    </Tabs>
  );
};

export default TabView;
