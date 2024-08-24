"use client";

import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Avatar,
  Divider,
  Tooltip,
} from "@nextui-org/react";
import { CurrencyDollarIcon } from "@heroicons/react/24/solid";
import PlayerShares from "./PlayerShares";
import { trpc } from "@sectors/app/trpc";
import { notFound } from "next/navigation";
import { PlayerWithShares } from "@server/prisma/prisma.types";
import { Company } from "@server/prisma/prisma.client";
import {
  RiCurrencyFill,
  RiOpenArmFill,
  RiSafe2Fill,
  RiScales2Fill,
  RiScalesFill,
  RiWallet3Fill,
} from "@remixicon/react";
import PlayerAvatar from "./PlayerAvatar";
import { useGame } from "../Game/GameContext";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";
import { calculateNetWorth } from "@server/data/helpers";
import WalletInfo from "../Game/WalletInfo";

export interface StockAggregation {
  totalShares: number;
  totalValue: number;
  company?: Company;
}

const PlayersOverview = ({ gameId }: { gameId: string }) => {
  const { playersWithShares } = useGame();

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
            startContent={<PlayerAvatar player={playerWithShares} size="lg" />}
            title={playerWithShares.nickname}
            subtitle={
              <div className="flex gap-2">
                <Tooltip
                  className={tooltipStyle}
                  content={<p>Cash on hand.</p>}
                >
                  <span className="flex items-center content-center">
                    <WalletInfo player={playerWithShares} />
                  </span>
                </Tooltip>
                <Tooltip
                  className={tooltipStyle}
                  content={
                    <p>
                      Share value total: the total value of all shares owned.
                    </p>
                  }
                >
                  <span className="flex items-center content-center">
                    <RiCurrencyFill className="h-6 w-6" /> $
                    {calculateNetWorth(0, playerWithShares.Share)}
                  </span>
                </Tooltip>
                <Tooltip
                  className={tooltipStyle}
                  content={
                    <p>
                      Networth: The total value of all shares owned plus cash on
                      hand.
                    </p>
                  }
                >
                  <span className="flex items-center content-center">
                    <RiScalesFill className="h-6 w-6" /> $
                    {calculateNetWorth(
                      playerWithShares.cashOnHand,
                      playerWithShares.Share
                    )}
                  </span>
                </Tooltip>
                {playerWithShares.marginAccount > 0 && (
                  <Tooltip
                    className={tooltipStyle}
                    content={
                      <p>
                        Margin account balance. This balance is locked for short
                        orders until they are covered. It cannot be used for any
                        other purpose until then.
                      </p>
                    }
                  >
                    <span className="flex items-center content-center">
                      <RiSafe2Fill size={18} /> $
                      {playerWithShares.marginAccount}
                    </span>
                  </Tooltip>
                )}
              </div>
            }
          >
            <PlayerShares playerWithShares={playerWithShares} />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default PlayersOverview;
