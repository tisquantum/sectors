import { Tooltip } from "@nextui-org/react";
import { RiFundsFill, RiHandCoinFill, RiSailboatFill, RiTeamFill } from "@remixicon/react";
import { baseToolTipStyle, tooltipParagraphStyle, tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";
import { calculateAverageStockPrice } from "@server/data/helpers";
import { Sector } from "@server/prisma/prisma.client";
import { SectorWithCompanies } from "@server/prisma/prisma.types";

const SectorInfo = ({ sector }: { sector: SectorWithCompanies }) => (
  <div className="flex flex-col">
    <div className="flex items-center">
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            The base demand for this sector. Determines how many many customers
            will be &apos;spooled&apos; to sector during economy phase.
          </p>
        }
      >
        <div className="ml-2 text-small text-default-500 flex">
          <RiHandCoinFill size={18} className="mr-1" />{" "}
          {sector.demand + (sector.demandBonus || 0)}
        </div>
      </Tooltip>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            Share percentage required to float companies in this sector.
          </p>
        }
      >
        <div className="ml-2 text-small text-default-500 flex">
          <RiSailboatFill size={18} className="ml-2" />
          <span className="ml-1">{sector.sharePercentageToFloat}%</span>
        </div>
      </Tooltip>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            The consumers waiting to buy product from this sector.
          </p>
        }
      >
        <div className="ml-2 text-small text-default-500 flex">
          <RiTeamFill size={18} className="mr-1" /> {sector.consumers}
        </div>
      </Tooltip>
    </div>
    <div className="flex items-center gap-2">
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            Minimum|Maximum starting unit price for a company created in this
            sector.
          </p>
        }
      >
        <div className="text-small text-default-500 flex">
          <span>UNIT &nbsp;</span>
          <div className="text-small text-default-500 flex">
            {sector.unitPriceMin}
          </div>
          |
          <div className="text-small text-default-500 flex">
            {sector.unitPriceMax}
          </div>
        </div>
      </Tooltip>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            Minimum|Maximum starting ipo price for a company created in this
            sector.
          </p>
        }
      >
        <div className="text-small text-default-500 flex">
          <span>IPO &nbsp;</span>
          <div className="text-small text-default-500 flex">
            {sector.ipoMin}
          </div>
          |
          <div className="text-small text-default-500 flex">
            {sector.ipoMax}
          </div>
        </div>
      </Tooltip>
      <Tooltip
        classNames={{ base: baseToolTipStyle }}
        className={tooltipStyle}
        content={
          <p className={tooltipParagraphStyle}>
            Average stock price across all ACTIVE and INSOLVENT companies in the
            sector.
          </p>
        }
      >
        <div className="text-small text-default-500 flex">
          <RiFundsFill size={18} className="mr-1" />
          {calculateAverageStockPrice(sector.Company)}
        </div>
      </Tooltip>
    </div>
  </div>
);

export default SectorInfo;
