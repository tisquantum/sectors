import {
  Accordion,
  AccordionItem,
  Avatar,
  AvatarGroup,
  Badge,
} from "@nextui-org/react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";
import { Company, Share, ShareLocation } from "@server/prisma/prisma.client";
import {
  CompanyWithSector,
  ShareWithPlayer,
} from "@server/prisma/prisma.types";
import { share } from "@trpc/server/observable";

type ShareGroupedByPlayer = {
  [key: string]: ShareWithPlayer[];
};

const CompaniesAccordion = ({
  companies,
}: {
  companies: CompanyWithSector[];
}) => {
  return (
    <Accordion selectionMode="multiple">
      {companies.map((company: CompanyWithSector) => {
        const isPriceUp = (company.currentStockPrice || 0) > 0; //company.previousStockPrice;
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

        const renderPlayerShares = (shares: ShareWithPlayer[]) => {
          //group shares by player
          const sharesGroupedByPlayer: ShareGroupedByPlayer = shares.reduce(
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
          return Object.entries(sharesGroupedByPlayer).map(
            ([playerId, shares]) => (
              <Badge key={playerId} content={shares.length} color="default">
                <Avatar name={shares[0].Player?.nickname || ""} />
              </Badge>
            )
          );
        };
        return (
          <AccordionItem
            key={company.id}
            aria-label={company.name}
            startContent={
              <Avatar
                isBordered
                color="primary"
                radius="lg"
                name={company.name}
              />
            }
            subtitle={
              <div className="flex items-center mt-3">
                <AvatarGroup isGrid className="ml-4" max={3}>
                  {OMShares > 0 && (
                    <Badge content={OMShares} color="default">
                      <Avatar name="OM" />
                    </Badge>
                  )}
                  {IPOShares > 0 && (
                    <Badge content={IPOShares} color="default">
                      <Avatar name="IPO" />
                    </Badge>
                  )}
                  {renderPlayerShares(company.Share || [])}
                </AvatarGroup>
              </div>
            }
            title={
              <div className="flex gap-2">
                <span>{company.name}</span>
                <div className="flex items-center">
                  {trendIcon}
                  <span className="ml-1">
                    ${company.currentStockPrice || 0}
                  </span>
                </div>
                <div className="flex items-center">
                  <BoltIcon className="ml-2 size-4 text-yellow-500" />
                  <span className="ml-1">5</span>
                </div>
              </div>
            }
            isCompact
          >
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
                <strong>Demand Score:</strong> {company.demandScore || 0 + company.Sector.demand || 0}
              </p>
              <p>
                <strong>Throughput:</strong> {company.demandScore || 0 + company.Sector.demand || 0 - company.supplyMax || 0}
              </p>
              <p>
                <strong>Insolvent:</strong> {company.insolvent ? "Yes" : "No"}
              </p>
              <p>
                <strong>IPO Price (Float Price):</strong> $
                {company.ipoAndFloatPrice}
              </p>
            </div>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default CompaniesAccordion;
