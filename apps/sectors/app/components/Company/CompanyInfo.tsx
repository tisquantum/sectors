import { Accordion, AccordionItem, Divider, Tooltip } from "@nextui-org/react";
import {
  RiBankCard2Fill,
  RiBox2Fill,
  RiExpandUpDownFill,
  RiHandCoinFill,
  RiIncreaseDecreaseFill,
  RiPriceTag3Fill,
  RiSailboatFill,
  RiSparkling2Fill,
  RiTeamFill,
  RiWallet3Fill,
} from "@remixicon/react";
import {
  CompanyTierData,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
} from "@server/data/constants";
import { sectorColors } from "@server/data/gameData";
import { CompanyStatus, Share } from "@server/prisma/prisma.client";
import { CompanyWithSector } from "@server/prisma/prisma.types";
import { BarList } from "@tremor/react";

const buildBarChart = (share: Share[]) => {
  //group shares by location and sum the quantity
  const groupedShares = share.reduce((acc, share) => {
    if (!acc[share.location]) {
      acc[share.location] = 0;
    }
    acc[share.location] += 1;
    return acc;
  }, {} as Record<string, number>);
  //convert object to array
  return Object.entries(groupedShares).map(([location, quantity]) => ({
    name: location,
    value: quantity,
  }));
};

const CompanyMoreInfo = ({
  company,
  showingProductionResults,
}: {
  company: CompanyWithSector;
  showingProductionResults?: boolean;
}) => (
  <div className="flex gap-1 justify-start my-2">
    <div
      className="flex flex-col px-2 rounded-md"
      style={{ backgroundColor: sectorColors[company.Sector.name] }}
    >
      <span>{company.Sector.name}</span>
      <div className="flex items-center gap-1">
        <Tooltip content="Base sector demand, every company in the sector receives this base bonus.">
          <div className="flex items-center">
            <RiHandCoinFill size={18} className="ml-2" />
            <span className="ml-1">{company.Sector.demand}</span>
          </div>
        </Tooltip>
        <Tooltip content="The amount of consumers currently looking to buy in this sector.">
          <div className="flex items-center">
            <RiTeamFill size={18} className="ml-2" />
            <span className="ml-1">{company.Sector.consumers}</span>
          </div>
        </Tooltip>
      </div>
    </div>
    <div className="grid grid-cols-2 items-center">
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
          {showingProductionResults && (
            <span className="text-red-500"> -1</span>
          )}
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
          <div className="ml-1 flex">
            <span>
              {company.demandScore + company.Sector.demand - company.supplyMax}
            </span>
          </div>
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
      {company.hasLoan && (
        <Tooltip
          content={`This company has taken a loan.  The company must pay back the loan in interest at a fixed rate of $${
            LOAN_AMOUNT * LOAN_INTEREST_RATE
          } per turn.`}
        >
          <div className="flex items-center col-span-2">
            <RiBankCard2Fill size={18} className="ml-2" />
            <span className="ml-1">${LOAN_AMOUNT * LOAN_INTEREST_RATE}</span>
          </div>
        </Tooltip>
      )}
    </div>
  </div>
);

const CompanyInfo = ({
  company,
  showBarChart,
  showingProductionResults,
  isMinimal,
}: {
  company: CompanyWithSector;
  showBarChart?: boolean;
  showingProductionResults?: boolean;
  isMinimal?: boolean;
}) => (
  <>
    <div className="flex flex-row gap-1 items-center h-full">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-1">
          <div className="flex flex-start gap-1 items-center justify-between">
            <div className="flex gap-1 text-lg font-bold">
              <span>{company.name} </span>
            </div>
          </div>
          <div className="flex gap-1">
            <span>{company.stockSymbol}</span>
            <Tooltip content="The current stock price">
              <span>${company.currentStockPrice}</span>
            </Tooltip>
          </div>
          <div className="flex gap-1">
            <Tooltip content="The company tier, this determines the operational costs and supply.">
              <span>{company.companyTier}</span>
            </Tooltip>
            |
            <Tooltip content="The company status.  INACTIVE companies have not yet floated.">
              <span>{company.status}</span>
            </Tooltip>
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
        </div>
        {isMinimal ? (
          <Accordion>
            <AccordionItem
              key="more-info"
              aria-label="More Information"
              title="More Information"
            >
              <CompanyMoreInfo
                company={company}
                showingProductionResults={showingProductionResults}
              />
            </AccordionItem>
          </Accordion>
        ) : (
          <CompanyMoreInfo
            company={company}
            showingProductionResults={showingProductionResults}
          />
        )}
      </div>
      <div className="flex flex-col">
        {showBarChart && (
          <BarList
            data={buildBarChart(company.Share || [])}
            color="red"
            className="mx-auto max-w-sm px-2 w-32"
          />
        )}
      </div>
    </div>
  </>
);

export default CompanyInfo;
