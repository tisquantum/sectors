import { Divider, Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { Player, Share } from "@server/prisma/prisma.client";
import React from "react";
import PlayerAvatar from "../Player/PlayerAvatar";
import { RiFundsBoxLine, RiFundsFill } from "@remixicon/react";
import CompanyInfoV2 from "./CompanyV2/CompanyInfoV2";

const ShareComponent = ({
  name,
  companyId,
  quantity,
  icon,
  price,
  player,
}: {
  name: string;
  quantity: number;
  companyId?: string;
  icon?: React.ReactNode;
  price?: number;
  player?: Player;
}) => {
  return (
    <div className="flex items-center justify-between gap-2 bg-slate-200 shadow-lg rounded-lg px-1.5 py-0.5 whitespace-nowrap">
      <div className="flex items-center gap-1">
        {icon ? (
          icon
        ) : (
          <>
            {player && (
              <div>
                <PlayerAvatar player={player} size="sm" />
              </div>
            )}
            {!player && (
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <div className="text-md font-semibold text-slate-900">{name}</div>
                </PopoverTrigger>
                <PopoverContent>
                  {companyId && (
                    <CompanyInfoV2 companyId={companyId} />
                  )}
                </PopoverContent>
              </Popover>
            )}
            {player && (
              <div className="text-md font-semibold text-slate-900">{name}</div>
            )}
          </>
        )}
        {price && (
          <div className="flex items-center">
            <RiFundsFill size={18} className="text-slate-900"/>
            <div className="text-md font-semibold text-slate-900">
              ${price}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="border-l border-slate-900 h-4"></div>
        <div className="text-md font-bold text-violet-800">{quantity}</div>
      </div>
    </div>
  );
};

export default ShareComponent;
