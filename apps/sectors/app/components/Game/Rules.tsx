"use client";

import { FC } from "react";
import ThroughputLegend from "./ThroughputLegend";
import CompanyTiers from "../Company/CompanyTiers";
import CompanyPriorityList from "../Company/CompanyPriorityOperatingRound";
import { useGame } from "./GameContext";
import { CompanyStatus } from "@server/prisma/prisma.client";
import { trpc } from "@sectors/app/trpc";
import {
  BANKRUPTCY_SHARE_PERCENTAGE_RETAINED,
  CompanyActionCosts,
  CompanyActionPrestigeCosts,
  companyActionsDescription,
} from "@server/data/constants";

const overviewRules = (
  <>
    <p>
      <strong>Sectors</strong> is a game of stocks and running companies. You
      play as an influential investor trying to make the most money through
      clever investments and company management. The winner of the game is the
      player with the greatest net worth by the time the bank{" "}
      <i>&quot;breaks&quot;</i> and reaches or goes below 0. The game is played
      over turns, each turn is separated into distinct sections.
    </p>
    <p>
      <strong>Sections of the Game:</strong>
      <ul className="list-disc pl-5">
        <li>
          <strong>Stock Round:</strong> Players take turns buying and selling
          shares of companies through distinct order mechanisms.
        </li>
        <li>
          <strong>Operation Round:</strong> Investors vote on company operations
          and companies generate revenue by attracting customers.
        </li>
      </ul>
    </p>
  </>
);

const newCompanyRules = (
  <>
    <p>
      <strong>New Companies</strong>
    </p>
    <p>
      Every third turn, a new company is opened in the sector with the highest
      average stock price across ACTIVE and INSOLVENT companies. If there are no
      ACTIVE or INSOLVENT companies in the game, no company is opened.
    </p>
  </>
);

const tranchRules = (
  <>
    <p>
      In this round, players vote on the tranch they want to win. There are
      three types of rewards:
    </p>
    <ul className="list-disc pl-5">
      <li>Cash</li>
      <li>Prestige</li>
      <li>
        Passive Sector Effects:
        <ul className="list-disc pl-5">
          <li>
            Passive Sector Effects are applied to all companies in the sector.
          </li>
          <li>
            These effects will persist on this company until a passive effect is
            assigned to a different company in the same sector.
          </li>
        </ul>
      </li>
    </ul>
    <p>
      Players vote on the tranch they want to win. If more than one player votes
      on the tranch, no one wins it and the tranch is not distributed. If all
      votes are distributed, money is doubled in each prize pool. Placing a vote
      is not required.
    </p>
    <p>
      After voting, any player who receives a cash reward may distribute this
      reward amongst all players in the game in whatever way they see fit.
    </p>
  </>
);
const stockRoundRules = (
  <>
    <p>
      <strong>The Stock Round</strong> is the first section of each turn.
      Players take turns buying and selling shares of companies. The Stock Round
      is broken down into a number of <i>&quot;sub-rounds&quot;</i> where
      players can place one order in each round. Players have 4 distinct order
      mechanisms: Market Orders, Limit Orders, Short Orders, and Options
      Contracts. Market Orders reset every round, while Limit and Short Orders
      are permanent until resolved.
    </p>
    <p>
      <strong>Share Locations</strong>
      <ul className="list-disc pl-5">
        <li>
          <strong>IPO:</strong> Initial Public Offering. Shares are purchased
          from the company.
        </li>
        <li>
          <strong>OPEN MARKET:</strong> Shares are purchased from the open
          market. Shares bought are sold in the open market impact the companies
          stock price. For each share sold, the stock price moves down 1 step.
          For each share bought, the stock price moves up 1 slot on the stock
          tier track. Different stock tiers require different amounts of slots
          to be filled before an order can move up in price.
        </li>
        <li>
          <strong>DERIVATIVES MARKET:</strong> Options contracts are purchased
          from the bank.
        </li>
      </ul>
    </p>
    <p>
      <strong>Order Mechanisms:</strong>
      <ul className="list-disc pl-5">
        <li>
          <strong>Market Orders:</strong> Buy or sell shares at the current
          market price. These are resolved first. If using bid priority, higher
          asking prices gain advantage. Market Orders are placed against the IPO
          or OPEN MARKET.
        </li>
        <li>
          <strong>Limit Orders:</strong> Trigger an order based on market price
          changes. A BUY limit order purchases stock when the price reaches a
          certain value. A SELL limit order sells stock when the price falls
          below a certain value. Limit Orders are placed against the OPEN
          MARKET.
        </li>
        <li>
          <strong>Short Orders:</strong> Borrow shares from the market and sell
          them immediately. Cover these shares in a subsequent turn by
          purchasing the same quantity at the current market price. Short Orders
          are placed against the OPEN MARKET. Short orders have an on-going
          interest borrow rate. Short order share dividends must be covered by
          the player.
        </li>
        <li>
          <strong>Options Contracts:</strong> Purchase the right to buy or sell
          stock at a certain price. These contracts are placed against the
          DERIVATIVES MARKET. The contract price is called the{" "}
          <i>&quot;premium&quot;</i>. Contracts have set premiums, shares,
          terms, and strike prices.
        </li>
      </ul>
    </p>
    <p>
      <strong>Prerequisites for a Short Order:</strong>
      <ul className="list-disc pl-5">
        <li>
          Players must have at least half the total value of the short order in
          cash to set aside for a <i>&quot;margin account&quot;</i>.
        </li>
        <li>
          The margin account locks these funds until the short order is covered.
          Funds cannot be used for any other purpose.
        </li>
        <li>
          Interest is paid every turn the short order is open, calculated as a
          percentage of the total value of the short order.
        </li>
      </ul>
    </p>
    <p>
      <strong>Market Order Resolution:</strong>
      <ul className="list-disc pl-5 space-y-2">
        <li>Orders placed in the earliest sub-round are resolved first.</li>

        <li>If there are multiple orders in the same sub-round:</li>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Bid Strategy:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Bids are resolved in descending order when using bid priority.
              </li>
              <li>
                In case of bid ties, the player with the highest priority
                resolves first.
              </li>
            </ul>
          </li>

          <li>
            <strong>Priority Strategy:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>Orders are resolved according to priority order.</li>
            </ul>
          </li>
        </ul>

        <li>
          Orders that cannot be filled due to lack of shares are marked as
          REJECTED.
        </li>
      </ul>

      <p className="space-y-2 my-2">
        <p>
          <strong>Market Order Price Stock Price Adjustments</strong>
        </p>
        <p>
          Given the net difference between BUYS and SELLS for market order
          quantities of a given company, that companies stock price will adjust
          steps down equivalent to the net negative or move up as many steps as
          it can fill &quot;price slots&quot; on the stock chart. Different
          stock tiers require different amounts of slots to be filled before an
          order can move up in price.
        </p>
      </p>
    </p>
    <p>
      <strong>Profits from Options Contracts:</strong> The profit is the
      difference between the current market price and the strike price,
      multiplied by the total shares in the contract. Should the price be equal
      to or less than the strike price, you will lose the premium paid for the
      contract.
    </p>
    <p>
      <strong>Stock Market Price Impact:</strong>
      <ul className="list-disc pl-5">
        <li>A SELL action moves the stock price down 1 step.</li>
        <li>A BUY action fills one slot in the current stock step.</li>
        <li>
          Different stock tiers require varying amounts of slots to be filled to
          move the stock price up a step.
        </li>
      </ul>
    </p>
  </>
);

const OperatingRoundRules = () => (
  <>
    <p>
      <strong>Operating Rounds</strong> are where companies run production and
      shareholders determine company actions.
    </p>
    <p>
      <strong>Operating Round Priority Order</strong>
      <p>Companies operate in priority given a myriad of factors.</p>
      <CompanyPriorityList isRuleExplanation />
    </p>
    <p>
      <strong>Floating Companies</strong>
      <p>
        Each sector requires companies to sell some percentage of shares from
        it&apos;s IPO before it is floated. Companies that are floated are
        eligible to operate. Companies eligible for operation conduct company
        actions during company vote phase. Companies that are not floated may
        not have open market orders placed against them.
      </p>
    </p>
    <p>
      <strong>Throughput:</strong> Measures company efficiency.
      <ul className="list-disc pl-5">
        <li>
          Calculated by subtracting company demand score from it&apos;s supply
          score.
        </li>
        <li>The closer to 0, the more efficient the company is operating.</li>
        <li>
          If a company reaches zero efficiency, it is awarded one increment
          forward in share price.
        </li>
      </ul>
      <ThroughputLegend />
    </p>
    <p>
      <strong>Sales Bonus:</strong> Companies who sell all of their produced
      units of the operating round receive a prestige token.
    </p>
    <p>
      <strong>Production:</strong> Calculates revenue and operational
      efficiency.
      <ul className="list-disc pl-5">
        <li>
          Revenue is determined by the lower of company demand score and company
          supply.
        </li>
        <li>Unit price multiplied by this number gives the revenue.</li>
        <li>
          Companies can supply units only equivalent to the available customers
          in the sector.
        </li>
      </ul>
    </p>
    <p>
      <strong>Revenue Distribution Vote</strong>
      <p>
        Players will vote on how company revenue should be distributed. The vote
        is weighted based on share ownership. One of three options can be
        chosen, Full Dividends, Half Dividends or Retain.
      </p>
    </p>
    <p>
      <strong>Revenue Distribution</strong>
      <ul className="list-disc pl-5">
        <li>
          <strong>Full Dividends:</strong> All revenue is distributed to
          shareholders.
        </li>
        <li>
          <strong>Half Dividends:</strong> Half of the revenue is distributed to
          shareholders. Half of the revenue is retained for the company.
        </li>
        <li>
          <strong>Retain:</strong> All revenue is retained by the company.
        </li>
      </ul>
    </p>
    <p>
      <strong>Stock Price Adjustment</strong>
      <p>
        The companies share price will be adjusted by one step by the total
        amount of revenue distributed to shareholders divided by it&apos;s
        current stock price, rounded down. If however this price change would
        bring the companies stock price into a new stock tier, it stops at the
        beginning of that tier. For example, if a company has a stock price of
        $10 and distributes $100 of revenue to shareholders, the stock price
        will move up 10 steps, but because the next stock tier starts at $21
        this increase is halted at that price in at the beginning of the new
        tier.
      </p>
      <CompanyTiers />
      <p>
        If the company elects to retain revenue, it automatically moves down 1
        step in stock price.
      </p>
    </p>
  </>
);

export const insolvencyAndBankruptcy = (
  <>
    <p>
      <strong>Insolvency Contributions:</strong>
    </p>
    <ul className="list-disc pl-5">
      <li>
        Should the company fall to 0 dollars due to company actions or
        operational fees, the company will become INSOLVENT. The next time that
        company would operate, instead of the typical ACTIVE operating round
        actions, the company enters an INSOLVENCY action phase. All shareholders
        of the company can then contribute <strong>cash</strong> or{" "}
        <strong>shares</strong> to help the company avoid bankruptcy.
        <ul className="list-disc pl-5">
          <li>
            All cash contributions are immediately given directly to the company
            treasury. All share contributions are immediately sold and the cash
            profit is transferd to the company treasury.
          </li>
          <li>
            Shares handed over are sold at market rates, the share price of the
            company will move share price steps down equal to the net negative
            of all shares sold <strong>after</strong> the contribution action
            phase is completed. Therefore, every share sold during the
            insolvency phase will be equivalent to the share price of the
            company entering that phase.
          </li>
        </ul>
      </li>
    </ul>

    <p>
      <strong>Reactivating the Company</strong>
    </p>
    <ul className="list-disc pl-5">
      <li>
        For the company to become <strong>active</strong> again, the total
        liquidity generated from contributions must meet or exceed the companies
        &nbsp;<strong>shortfall</strong> cash value for its tier.
      </li>
    </ul>
    <p>
      <strong>Transparency of Contributions:</strong>
    </p>
    <ul className="list-disc pl-5">
      <li>
        All contributions made during insolvency are <strong>public</strong> and
        take effect <strong>immediately</strong> as soon as they are made.
      </li>
    </ul>
    <p>
      <strong>If the Company Fails to Meet Its Shortfall:</strong>
    </p>
    <ul className="list-disc pl-5">
      <li>
        Following the opportunity for insolvency actions, the company will{" "}
        <strong>permanently close</strong> if it cannot meet or exceed it&apos;s
        shortfall cash value.
        <ul className="list-disc pl-5">
          <li>
            Players holding shares will receive{" "}
            <strong>{BANKRUPTCY_SHARE_PERCENTAGE_RETAINED}%</strong> of the
            market value for their shares.
          </li>
          <li>
            The company will be <strong>delisted</strong> from the stock market.
          </li>
          <li>The company will no longer be able to perform actions.</li>
          <li>
            The company will be removed from any considerations made in the
            stock sector.
          </li>
        </ul>
      </li>
    </ul>
  </>
);

const prestigeTokens = (
  <>
    <p>
      <strong>Prestige Tokens</strong> can be spent on the prestige track to get
      various prestige rewards. They are used as part of the payment for the
      companies sector action. Prestige tokens are also factored as the second
      condition for company priority. The company with the higher prestige token
      count will have priority over the company with the lower prestige token
      count.
    </p>
  </>
);

const customerMovement = (
  <>
    <p>
      Each stock sector has customers that move to it from the global consumer
      pool every turn, based on the sector&apos;s demand. Various events can
      also trigger customer movement to a sector.
    </p>
  </>
);

const CompanyActionsRules = () => {
  const generalCompanyActions = companyActionsDescription.filter(
    (actionDescription) => {
      return actionDescription.actionType == "general";
    }
  );
  const sectorCompanyActionsActive = companyActionsDescription.filter(
    (actionDescription) => {
      return actionDescription.actionType == "sector-active";
    }
  );
  const sectorCompanyActionsPassive = companyActionsDescription.filter(
    (actionDescription) => {
      return actionDescription.actionType == "sector-passive";
    }
  );
  return (
    <>
      <p>
        <strong>Company Actions</strong>
      </p>
      <p>
        Each Operating Round, companies will take turns in company priority
        order. On their turn, players will vote for a set of company actions to
        take place. The amount of actions a company can take is directly tied to
        it's current company tier. Actions are paid for with assets from the
        company treasury.
      </p>
      <p>
        <span className="space-y-2 font-bold">General Actions</span>
      </p>
      <p>
        These actions are available to every company every operating round
        action phase.
      </p>
      <ul className="list-disc space-y-2">
        {generalCompanyActions.map((action, index) => (
          <li key={index} className="flex flex-col">
            <div className="font-semibold text-md">{action.title}</div>
            <div className="text-sm">{action.message}</div>
            <div className="text-sm">
              Cash Cost: ${CompanyActionCosts[action.name]}
            </div>
          </li>
        ))}
      </ul>
      <p>
        <span className="space-y-2 font-bold">Active Sector Actions</span>
      </p>
      <p>
        These actions are specific to the company sector and both cash and
        prestige must be used to pay for them.
      </p>
      <ul className="list-disc space-y-2">
        {sectorCompanyActionsActive.map((action, index) => (
          <li key={index} className="flex flex-col">
            <div className="font-semibold text-md">{action.title}</div>
            <div className="text-sm">{action.message}</div>
            <div className="text-sm">
              Cash Cost: ${CompanyActionCosts[action.name]}
            </div>
            <div className="text-sm">
              Prestige Cost: {CompanyActionPrestigeCosts[action.name]}
            </div>
          </li>
        ))}
      </ul>
      <p>
        <span className="space-y-2 font-bold">Passive Sector Abilities</span>
      </p>
      <p>
        These actions are specific to the company sector and are given out
        during the Tranches phase. Only one company in a sector may have a
        passive ability at a time.
      </p>
      <ul className="list-disc space-y-2">
        {sectorCompanyActionsPassive.map((action, index) => (
          <li key={index} className="flex flex-col">
            <div className="font-semibold text-md">{action.title}</div>
            <div className="text-sm">{action.message}</div>
          </li>
        ))}
      </ul>
    </>
  );
};

const Rules: FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Overview</h2>
        <div className="text-base space-y-4">{overviewRules}</div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Stock Round Rules</h2>
        <div className="text-base space-y-4">{stockRoundRules}</div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Operating Round Rules</h2>
        <div className="text-base space-y-4">
          <OperatingRoundRules />
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Company Actions</h2>
        <div className="text-base space-y-4">
          <CompanyActionsRules />
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">New Companies</h2>
        <div className="text-base space-y-4">{newCompanyRules}</div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Investor Tranches</h2>
        <div className="text-base space-y-4">{tranchRules}</div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          Insolvency and Bankruptcy
        </h2>
        <div className="text-base space-y-4">{insolvencyAndBankruptcy}</div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Prestige Tokens</h2>
        <div className="text-base space-y-4">{prestigeTokens}</div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Customer Movement</h2>
        <div className="text-base space-y-4">{customerMovement}</div>
      </div>
    </div>
  );
};

export default Rules;
