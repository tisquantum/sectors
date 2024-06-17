'use client';

import React, { useEffect, useState } from 'react';
import { Accordion, AccordionItem, Avatar, Divider } from "@nextui-org/react";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import PlayerShares from "./PlayerShares";
import { trpc } from '@sectors/app/trpc';
import { notFound } from 'next/navigation';

export interface StockAggregation {
  totalShares: number;
  totalValue: number;
}

const PlayersOverview = ({ gameId }: { gameId: string }) => {
  const { data: playersWithStocks, isLoading } = trpc.game.getPlayersWithStocks.useQuery(
    { gameId },
    {
      refetchOnMount: false,
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (playersWithStocks == undefined) return notFound();

  return (
    <Accordion>
      {playersWithStocks.map((playerWithStocks) => {
        // Aggregate total value and total shares owned
        const stockAggregation = playerWithStocks.Stock.reduce(
          (acc: Record<string, StockAggregation>, playerWithStocks) => {
            const { companyId, currentPrice } = playerWithStocks;
            if (!acc[companyId]) {
              acc[companyId] = { totalShares: 0, totalValue: 0 };
            }
            acc[companyId].totalShares += 1;
            acc[companyId].totalValue += currentPrice;
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
            key={playerWithStocks.id}
            startContent={
              <Avatar
                name={playerWithStocks.nickname}
                size="sm"
                className="mr-2"
              />
            }
            title={playerWithStocks.nickname}
            subtitle={
              <span>
                <CurrencyDollarIcon className="size-4" /> 300
              </span>
            }
          >
            <div>
              <div>Cash on Hand: ${playerWithStocks.cashOnHand.toFixed(2)}</div>
              <div>Total Asset Value: ${totalValue.toFixed(2)}</div>
              <div>Total Shares Owned: {totalShares}</div>
              <Divider className="my-5" />
              <PlayerShares playerWithStocks={playerWithStocks} />
            </div>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};


export default PlayersOverview;
