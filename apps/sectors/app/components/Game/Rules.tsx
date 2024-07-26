"use client";

import { FC } from "react";

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
          are placed against the OPEN MARKET.
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
      <ul className="list-disc pl-5">
        <li>Orders placed in the earliest sub-round are resolved first.</li>
        <li>If using bid priority, bids are resolved in descending order.</li>
        <li>
          In case of ties, the player with the highest priority resolves first.
        </li>
        <li>
          Orders that cannot be filled due to lack of shares are marked as
          REJECTED.
        </li>
      </ul>
    </p>
    <p>
      <strong>Profits from Options Contracts:</strong> The profit is the
      difference between the current market price and the strike price,
      multiplied by the total shares in the contract.
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

const operatingRoundRules = (
  <>
    <p>
      <strong>Operating Rounds</strong> are where companies run production and
      shareholders determine company actions.
    </p>
    <p>
      <strong>Production:</strong> Calculates revenue and operational
      efficiency.
      <ul className="list-disc pl-5">
        <li>
          Revenue is determined by the lower of sector demand and company
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
      <strong>Throughput:</strong> Measures company efficiency.
      <ul className="list-disc pl-5">
        <li>Calculated by subtracting total demand from supply.</li>
        <li>The closer to 0, the more efficient the company is operating.</li>
      </ul>
    </p>
    <p>
      <strong>Sales Bonus:</strong> Companies who sell all of their produced
      units of the operating round receive a prestige token.
    </p>
  </>
);

const prestigeTokens = (
  <>
    <p>
      <strong>Prestige Tokens</strong> can be spent on the prestige track to get
      various rewards.
    </p>
  </>
);

const customerMovement = (
  <>
    <p>
      Each stock sector has customers that move to it from the global consumer
      pool every turn, based on the sector&apos;s demand. Various events can trigger
      customer movement to a sector.
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
        <div className="text-base space-y-4">{operatingRoundRules}</div>
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
