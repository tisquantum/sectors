import {
  RiArrowUpCircleFill,
  RiCalendar2Fill,
  RiCalendarScheduleFill,
  RiPriceTag2Fill,
  RiStrikethrough,
  RiTeamFill,
} from "@remixicon/react";
import ShareComponent from "../Company/Share";
import { tooltipStyle } from "@sectors/app/helpers/tailwind.helpers";
import { Tooltip } from "@nextui-org/react";
import { Company, OptionContract } from "@server/prisma/prisma.client";

export const OptionContractMinimal = ({
  contract,
}: {
  contract: OptionContract & { Company: Company };
}) => {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-md bg-slate-700">
      <div className="flex gap-1">
        <div className="flex items-center gap-1">
          {contract.Company.stockSymbol}
        </div>
        <div className="flex items-center bg-primary p-1 rounded-md">
          <span>{contract.contractState}</span>
        </div>
      </div>
      <div className="flex gap-3 text-gray-200 justify-between text-xl">
        <Tooltip
          className={tooltipStyle}
          content={<p>Premium: The price of the options contract.</p>}
        >
          <div className="flex gap-1 justify-center items-center">
            <RiPriceTag2Fill /> ${contract.premium}
          </div>
        </Tooltip>
        <Tooltip
          className={tooltipStyle}
          content={
            <p>
              Strike Price: The price at which the options contract can be
              exercised
            </p>
          }
        >
          <div className="flex gap-1 justify-center items-center">
            <RiStrikethrough />${contract.strikePrice}
          </div>
        </Tooltip>
        <Tooltip
          className={tooltipStyle}
          content={
            <p>Term: The number of turns the options contract is valid for</p>
          }
        >
          <div className="flex gap-1 justify-center items-center">
            <RiCalendarScheduleFill />
            {contract.term}
          </div>
        </Tooltip>
        {contract.currentTerm > 0 && (
          <Tooltip
            className={tooltipStyle}
            content={
              <p>
                Current Term: The number of turns the options contract has been
                active for
              </p>
            }
          >
            <div className="flex gap-1 justify-center items-center">
              <RiCalendar2Fill />
              {contract.currentTerm}
            </div>
          </Tooltip>
        )}
        <Tooltip
          className={tooltipStyle}
          content={
            <p>
              Step Bonus: The amount the stock price will increase should the
              option be exercised.
            </p>
          }
        >
          <div className="flex gap-1 justify-center items-center">
            <RiArrowUpCircleFill /> {contract.stepBonus}
          </div>
        </Tooltip>
        <Tooltip
          className={tooltipStyle}
          content={
            <p>
              Shares: The number of shares the option contract represents. Note
              that shares in the derivative market have no impact on the
              calculations made for spot market.
            </p>
          }
        >
          <div>
            <ShareComponent
              name={contract.Company.stockSymbol}
              quantity={contract.shareCount}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
