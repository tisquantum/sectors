"use client";

import { FC } from "react";

const overviewRules = (
  <>
    <p>
      Sectors is a game of stocks and running companies. You play as an
      influential investor trying to make the most money through clever
      investments and company management. The winner of the game is the player
      with the greatest net worth by the time the bank &quot;breaks&quot; and
      reaches or goes below 0. The game is played over turns, each turn is
      separated into distinct sections.
    </p>
    <p>
      The first section is the Stock Round where players will take turns buying
      and selling shares of companies through distinct order mechanisms. The
      second section of each turn is the Operation Round where investors will
      meet to vote how companies will operate. Companies will also go through
      production where they will generate revenue through attracting customers.
    </p>
  </>
);

const stockRoundRules = (
  <>
    <p>
      The Stock Round is the first section of each turn. In this section,
      players will take turns buying and selling shares of companies. The Stock
      Round is broken down into a number of &quot;sub-rounds&quot; where players
      can place one order in each round. Players have 4 distinct order
      mechanisms to place orders: Market Orders, Limit Orders, Short Orders and
      Options Contracts. Market Orders, Limit Orders and Short Orders have
      limited amounts of actions that can be taken. Market Order actions reset
      every round, the other two are permanent until previously placed actions
      are resolved.
    </p>
    <p>
      Orders are placed to purchase shares in a company. Shares can be located
      in different places. Each company allocates shares in its initial offering
      as an &quot;IPO&quot; (Initial Private Offering). Shares purchased from
      the IPO start at the initial &quot;float rate&quot;. Shares that are
      issued or sold go to the Open Market. Shares in the open market start at
      the current market rate for the stock. These locations are collectively
      known as the spot market. The second market to purchase from is the
      derivatives market, where options contracts are exclusively sold. When the
      game is using the bid strategy, players can increase the &quot;ask
      price&quot; bid for Market or Short Orders to gain an advantage in
      purchase priority over other players.
    </p>
    <p>
      Market Orders are the simplest order mechanism. Players will buy or sell
      shares of companies at the current market price. Games using the bid
      priority strategy will let players making buy Orders input a higher asking
      price than the going market rate. Market Orders are also the
      &quot;fastest&quot; actions. They are resolved first amongst all orders
      placed. Market Orders are placed against the IPO or OPEN MARKET.
    </p>
    <p>
      Market Order resolution. Market orders are resolved in the following
      priority. Market orders placed in the earliest sub-round. If using bid
      priority strategy, the bids will be resolved in descending order. If there
      are still ties in the order resolution, the player with the highest
      priority will be resolved in descending priority order. Any orders that
      cannot be filled due to their being no remaining shares in the order
      location they are placed will be marked as REJECTED.
    </p>
    <p>
      Limit Orders allow the player to trigger an order in response to a shift
      in market price. A BUY limit order allows the player to purchase a stock
      when the market prices reaches or surpasses a certain value. Conversely, a
      sell Limit Order allows the player to sell a stock when the market price
      reaches or falls below a certain value. On buys, if the limit order
      triggers but there are no shares available from the open market, the order
      will be marked as REJECTED. Limit Orders are placed against the OPEN
      MARKET.
    </p>
    <p>
      Short Orders allow the player to &quot;borrow&quot; shares from a market
      and immediately see the profit from the current market price. On any
      subsequent turn the player may elect to &quot;cover&quot; those shares
      where the player must then purchase the quantity of the Short Order for
      its current market price. Short Orders are placed against the OPEN MARKET.
    </p>
    <p>
      Prerequisites for a short order: A player must have at least half the
      amount of the total value of the short order in cash on hand to set aside
      for a &quot;margin account&quot;. Upon opening the order, the margin
      account will take these funds and lock them until the short order is
      covered. Funds in a margin account cannot be used for any other purpose
      until the short order is covered. Additionally, the borrower charges an
      interest rate that is paid out every turn the short order is open. This
      interest rate is calculated as a percentage multiplied by the total value
      of the short order.
    </p>
    <p>
      Options Contracts allow players to purchase the right to buy or sell a
      stock at a certain price. Options Contracts are placed against the
      DERIVATIVES MARKET. The price of a contract is called the
      &quot;premium&quot;. All contracts will have set premiums and pre-defined
      allocations of shares, terms and strike prices. The term is the number of
      turns the options contract can be &quot;exercised&quot;. To exercise the
      contract is to take profit and FILL the order. The strike price is the
      minimum price that the contract can be exercised at. The shares are the
      total amount of shares inside the contract. Note that these shares do not
      impact the spot market in any way. However, options contracts that are
      exercised successfully will award a step bonus to the price of the stock.
      If the options contract is not exercised by the time the term is up, the
      contract will expire and the opportunity to exercise it is lost, the order
      is then REJECTED.
    </p>
    <p>
      Profits from Options Contracts: The profit from an options contract is
      equal to the difference between the current market price and the strike
      price multiplied by the total shares in the contract.
    </p>
    <p>
      Stock Market Price Impact: MARKET ORDERS, LIMIT ORDERS, and SHORT ORDERS
      will impact market price. In any scenario, a SELL will move the stock
      price down 1 step. One Share BUY will fill one slot in the current stock
      step. Depending on the stock tier, different amounts of slots will need to
      be filled to move the stock price up a step.
    </p>
  </>
);

const operatingRoundRules = (
  <>
    <p>
      Operating Rounds are where companies run production and shareholder
      meetings determine how the company will act.
    </p>
    <p>
      Production calculates how much revenue the company will generate and how
      efficient the company has operated. Revenue is calculated by taking the
      sum of sector demand and company demand and comparing it against its
      supply. The lowest of either of these numbers is the MAXIMUM amount of
      units that can be sold. The unit price is multiplied by this number to
      determine revenue. Additionally, the company will only be able to supply
      an amount of units equivalent to the number of customers available in that
      sector. Every customer wants 1 unit of the product.
    </p>
    <p>
      Throughput is the measure of a company&#39;s operating efficiency.
      Throughput is calculated by taking the supply and subtracting the total
      demand. The resulting number is throughput. The closer to 0 the throughput
      is, the more efficient the company is operating. A prestige token is
      awarded to companies operating at 0 to demonstrate their efficiency.
    </p>
  </>
);

const prestigeTokens = (
  <>
    <p>
      Prestige Tokens can be spent on the prestige track to get various rewards.
    </p>
  </>
);

const customerMovement = (
  <>
    <p>
      Each stock sector has a number of customers that move to it from the
      global consumer pool every turn. This number is based on the sector&#39;s
      demand. There are various other events that will trigger customers to move
      to a sector.
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
