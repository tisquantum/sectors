import { Divider, Tooltip } from "@nextui-org/react";
import {
  RiBox2Fill,
  RiExpandUpDownFill,
  RiHandCoinFill,
  RiIncreaseDecreaseFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiSparkling2Fill,
  RiWallet3Fill,
} from "@remixicon/react";
import { CompanyTierData } from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus } from "@server/prisma/prisma.client";
import { CompanyWithSector } from "@server/prisma/prisma.types";

const CompanyInfo = ({ company }: { company: CompanyWithSector }) => (
  <>
    <div className="flex flex-start gap-1 items-center justify-between">
      <div className="text-lg font-bold">
        {company.name} ${company.currentStockPrice}
      </div>
      <Divider orientation="vertical" className="" />
      <span>{company.status}</span>
    </div>
    <div className="flex">
        <span>{company.companyTier}</span>
    </div>
    <div className="flex gap-3">
      <Tooltip content="Unit Price of goods. Each consumer consumes one good per operating round given the company meets supply and demand.">
        <span className="flex items-center">
          <RiPriceTag3Fill size={20} /> ${company.unitPrice}
        </span>
      </Tooltip>
      <Tooltip content="Corporate treasury or cash on hand.">
        <span className="flex items-center">
          <RiWallet3Fill size={20} /> ${company.cashOnHand}
        </span>
      </Tooltip>
      <Tooltip content="Company status, inactive companies have not yet been floated.">
        <span
          className={`flex items-center ${
            company.status == CompanyStatus.ACTIVE
              ? "text-green-500"
              : company.status == CompanyStatus.INACTIVE
              ? "text-yellow-500"
              : "text-red-500"
          }`}
        >
          {(company.status == CompanyStatus.INACTIVE ||
            company.status == CompanyStatus.ACTIVE) && (
            <>
              <RiSailboatFill size={20} />{" "}
              {company.Sector.sharePercentageToFloat}%
            </>
          )}
        </span>
      </Tooltip>
    </div>
    <div className="flex gap-1 justify-start">
      <div
        className="flex flex-col px-2 rounded-md"
        style={{ backgroundColor: sectorColors[company.Sector.name] }}
      >
        <span>{company.Sector.name}</span>
        <Tooltip content="Base sector demand, every company in the sector receives this base bonus.">
          <div className="flex items-center">
            <RiHandCoinFill size={18} className="ml-2" />
            <span className="ml-1">{company.Sector.demand}</span>
          </div>
        </Tooltip>
      </div>
      <div className="grid grid-cols-3 items-center">
        <Tooltip content="Prestige tokens. While held, they prioritize the company for production. Can be spent for a bonus.">
          <div className="flex items-center">
            <RiSparkling2Fill className="ml-2 size-4 text-yellow-500" />
            <span className="ml-1">{company.prestigeTokens}</span>
          </div>
        </Tooltip>
        <Tooltip content="The companies demand score.  The maximum amount of customers that will visit your company before spending somewhere else.">
          <div className="flex items-center">
            <RiHandCoinFill size={18} className="ml-2" />
            <span className="ml-1">{company.demandScore}</span>
          </div>
        </Tooltip>
        <Tooltip content="The amount of goods the company produces per operating round.">
          <div className="flex items-center">
            <RiBox2Fill size={18} className="ml-2" />
            <span className="ml-1">{company.supplyMax}</span>
          </div>
        </Tooltip>
        <Tooltip content="Throughput. The base sector demand plus the companies demand minus it's supply. The closer to zero, the more efficient the company is operating.  Companies that score 0 receive a prestige bonus.">
          <div className="flex items-center">
            <RiIncreaseDecreaseFill size={18} className="ml-2" />
            <span className="ml-1">
              {company.demandScore + company.Sector.demand - company.supplyMax}
            </span>
          </div>
        </Tooltip>
        <Tooltip content="The cost to operate the company per operating round.  This cost is tied to your company tier.">
          <div className="flex items-center col-span-2">
            <RiExpandUpDownFill size={18} className="ml-2" />
            <span className="ml-1">
              ${CompanyTierData[company.companyTier].operatingCosts}
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  </>
);

export default CompanyInfo;
