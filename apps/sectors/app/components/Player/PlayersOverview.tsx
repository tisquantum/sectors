'use client';

import React, { useEffect, useState } from 'react';
import { Accordion, AccordionItem, Avatar, Divider } from "@nextui-org/react";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import PlayerShares from "./PlayerShares";
import { trpc } from '@sectors/app/trpc';
import { notFound } from 'next/navigation';

interface StockAggregation {
  totalShares: number;
  totalValue: number;
}

const PlayersOverview = ({ gameId }: { gameId: string }) => {
  const {data: playersWithStock, isLoading} = trpc.game.getPlayersWithStocks.useQuery({ gameId },
    {
      refetchOnMount: false,
    }
  );

  if(isLoading) return <div>Loading...</div>;
  if (playersWithStock == undefined) return notFound();

  return (
    <Accordion>
      {playersWithStock.map((player) => {
        // Aggregate total value and total shares owned
        const stockAggregation = player.Player.PlayerStock.reduce(
          (acc: Record<string, StockAggregation>, playerStock) => {
            const { companyId } = playerStock.Stock;
            if (!acc[companyId]) {
              acc[companyId] = { totalShares: 0, totalValue: 0 };
            }
            acc[companyId].totalShares += playerStock.ownershipPercentage;
            acc[companyId].totalValue += playerStock.Stock.currentPrice * playerStock.ownershipPercentage;
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
            key={player.playerId}
            startContent={
              <Avatar
                src={`https://i.pravatar.cc/150?u=${player.playerId}`}
                name={player.Player.nickname}
                size="sm"
                className="mr-2"
              />
            }
            title={player.Player.nickname}
            subtitle={
              <span>
                <CurrencyDollarIcon className="size-4" /> 300
              </span>
            }
          >
            <div>
              <div>Cash on Hand: ${player.Player.cashOnHand.toFixed(2)}</div>
              <div>Total Asset Value: ${totalValue.toFixed(2)}</div>
              <div>Total Shares Owned: {totalShares}</div>
              <Divider className="my-5" />
              <PlayerShares />
            </div>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default PlayersOverview;
