"use client";

import React, { useEffect, useState } from "react";
import { Accordion, AccordionItem, Avatar, Divider } from "@nextui-org/react";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import PlayerShares from "./PlayerShares";
import { trpc } from "@sectors/app/trpc";
import { notFound } from "next/navigation";
import { PlayerWithShares } from "@server/prisma/prisma.types";
import { Company } from "@server/prisma/prisma.client";
import { RiWallet3Fill } from "@remixicon/react";
import PlayerAvatar from "./PlayerAvatar";

export interface StockAggregation {
  totalShares: number;
  totalValue: number;
  company?: Company;
}

const PlayersOverview = ({ gameId }: { gameId: string }) => {
  const { data: playersWithShares, isLoading } =
    trpc.game.getPlayersWithShares.useQuery(
      { gameId },
      {
        refetchOnMount: false,
      }
    );

  if (isLoading) return <div>Loading...</div>;
  if (playersWithShares == undefined) return notFound();

  return (
    <Accordion selectionMode="multiple">
      {playersWithShares.map((playerWithShares) => {
        // Aggregate total value and total shares owned
        const stockAggregation = playerWithShares.Share.reduce(
          (acc: Record<string, StockAggregation>, playerWithShares) => {
            const { companyId, price } = playerWithShares;
            if (!acc[companyId]) {
              acc[companyId] = { totalShares: 0, totalValue: 0 };
            }
            acc[companyId].totalShares += 1;
            acc[companyId].totalValue += price;
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
            key={playerWithShares.id}
            startContent={<PlayerAvatar player={playerWithShares} />}
            title={playerWithShares.nickname}
            subtitle={
              <span className="flex items-center content-center">
                <RiWallet3Fill size={18} /> ${playerWithShares.cashOnHand}
              </span>
            }
          >
            <div>
              <div>Total Asset Value: ${totalValue}</div>
              <div>Total Shares Owned: {totalShares}</div>
              <Divider className="my-5" />
              <PlayerShares playerWithShares={playerWithShares} />
            </div>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default PlayersOverview;
