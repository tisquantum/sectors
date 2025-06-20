"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sectors/app/components/shadcn/card";
import { FactorySlots } from "./Tableau/FactorySlots";
import { MarketingSlots } from "./Tableau/MarketingSlots";
import { trpc } from "@sectors/app/trpc";
import {
  RiPriceTag3Fill,
  RiSparkling2Fill,
  RiWallet3Fill,
} from "@remixicon/react";
import { Tooltip } from "@nextui-org/react";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";

interface ModernCompanyProps {
  companyId: string;
  gameId: string;
  currentPhase: number;
  unitPrice: number;
  brandScore: number;
}

export function ModernCompany({
  companyId,
  gameId,
  currentPhase,
  unitPrice,
  brandScore,
}: ModernCompanyProps) {
  const { data: company } = trpc.company.getCompanyWithSector.useQuery({
    id: companyId,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Tooltip
              classNames={{ base: baseToolTipStyle }}
              className={tooltipStyle}
              content={
                <p className={tooltipParagraphStyle}>
                  Unit Price of goods. Each consumer consumes one good per
                  operating round given the company meets supply and demand.
                </p>
              }
            >
              <div className="flex items-center gap-1">
                <RiPriceTag3Fill size={20} />
                <span>${unitPrice}</span>
              </div>
            </Tooltip>

            <Tooltip
              classNames={{ base: baseToolTipStyle }}
              className={tooltipStyle}
              content={
                <p className={tooltipParagraphStyle}>
                  Brand Score affects customer attraction and can be increased
                  through marketing campaigns.
                </p>
              }
            >
              <div className="flex items-center gap-1">
                <RiSparkling2Fill size={20} className="text-yellow-500" />
                <span>{brandScore}</span>
              </div>
            </Tooltip>

            <Tooltip
              classNames={{ base: baseToolTipStyle }}
              className={tooltipStyle}
              content={
                <p className={tooltipParagraphStyle}>
                  Corporate treasury or cash on hand.
                </p>
              }
            >
              <div className="flex items-center gap-1">
                <RiWallet3Fill size={20} />
                <span>${company?.cashOnHand || 0}</span>
              </div>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Factories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <FactorySlots
                companyId={companyId}
                gameId={gameId}
                currentPhase={currentPhase}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <MarketingSlots
                companyId={companyId}
                gameId={gameId}
                currentPhase={currentPhase}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
