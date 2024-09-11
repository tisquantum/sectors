import {
  RiArrowUpCircleFill,
  RiCalendar2Fill,
  RiCalendarScheduleFill,
  RiCurrencyFill,
  RiFundsFill,
  RiPriceTag2Fill,
  RiStrikethrough,
  RiTeamFill,
} from "@remixicon/react";
import ShareComponent from "../Company/Share";
import {
  baseToolTipStyle,
  tooltipParagraphStyle,
  tooltipStyle,
} from "@sectors/app/helpers/tailwind.helpers";
import { Tooltip } from "@nextui-org/react";
import { Company, OptionContract } from "@server/prisma/prisma.client";

export const OptionContractMinimal = ({
  contract,
}: {
  contract: OptionContract & { Company: Company };
}) => {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-md bg-slate-700">
      <div className="flex flex-wrap gap-1 items-center">
        <div>
          <span>{contract.Company.name}</span>
        </div>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
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
        <div className="flex items-center gap-1">
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>The current stock price</p>
            }
          >
            <div className="flex items-center">
              <RiFundsFill size={20} />
              <span>${contract.Company.currentStockPrice}</span>
            </div>
          </Tooltip>
        </div>
        <div className="flex items-center bg-primary p-1 rounded-md">
          <span>{contract.contractState}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-gray-200 justify-between text-xl">
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              Premium: The price of the options contract.
            </p>
          }
        >
          <div className="flex gap-1 justify-center items-center">
            <RiPriceTag2Fill /> ${contract.premium}
          </div>
        </Tooltip>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
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
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              Term: The number of turns the options contract is valid for
            </p>
          }
        >
          <div className="flex gap-1 justify-center items-center">
            <RiCalendarScheduleFill />
            {contract.term}
          </div>
        </Tooltip>
        {contract.currentTerm > 0 && (
          <Tooltip
            classNames={{ base: baseToolTipStyle }}
            className={tooltipStyle}
            content={
              <p className={tooltipParagraphStyle}>
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
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              Shares In Contract: The number of shares the options contract.
              When the contract is exercised, the profits you receive is the
              difference between the current market price and the strike price,
              multiplied by the shares in the contract.
            </p>
          }
        >
          <div className="flex gap-1 justify-center items-center">
            <RiCurrencyFill />
            {contract.shareCount}
          </div>
        </Tooltip>
        <Tooltip
          classNames={{ base: baseToolTipStyle }}
          className={tooltipStyle}
          content={
            <p className={tooltipParagraphStyle}>
              Step Bonus: The amount the stock price will increase should the
              option be exercised.
            </p>
          }
        >
          <div className="flex gap-1 justify-center items-center">
            <RiArrowUpCircleFill /> {contract.stepBonus}
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
