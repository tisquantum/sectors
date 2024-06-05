import {
  Accordion,
  AccordionItem,
  Avatar,
  Card,
  CardBody,
  Divider,
} from "@nextui-org/react";
import { CompanyStock, Player, Stock } from "@server/prisma/prisma.client";
import { PlayerWithStock } from "@server/prisma/prisma.types";
import PlayerShares from "./PlayerShares";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";

interface StockAggregation {
  totalShares: number;
  totalValue: number;
}

const PlayersOverview = ({ players }: { players: PlayerWithStock[] }) => {
  return (
    <Accordion>
      {players.map((player) => {
        // Aggregate total value and total shares owned
        const stockAggregation = player.companyStockAndStocks.reduce(
          (acc: Record<string, StockAggregation>, playerStock) => {
            const { companyId } = playerStock.companyStock;
            if (!acc[companyId]) {
              acc[companyId] = { totalShares: 0, totalValue: 0 };
            }
            acc[companyId].totalShares += 1;
            acc[companyId].totalValue += playerStock.stock.currentPrice;
            return acc;
          },
          {}
        );

        // Calculate total value and total shares owned
        const totalValue = Object.values(stockAggregation).reduce(
          (acc, { totalValue }) => acc + totalValue,
          0
        );
        const totalShares = Object.values(stockAggregation).reduce(
          (acc, { totalShares }) => acc + totalShares,
          0
        );
        return (
          <AccordionItem
            key={player.id}
            startContent={
              <Avatar
                src={`https://i.pravatar.cc/150?u=${player.id}`}
                name={player.nickname}
                size="sm"
                className="mr-2"
              />
            }
            title={player.nickname}
            subtitle={
              <span>
                <CurrencyDollarIcon className="size-4" /> 300
              </span>
            }
          >
            <div>
              <div>Cash on Hand: ${player.cashOnHand.toFixed(2)}</div>
              <div>Total Asset Value: ${totalValue.toFixed(2)}</div>
              <div>Total Shares Owned: {totalShares}</div>
              <Divider className="my-5"/>
              <PlayerShares />
            </div>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
export default PlayersOverview;
