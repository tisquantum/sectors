import {
  Accordion,
  AccordionItem,
  Avatar,
  AvatarGroup,
  Badge,
  Divider,
} from "@nextui-org/react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";
import {
  Company,
  CompanyStatus,
  Share,
  ShareLocation,
} from "@server/prisma/prisma.client";
import {
  CompanyWithRelations,
  CompanyWithSector,
  ShareWithPlayer,
} from "@server/prisma/prisma.types";
import { share } from "@trpc/server/observable";
import ShareComponent from "./Share";
import {
  RiHandCoinFill,
  RiBox2Fill,
  RiSparkling2Fill,
  RiSwap3Fill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiUserFill,
  RiWallet3Fill,
} from "@remixicon/react";

type ShareGroupedByPlayer = {
  [key: string]: ShareWithPlayer[];
};

const CompaniesAccordion = ({
  companies,
}: {
  companies: CompanyWithRelations[];
}) => {
  return (
    <Accordion selectionMode="multiple">
      {companies.map((company: CompanyWithRelations) => {
        //sort company stock history in desc order
        company.StockHistory = company.StockHistory.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        //get last two prices and return bool true for positive or false for negative
        const isPriceUp = company.StockHistory.slice(-2).reduce(
          (acc, stock, index, array) => {
            if (index == array.length - 1) {
              return acc;
            }
            return stock.price > array[index + 1].price;
          },
          true
        );
        const trendIcon = isPriceUp ? (
          <ArrowUpIcon className="size-4 text-green-500" />
        ) : (
          <ArrowDownIcon className="size-4 text-red-500" />
        );
        const IPOShares =
          company.Share?.filter(
            (share: Share) => share.location == ShareLocation.IPO
          ).length || 0;
        const OMShares =
          company.Share?.filter(
            (share: Share) => share.location == ShareLocation.OPEN_MARKET
          ).length || 0;

        const renderPlayerShares = (
          shares: ShareWithPlayer[],
          limit?: number
        ) => {
          //group shares by player
          let sharesGroupedByPlayer: ShareGroupedByPlayer = shares.reduce(
            (acc, share) => {
              if (share.playerId) {
                if (acc[share.playerId]) {
                  acc[share.playerId].push(share);
                } else {
                  acc[share.playerId] = [share];
                }
              }
              return acc;
            },
            {} as ShareGroupedByPlayer
          );
          //sort by shares.length desc
          sharesGroupedByPlayer = Object.fromEntries(
            Object.entries(sharesGroupedByPlayer).sort(
              ([, a], [, b]) => b.length - a.length
            )
          );

          //apply limit
          if (limit) {
            sharesGroupedByPlayer = Object.fromEntries(
              Object.entries(sharesGroupedByPlayer).slice(0, limit)
            );
          }

          return Object.entries(sharesGroupedByPlayer).map(
            ([playerId, shares]) => (
              <ShareComponent
                key={playerId}
                name={shares[0].Player?.nickname || ""}
                quantity={shares.length}
              />
            )
          );
        };

        const renderPlayerSharesTotal = (shares: ShareWithPlayer[]) => {
          //subtract shares from open market and ipo
          const playerSharesTotal = shares.filter(
            (share) => share.location == ShareLocation.PLAYER
          ).length;
          return (
            <ShareComponent
              name="Player"
              icon={<RiUserFill className={"text-slate-800"} size={18} />}
              quantity={playerSharesTotal}
            />
          );
        };
        return (
          <AccordionItem
            key={company.id}
            aria-label={company.name}
            startContent={
              <div className="rounded-md">
                <span>{company.stockSymbol}</span>
                <div className="flex items-center">
                  {trendIcon}
                  <span className="ml-1">
                    ${company.currentStockPrice || 0}
                  </span>
                </div>
              </div>
            }
            subtitle={
              <div className="flex items-center mt-3">
                <div className="grid grid-cols-3 gap-2">
                  <ShareComponent name={"OM"} quantity={OMShares} />
                  <ShareComponent name={"IPO"} quantity={IPOShares} />
                  {renderPlayerSharesTotal(company.Share || [])}
                </div>
              </div>
            }
            title={
              <div className="flex gap-2">
                <div className="flex flex-col flex-start">
                  <span>{company.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="flex gap-1 items-center content-center">
                      <RiPriceTag3Fill size={18} /> ${company.unitPrice}
                    </span>
                    <span className="flex gap-1 items-center content-center">
                      <RiWallet3Fill size={18} /> ${company.cashOnHand}
                    </span>
                    <span>{company.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <div className="flex items-center">
                    <RiSparkling2Fill className="ml-2 size-4 text-yellow-500" />
                    <span className="ml-1">{company.prestigeTokens}</span>
                  </div>
                  <div className="flex items-center">
                    <RiHandCoinFill size={18} className="ml-2" />
                    <span className="ml-1">{company.demandScore}</span>
                  </div>
                  <div className="flex items-center">
                    <RiBox2Fill size={18} className="ml-2" />
                    <span className="ml-1">{company.supplyMax}</span>
                  </div>
                  <div className="flex items-center">
                    <RiSwap3Fill size={18} className="ml-2" />
                    <span className="ml-1">
                      {company.demandScore +
                        company.Sector.demand -
                        company.supplyMax}
                    </span>
                  </div>
                </div>
              </div>
            }
            isCompact
          >
            <div className="flex">
              <div className="flex flex-col">
                <span>General Information</span>
                <div className="p-2 grid grid-cols-2 gap-1">
                  <p>
                    <strong>Cash on Hand:</strong> ${company.cashOnHand || 0}
                  </p>
                  <p>
                    <strong>Supply:</strong> {company.supplyMax || 0}
                  </p>
                  <p>
                    <strong>Company Demand:</strong> {company.demandScore || 0}
                  </p>
                  <p>
                    <strong>Sector Demand:</strong> {company.Sector.demand || 0}
                  </p>
                  <p>
                    <strong>Demand Score:</strong>{" "}
                    {company.demandScore || 0 + company.Sector.demand || 0}
                  </p>
                  <p>
                    <strong>Throughput:</strong>{" "}
                    {company.demandScore ||
                      0 + company.Sector.demand ||
                      0 - company.supplyMax ||
                      0}
                  </p>
                  <p>
                    <strong>Insolvent:</strong>{" "}
                    {company.insolvent ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>IPO Price (Float Price):</strong> $
                    {company.ipoAndFloatPrice}
                  </p>
                  <p>
                    <strong>Unit Price:</strong> ${company.unitPrice}
                  </p>
                </div>
              </div>
              <Divider orientation="vertical" className="mx-2" />
              <div className="flex flex-col">
                <span>Shares</span>
                <div className="grid grid-cols-2 gap-2 p-2">
                  {OMShares > 0 && (
                    <ShareComponent name={"OM"} quantity={OMShares} />
                  )}
                  {IPOShares > 0 && (
                    <ShareComponent name={"IPO"} quantity={IPOShares} />
                  )}
                  {renderPlayerShares(company.Share || [])}
                </div>
              </div>
            </div>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default CompaniesAccordion;
