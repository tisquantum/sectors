"use client";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import React from "react";
import PlayerOrder from "../Player/PlayerOrder";

const orders = [
  { orderType: "MO", isSell: false, playerName: "Alice" },
  { orderType: "LO", orderAmount: 5, isSell: true, playerName: "Bob" },
  { orderType: "SO", term: 3, playerName: "Charlie" },
  { orderType: "SO", term: 1, playerName: "Dave" },
  { orderType: "LO", orderAmount: 10, isSell: false, playerName: "Eve" },
  { orderType: "MO", isSell: true, playerName: "Frank" },
];

// Define colors for each sector
const sectorColors: { [key: string]: string } = {
  sector1: "bg-red-200",
  sector2: "bg-green-200",
  sector3: "bg-blue-200",
  // Add more sectors and their corresponding colors as needed
};

// Group companies by sector
const groupCompaniesBySector = (companies: any[]) => {
  return companies.reduce((acc: { [key: string]: any[] }, company) => {
    const { sectorId } = company;
    if (!acc[sectorId]) {
      acc[sectorId] = [];
    }
    acc[sectorId].push(company);
    return acc;
  }, {});
};

const StockRoundOrderGrid = ({ companies }: any) => {
  const companiesBySector = groupCompaniesBySector(companies);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4">
      {Object.keys(companiesBySector).flatMap((sectorId) =>
        companiesBySector[sectorId].map((company: any) => (
          <div key={company.id} className={`p-4 ${sectorColors[sectorId]}`}>
            <Card>
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
                    <PlayerOrder orders={orders} isHidden/>
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
