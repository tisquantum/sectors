import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { RiFundsFill, RiHandCoinFill, RiSailboatFill, RiTeamFill, RiTimeLine } from "@remixicon/react";
import { tooltipParagraphStyle, tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";
import { calculateAverageStockPrice } from "@server/data/helpers";
import { SectorWithCompanies } from "@server/prisma/prisma.types";

// Helper function to calculate research stage from researchMarker
const getResearchStage = (researchMarker: number): number => {
  if (researchMarker >= 10) return 4;
  if (researchMarker >= 7) return 3;
  if (researchMarker >= 4) return 2;
  return 1;
};

// Helper function to get waiting area capacity based on research stage
const getWaitingAreaCapacity = (researchStage: number): number => {
  switch (researchStage) {
    case 1: return 3;
    case 2: return 5;
    case 3: return 7;
    case 4: return 10;
    default: return 3;
  }
};

const SectorInfo = ({ sector }: { sector: SectorWithCompanies }) => (
  <div className="flex flex-col">
    <div className="flex items-center">
      <Popover placement="top">
        <PopoverTrigger>
          <span className="ml-2 text-small text-default-500 inline-flex items-center cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <RiHandCoinFill size={18} className="mr-1" />{" "}
            {sector.demand + (sector.demandBonus || 0)}
          </span>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <p className={tooltipParagraphStyle}>
            Sector demand is based on brand score (from marketing) and research slot bonuses. Consumer distribution and worker salaries are determined by sector demand rankings (1st: 50% economy score, 2nd: 30%, 3rd: 20%).
          </p>
        </PopoverContent>
      </Popover>
      <Popover placement="top">
        <PopoverTrigger>
          <span className="ml-2 text-small text-default-500 inline-flex items-center cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <RiSailboatFill size={18} className="ml-2" />
            <span className="ml-1">{sector.sharePercentageToFloat}%</span>
          </span>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <p className={tooltipParagraphStyle}>
            Share percentage required to float companies in this sector.
          </p>
        </PopoverContent>
      </Popover>
      <Popover placement="top">
        <PopoverTrigger>
          <span className="ml-2 text-small text-default-500 inline-flex items-center cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <RiTeamFill size={18} className="mr-1" /> {sector.consumers}
          </span>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <p className={tooltipParagraphStyle}>
            The consumers waiting to buy product from this sector.
          </p>
        </PopoverContent>
      </Popover>
      <Popover placement="top">
        <PopoverTrigger>
          <span className="ml-2 text-small text-default-500 inline-flex items-center cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <RiTimeLine size={18} className="mr-1" />{" "}
            {sector.waitingArea || 0}/
            {getWaitingAreaCapacity(getResearchStage(sector.researchMarker || 0))}
          </span>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <div className={tooltipParagraphStyle}>
            <p className="mb-2">
              <strong>Waiting Area:</strong> Consumers who couldn&apos;t be served by factories are placed here.
            </p>
            <p className="mb-2">
              <strong>Capacity:</strong> Based on research stage (Stage 1: 3, Stage 2: 5, Stage 3: 7, Stage 4: 10)
            </p>
            <p className="mb-2">
              <strong>If capacity not exceeded:</strong> Consumers stay and their markers return to the draw bag for next turn.
            </p>
            <p>
              <strong>If capacity exceeded:</strong> All waiting consumers return to global pool and sector loses 1 demand permanently.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
    <div className="flex items-center gap-2">
      <Popover placement="top">
        <PopoverTrigger>
          <span className="text-small text-default-500 inline-flex items-center cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <span>UNIT &nbsp;</span>
            <span className="text-small text-default-500 inline-flex">
              {sector.unitPriceMin}
            </span>
            |
            <span className="text-small text-default-500 inline-flex">
              {sector.unitPriceMax}
            </span>
          </span>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <p className={tooltipParagraphStyle}>
            Minimum|Maximum starting unit price for a company created in this
            sector.
          </p>
        </PopoverContent>
      </Popover>
      <Popover placement="top">
        <PopoverTrigger>
          <span className="text-small text-default-500 inline-flex items-center cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <span>IPO &nbsp;</span>
            <span className="text-small text-default-500 inline-flex">
              {sector.ipoMin}
            </span>
            |
            <span className="text-small text-default-500 inline-flex">
              {sector.ipoMax}
            </span>
          </span>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <p className={tooltipParagraphStyle}>
            Minimum|Maximum starting ipo price for a company created in this
            sector.
          </p>
        </PopoverContent>
      </Popover>
      <Popover placement="top">
        <PopoverTrigger>
          <span className="text-small text-default-500 inline-flex items-center cursor-pointer rounded-sm outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <RiFundsFill size={18} className="mr-1" />
            {calculateAverageStockPrice(sector.Company)}
          </span>
        </PopoverTrigger>
        <PopoverContent className={tooltipStyle}>
          <p className={tooltipParagraphStyle}>
            Average stock price across all ACTIVE and INSOLVENT companies in the
            sector.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  </div>
);

export default SectorInfo;
