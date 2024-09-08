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
import { getCompanyActionCost } from "@server/data/helpers";

const overviewRules = (
  <>
    <p>
      <strong>Sectors</strong> is a game of stocks and running companies. You
      play as an influential investor trying to make the most money through
      clever investments and company management. The winner of the game is the
      player with the greatest net worth at the end of the game.
    </p>
    <h3 className="font-semibold">End Game Condition</h3>
    <p>
      Sectors ends in one of two ways:
      <ul className="list-disc pl-5">
        <li>
          <strong>Bank Breaks:</strong> The bank <em>&quot;breaks&quot;</em> as
          it reaches or goes below 0. As soon as this happens, the remainder of
          the turn is played out and this is the last turn of the game.
        </li>
        <li>
          <strong>Total Turns Exceeded:</strong> If the game runs through its
          maximum turn length, the game ends on the final turn.
        </li>
      </ul>
    </p>
    <h3 className="font-semibold">Game Flow</h3>
    <p>
      The game is played over turns, each turn is separated into distinct
      rounds. The stock round has three sub-rounds. Each round has phases where
      players will either perform some action or observe the result of a
      phase&apos;s resolution.
    </p>
    <p>
      Each phase has a given amount of time before it will end and the next
      phase will begin. If the phase is actionable, players will have an
      opportunity, given they are eligible, to perform some action or set of
      actions. Actions conducted in sector phases are performed{" "}
      <strong>simultaneously</strong>. Players are never forced to place an
      action. If players do not act within the given timer, they are considered
      not to have acted in that phase.
    </p>
    <p>
      If a player is ready, they can elect to &quot;ready up&quot;, which will
      signal they have nothing else they wish to do or observe in the current
      phase. If all players of the game ready up, that phase is considered
      finished regardless of the time remaining in that phase.
    </p>
    <h3 className="font-semibold">Sections of the Game</h3>
    <ul className="list-disc pl-5">
      <li>
        <strong>Influence Round:</strong> This round only occurs once at the
        beginning of the game. It determines initial{" "}
        <strong>player priority</strong> order. Each player will, in secret,
        perform an influence bid. Each player starts with 100
        &quot;influence&quot; points. For each point the player does not spend
        on their influence bid, they will retain $1. Player priority is then
        determined in descending order of influence points spent on the bid. In
        the case of tied bids, priority order is determined randomly.
      </li>
      <li>
        <strong>Tranche Distribution:</strong> Tranche packages are made for
        offer every three turns. These are rewards which are distributed based
        on player ownership.
      </li>
      <li>
        <strong>Stock Round:</strong> Players place orders against companies
        through distinct order mechanisms.
      </li>
      <li>
        <strong>Operation Round:</strong> Players vote on company operations,
        and companies generate revenue by attracting customers.
      </li>
    </ul>
  </>
);

const newCompanyRules = (
  <>
    <h3 className="font-semibold">New Companies</h3>
    <p>
      Every third turn, a new company is opened in the sector with the highest
      average stock price across ACTIVE and INSOLVENT companies. If there are no
      ACTIVE or INSOLVENT companies in the game, no company is opened.
    </p>
  </>
);

const tranchRules = (
  <>
    <h3 className="font-semibold">Investor Tranches</h3>
    <p>
      In this round, players vote on the tranche they want to win. There are
      three types of rewards:
    </p>
    <ul className="list-disc pl-5">
      <li>Cash</li>
      <li>Prestige</li>
      <li>
        Passive Sector Effects:
        <ul className="list-disc pl-5">
          <li>
            Passive Sector Effects are given to one company in the sector.
          </li>
          <li>
            The effect will persist on this company until a passive effect is
            assigned to a different company in the same sector in a future
            tranche distribution phase.
          </li>
        </ul>
      </li>
    </ul>
    <p>
      Players vote on the tranche they want to win. If more than one player
      votes on the tranche, no one wins it and the tranche is not distributed.
      If all prize pools are won by a player, money is doubled in each prize
      pool. Placing a vote is not required.
    </p>
    <p>
      After voting, any player who receives a cash reward may distribute this
      reward amongst all players in the game in whatever way they see fit.
    </p>
  </>
);

const stockRoundRules = (
  <>
    <h3 className="font-semibold">Stock Rounds</h3>
    <p>
      <strong>The Stock Round</strong> is the first major section of each turn.
      Players take turns buying and selling shares of companies. The Stock Round
      is broken down into a number of <i>&quot;sub-rounds&quot;</i> where
      players can place one order in each round. The order is placed in the
      <strong>Place Stock Orders phase</strong>. Player orders are submitted
      simultaneously and in secret. Players have 4 distinct order mechanisms:
      Market Orders, Limit Orders, Short Orders, and Options Contracts.
    </p>
    <h4 className="font-semibold">Order Mechanisms</h4>
    <ul className="list-disc pl-5">
      <li>
        <strong>Market Orders:</strong> Buy or sell shares at the current market
        price. These are resolved first. If using bid priority, higher asking
        prices gain advantage. Market Orders are placed against the IPO or OPEN
        MARKET.
      </li>
      <li>
        <strong>Limit Orders:</strong> Trigger an order based on market price
        changes. A BUY limit order purchases stock when the price reaches a
        certain value. A SELL limit order sells stock when the price falls below
        a certain value. Limit Orders are placed against the OPEN MARKET. Limit
        Orders have limited actions available. If you have no limit order
        actions remaining, you cannot place another limit order until more
        actions become available. Limit order actions become available when a
        limit order has become FILLED.
      </li>
      <li>
        <strong>Short Orders:</strong> Borrow shares from the market and sell
        them immediately at the current market price.
        <ul className="list-disc pl-5">
          <li>
            The short order may be covered in a subsequent turn by purchasing
            the same quantity at the current market price.
          </li>
          <li>Short Orders are placed against the OPEN MARKET.</li>
          <li>
            Short orders have an ongoing interest borrow rate of 5% against the
            initial sale price. This rate is paid out from the player&apos;s
            cash on hand.
          </li>
          <li>Short order share dividends must be covered by the player.</li>
          <li>
            Short Orders have limited actions available. If you have no short
            order actions available, you cannot place another short order until
            more actions become available. Short order actions become available
            when a short order has been covered.
          </li>
        </ul>
      </li>
      <li>
        <strong>Options Contracts:</strong> Purchase the right to buy stock at a
        certain price by placing an OPTION CALL order.
        <ul className="list-disc pl-5">
          <li>These contracts are placed against the DERIVATIVES MARKET.</li>
          <li>
            The contract price is called the <i>&quot;premium&quot;</i>.
            Contracts have set premiums, shares, terms, and strike prices.
          </li>
          <li>
            Once an option contract&apos;s company share price has met or
            exceeded its strike price, the contract can be exercised.
          </li>
          <li>
            When a contract is exercised, players collect money calculated as{" "}
            <strong>
              the current share price minus the strike price, multiplied by the
              amount of shares inside the contract
            </strong>
            .
          </li>
          <li>
            After a contract is exercised, any step bonus on that contract is
            applied to the company&apos;s share price.
          </li>
          <li>
            If the contract is not exercised before it&apos;s term period
            expires, the premium investment is lost and the opportunity to
            exercise the contract is over.
          </li>
        </ul>
      </li>
    </ul>
    <h4 className="font-semibold">Share Locations</h4>
    <ul className="list-disc pl-5">
      <li>
        <strong>IPO:</strong> Initial Public Offering. The initial shares
        offered for purchase from the company. The purchase of these shares does
        not impact the stock market price.
      </li>
      <li>
        <strong>OPEN MARKET:</strong> Shares are purchased from the open market.
        Shares bought or sold in the open market impact the company&apos;s stock
        price. For each share sold, the stock price moves down 1 step. For each
        share bought, the stock price moves up one slot on the stock tier track.
        Different stock tiers require different amounts of slots to be filled
        before an order can move up in price.
      </li>
      <li>
        <strong>DERIVATIVES MARKET:</strong> Options contracts are purchased
        from the bank.
      </li>
    </ul>
    <h4 className="font-semibold">Market Order Resolution</h4>
    <ul className="list-disc pl-5">
      <li>Orders are resolved in ascending sub-round order.</li>
      <li>If there are multiple orders in the same sub-round:</li>
      <ul className="list-disc pl-5">
        <li>
          <strong>Bid Strategy:</strong>
          <ul className="list-disc pl-5">
            <li>
              Bids are resolved in descending bid ask price when using bid
              priority.
            </li>
            <li>
              In case of bid ties, the player with the highest player priority
              resolves first.
            </li>
          </ul>
        </li>
        <li>
          <strong>Priority Strategy:</strong>
          <ul className="list-disc pl-5">
            <li>Orders are resolved according to priority order.</li>
          </ul>
        </li>
      </ul>
      <li>
        Orders that cannot be filled due to lack of shares are marked as
        REJECTED.
      </li>
    </ul>
    <p>
      <strong>Market Order Price Stock Price Adjustments</strong>
    </p>
    <p>
      Given the net difference between BUYS and SELLS for market order
      quantities of a given company, that company&apos;s stock price will adjust
      steps down equivalent to the net negative or move up as many steps as it
      can fill &quot;price slots&quot; on the stock chart. Different stock tiers
      require different amounts of slots to be filled before an order can move
      up in price.
    </p>
    <h4 className="font-semibold">Stock Market Price Impact:</h4>
    <ul className="list-disc pl-5">
      <li>A SELL action moves the stock price down 1 step.</li>
      <li>A BUY action fills one slot in the current stock step.</li>
      <li>
        Different stock tiers require varying amounts of slots to be filled to
        move the stock price up a step.
      </li>
    </ul>
  </>
);

const OperatingRoundRules = () => (
  <>
    <h3 className="font-semibold">Operating Rounds</h3>
    <p>
      <strong>Operating Rounds</strong> are where companies run production and
      shareholders determine company actions.
    </p>
    <h4 className="font-semibold">Operating Round Priority Order</h4>
    <p>Companies operate in priority given a myriad of factors.</p>
    <CompanyPriorityList isRuleExplanation />
    <h4 className="font-semibold">Floating Companies</h4>
    <p>
      Each sector requires companies to sell some percentage of shares from its
      IPO before it is floated. Companies that are floated are eligible to
      operate. Companies eligible for operation conduct company actions during
      the company vote phase. Companies that are not floated may not have open
      market orders placed against them.
    </p>
    <h4 className="font-semibold">Throughput</h4>
    <p>Measures company efficiency.</p>
    <ul className="list-disc pl-5">
      <li>
        Calculated by subtracting the company demand score from its supply
        score.
      </li>
      <li>The closer to 0, the more efficient the company is operating.</li>
      <li>
        If a company reaches zero efficiency, it will have a 50% reduction in
        its operational costs that round.
      </li>
    </ul>
    <ThroughputLegend />
    <h4 className="font-semibold">Sales Bonus</h4>
    <p>
      Companies that sell all of their produced units of the operating round
      receive a prestige token.
    </p>
    <h4 className="font-semibold">Production</h4>
    <ul className="list-disc pl-5">
      <li>
        Revenue is determined by the lower of the company demand score and
        company supply.
      </li>
      <li>Unit price multiplied by this number gives the revenue.</li>
      <li>
        Companies can supply units only equivalent to the available customers in
        the sector.
      </li>
    </ul>
    <h4 className="font-semibold">Revenue Distribution Vote</h4>
    <p>
      Players will vote on how company revenue should be distributed. The vote
      is weighted based on share ownership. One of three options can be chosen:
      Full Dividends, Half Dividends, or Retain.
    </p>
    <h4 className="font-semibold">Revenue Distribution</h4>
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
    <h4 className="font-semibold">Stock Price Adjustment</h4>
    <p>
      The company&apos;s share price will be adjusted by one step by the total
      amount of revenue distributed to shareholders divided by its current stock
      price, rounded down. If, however, this price change would bring the
      company&apos;s stock price into a new stock tier, it stops at the
      beginning of that tier. For example, if a company has a stock price of $10
      and distributes $100 of revenue to shareholders, the stock price will move
      up 10 steps, but because the next stock tier starts at $21, this increase
      is halted at that price at the beginning of the new tier.
    </p>
    <CompanyTiers />
    <p>
      If the company elects to retain revenue, it automatically moves down 1
      step in stock price.
    </p>
  </>
);

export const insolvencyAndBankruptcy = (
  <>
    <h3 className="font-semibold">Insolvency and Bankruptcy</h3>
    <h4 className="font-semibold">Insolvency Contributions</h4>
    <p>
      Should the company fall to 0 dollars due to company actions or operational
      fees, the company will become INSOLVENT. The next time that company would
      operate, instead of the typical ACTIVE operating round actions, the
      company enters an INSOLVENCY action phase. All shareholders of the company
      can then contribute <strong>cash</strong> or <strong>shares</strong> to
      help the company avoid bankruptcy.
    </p>
    <ul className="list-disc pl-5">
      <li>
        All cash contributions are immediately given directly to the company
        treasury. All share contributions are immediately sold, and the cash
        profit is transferred to the company treasury.
      </li>
      <li>
        Shares handed over are sold at market rates. The share price of the
        company will move share price steps down equal to the net negative of
        all shares sold <strong>after</strong> the contribution action phase is
        completed. Therefore, every share sold during the insolvency phase will
        be equivalent to the share price of the company entering that phase.
      </li>
    </ul>
    <h4 className="font-semibold">Reactivating the Company</h4>
    <p>
      For the company to become <strong>active</strong> again, the total
      liquidity generated from contributions must meet or exceed the
      company&apos;s <strong>shortfall</strong> cash value for its tier.
    </p>
    <h4 className="font-semibold">Transparency of Contributions</h4>
    <p>
      All contributions made during insolvency are <strong>public</strong> and
      take effect <strong>immediately</strong> as soon as they are made.
    </p>
    <h4 className="font-semibold">
      If the Company Fails to Meet Its Shortfall
    </h4>
    <ul className="list-disc pl-5">
      <li>
        Following the opportunity for insolvency actions, the company will{" "}
        <strong>permanently close</strong> if it cannot meet or exceed its
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
    <h3 className="font-semibold">Prestige Tokens</h3>
    <p>
      <strong>Prestige Tokens</strong> can be spent on the prestige track to get
      various prestige rewards. They are used as part of the payment for the
      company&apos;s sector action. Prestige tokens are also factored as the
      second condition for company priority. The company with the higher
      prestige token count will have priority over the company with the lower
      prestige token count.
    </p>
  </>
);

const customerMovement = (
  <>
    <h3 className="font-semibold">Customer Movement</h3>
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
  const internalCompanyActions = companyActionsDescription.filter(
    (actionDescription) => {
      return actionDescription.actionType == "internal";
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
      <h3 className="font-semibold">Company Actions</h3>
      <p>
        Each Operating Round, companies will take turns in company priority
        order. On their turn, players will vote for a set of company actions to
        take place. The number of actions a company can take is directly tied to
        its current company tier. Actions are paid for with assets from the
        company treasury.
      </p>
      <h4 className="font-semibold">Action Cost</h4>
      <p>
        Some actions have a fixed price, while others have tiered costs. During
        an Operating Round, the first company to take a tiered action pays the
        lowest price, the next company pays the next tier, and all subsequent
        companies pay the highest price.
      </p>
      <h4 className="font-semibold">General Actions</h4>
      <p>
        These actions are available to every company every operating round
        action phase.
      </p>
      <ul className="list-disc pl-5 space-y-2">
        {generalCompanyActions.map((action, index) => (
          <li key={index} className="flex flex-col">
            <div className="font-semibold text-md">{action.title}</div>
            <div className="text-sm">{action.message}</div>
            <div className="text-sm">
              Cash Cost: ${getCompanyActionCost(action.name, 0)}
            </div>
          </li>
        ))}
      </ul>
      <ul className="list-disc pl-5 space-y-2">
        {internalCompanyActions.map((action, index) => (
          <li key={index} className="flex flex-col">
            <div className="font-semibold text-md">{action.title}</div>
            <div className="text-sm">{action.message}</div>
            <div className="text-sm">
              Cash Cost: ${getCompanyActionCost(action.name, 0)}
            </div>
          </li>
        ))}
      </ul>
      <h4 className="font-semibold">Active Sector Actions</h4>
      <p>
        These actions are specific to the company sector, and both cash and
        prestige must be used to pay for them.
      </p>
      <ul className="list-disc pl-5 space-y-2">
        {sectorCompanyActionsActive.map((action, index) => (
          <li key={index} className="flex flex-col">
            <div className="font-semibold text-md">{action.title}</div>
            <div className="text-sm">{action.message}</div>
            <div className="text-sm">
              Cash Cost: ${getCompanyActionCost(action.name, 0)}
            </div>
            <div className="text-sm">
              Prestige Cost: {CompanyActionPrestigeCosts[action.name]}
            </div>
          </li>
        ))}
      </ul>
      <h4 className="font-semibold">Passive Sector Abilities</h4>
      <p>
        These actions are specific to the company sector and are given out
        during the Tranches phase. Only one company in a sector may have a
        passive ability at a time.
      </p>
      <ul className="list-disc pl-5 space-y-2">
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

const companyRules = (
  <>
    <h2 id="companies">Companies</h2>
    <p>
      Companies are the vessel for financial investment in sectors. Investors
      will buy and sell stocks and place orders on the derivative market,
      placing bets against these companies&apos; performance. Companies will
      distribute revenue based on earnings during ORs. During ORs, companies
      will also get a chance to act. Both revenue distribution and company
      actions are voted on by shareholders of the company.
    </p>

    <h3 id="company-states">Company States</h3>
    <ul>
      <li>
        <strong>INACTIVE:</strong> This company has not yet floated. Its stock
        price will not move and it cannot act or gain revenue.
      </li>
      <li>
        <strong>ACTIVE:</strong> This company has floated and is operational.
      </li>
      <li>
        <strong>INSOLVENT:</strong> This company has floated and is operational.
        Its cash on hand has reached 0. If it does not receive financial
        support, it will go bankrupt.
      </li>
      <li>
        <strong>BANKRUPT:</strong> Bankrupted companies can no longer operate
        and are no longer available for player orders in the market.
      </li>
    </ul>

    <h3 id="company-priority">Company Priority</h3>
    <p>Company Priority is determined in this order of precedence:</p>
    <ol>
      <li>
        If a company has Economies of Scale, it is considered to be the cheapest
        company regardless of its unit price.
      </li>
      <li>
        Companies are sorted by unit price in ascending order (cheapest first).
      </li>
      <li>Companies are sorted by prestige tokens in descending order.</li>
      <li>Companies are sorted by demand score in descending order.</li>
    </ol>

    <h3 id="company-action-order">Company Action Order</h3>
    <p>
      Because certain company actions impact the company priority order, before
      the first company action phase, the company priority order is
      &quot;locked&quot; and this becomes the company action order for this
      turn. Actions that would adjust price, prestige, or gain any abilities to
      impact priority order do not impact the current turn&apos;s company action
      order.
    </p>
  </>
);
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
        {companyRules}
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
