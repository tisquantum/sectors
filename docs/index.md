# Rules Overview
{: #rules-overview }

**Sectors** is a game of stocks and running companies. You play as an influential investor trying to make the most money through clever investments and company management.

### End Game Condition
{: #end-game-condition }

Sectors ends in one of two ways: 
- **Bank Breaks:** The bank *"breaks"* as it reaches or goes below 0. As soon as this happens, the remainder of the turn is played out and this is the last turn of the game.
- **Total Turns Exceeded:** If the game runs through its maximum turn length, the game ends on the final turn.

### Win Condition
{: #win-condition }

At the end of the game, the player with the highest **net worth** is the winner. The **net worth** of a player is determined by adding the cash on hand and the value of all their shares.  The value of a share is equal to the stock price of it's associated company.

### Game Flow
{: #game-flow }

The game is played over turns, each turn is separated into distinct rounds. The stock round has three sub-rounds. Each round has phases where players will either perform some action or observe the result of a phase's resolution.

Each phase has a given amount of time before it will end and the next phase will begin. If the phase is actionable, players will have an opportunity, given they are eligible, to perform some action or set of actions. Actions conducted in sector phases are performed **simultaneously**. Players are never forced to place an action. If players do not act within the given timer, they are considered not to have acted in that phase.

If a player is ready, they can elect to "ready up," which will signal they have nothing else they wish to do or observe in the current phase. If all players of the game ready up, that phase is considered ended regardless of the time remaining in that phase.

### Sections of the Game
{: #sections-of-the-game }

- **Influence Round:** This round only occurs once at the beginning of the game. It determines initial **player priority** order. Each player will, in secret, perform an influence bid. Each player starts with 50 "influence" points. For each point the player does not spend on their influence bid, they will retain $1. Player priority is then determined in descending order of influence points spent on the bid. In the case of tied bids, priority order is determined randomly.
- **Tranche Distribution:** Tranche packages are made for offer every three turns. These are rewards which are distributed based on player ownership.
- **Headline Phase:** From the second turn onwards, players will be able to influence the **sector priority** order by paying to influence media headlines which impact the sentiment of a sector.  If more than one player pays for a headline, the cost is split evenly, rounded down. 
- **Stock Round:** Players invest in companies through distinct order mechanisms.
- **Operation Round:** Players vote on company operations, and companies generate revenue by attracting customers.
- **End Turn Upkeep:** Players will pax taxes and divest accordingly.  Sectors will receive customers.

## Players
{: #players }

**Players** take the role of investors. The goal of every player is to earn as much capital as possible through cash on hand and ownership of shares.

As **investors**, players will have agency to place orders in the **spot market** and **derivatives market** to buy or sell against companies in the game. As **shareholders**, players will have agency to place votes for a company as to how it will distribute revenue and act during an operating round. Players will also have agency in selecting **tranche** packages and influencing the media narrative with **headlines** in the game.

### Player Priority
{: #player-priority }

Player priority determines how any ties are resolved in relation to the player. A player who has a lower priority number is considered to have higher priority. For example, a player priority of 2 is prioritized ahead of a player priority of 5.

## Stock Rounds
{: #stock-rounds }

**The Stock Round** is the first major section of each turn and provides the mechanisms for players to build their stock portfolio and earn (or lose!) money in investments. The Stock Round is broken down into a number of *"sub-rounds"* where players can place one order in each round.  These sub-rounds continue until no players place an order in a given round. The order is placed in the "Place Stock Orders" phase. Player orders are submitted simultaneously and in secret. Players have 4 distinct order mechanisms: Market Orders, Limit Orders, Short Orders, and Options Contracts.

### Order Mechanisms
{: #order-mechanisms }

*Note: Unless otherwise stated, a player may elect to place an order for any amount of shares when it comes to making an order, regardless if they have the cash on hand to do so.  Only until the action is **resolved** will the bank look into the players cash on hand.*

**Market Orders** 
Buy or sell shares at the current market price. Market Orders are resolved immediately proceeding stock action phases. Market Orders are placed against the IPO or OPEN MARKET.

**Limit Orders** 
Trigger an order based on market price changes. A BUY limit order purchases stock when the price reaches a certain value. A SELL limit order sells stock when the price falls below a certain value. Limit Orders are placed against the OPEN MARKET. Limit Orders have limited actions available. If you have no limit order actions remaining, you cannot place another limit order until more actions become available. Limit order actions become available when a limit order has become FILLED.

### Triggering Limit Orders
{: #triggering-limit-orders }

- Any time a limit order is triggered, its status will be moved to FILLED_PENDING_SETTLEMENT. A limit order is considered triggered if at any time its value falls between the threshold, inclusive, of the company's new stock price and previous stock price.
- The limit order is not FILLED until the "Resolve Limit Orders" phase.

**Short Orders** 
Borrow shares from the market and sell them immediately at the current market price. 

### Prerequisites for a Short Order
{: #prerequisites-for-a-short-order }

- Players must have at least half the total value of the short order in cash to set aside for a *"margin account"*.
- The margin account locks these funds until the short order is covered. These funds cannot be used for any other purpose. These funds are released once the short order is covered.
- Interest is paid every turn the short order is open, calculated as a percentage of the total value of the short order.

### Placing and Covering Short Orders 

  - The short order may be covered in a subsequent turn by purchasing the same quantity at the current market price. 
  - Short Orders are placed against the OPEN MARKET. 
  - Short orders have an ongoing interest borrow rate on 5% against the intial sale price.  This rate is paid out from the players cash on hand 
  - Short order share dividends must be covered by the player.   
  - Short Orders have limited actions available. If you have no short order actions available, you cannot place another short order until more actions become available. Short order actions become available when a short order has been covered.

**Options Contracts:** Purchase the right to buy stock at a certain price by placing an OPTION CALL order. 
  - These contracts are placed against the DERIVATIVES MARKET. The contract price is called the *"premium"*. Contracts have set premiums, shares, terms, and strike prices.
  - Once an option contract's company share price has met or exceeded it's strike price, the contract may be exercised.
  - When a contract is exercised, players collect money that is covered in *Profits from Options Contracts*
  - After a contract is exercised, any step bonus on that contract is applied to the company's share price.
  - If the contract is not exercised before it's term period expires, the premium investment is lost and the opportunity to exercise the contract is over.

**Profits from Options Contracts:** The profit is the **the current stock price minus the strike price, multiplied by the amount of shares inside the contract**. Should the price be equal to or less than the strike price, you will lose the premium paid for the contract.

### Share Locations
{: #share-locations }

- **IPO:** Initial Public Offering. The initial shares offered for purchase from the company. The purchase of these shares does not impact the stock market price.
- **OPEN MARKET:** Shares are purchased from the open market. Shares bought or sold in the open market impact the company's stock price. For each share sold, the stock price moves down 1 step. For each share bought, the stock price moves up one slot on the stock tier track. Different stock tiers require different amounts of slots to be filled before an order can move up in price.
- **DERIVATIVES MARKET:** Options contracts are purchased from the bank.

### Market Order Resolution
{: #market-order-resolution }

- Orders are resolved in ascending sub-round order.
- If there are multiple orders in the same sub-round, we defer to the **Distribution Strategy**:
  - **Bid Strategy:**
    - Bids are resolved in descending bid ask price when using bid priority.
    - In case of bid ties, the player with the highest **player priority** resolves first.
  - **Priority Strategy:**
    - Orders are resolved according to **player priority** order.
- Orders that cannot be filled due to lack of shares or insufficient player cash on hand are marked as REJECTED.

**Stock Market Price Impact:**

- A SELL action gives minus one to the net difference for stock price adjustments for the company.
- A BUY action gives plus one to thenet difference for stock price adjustments for the company.

**Market Order Price Stock Price Adjustments**

Given the net difference between BUYS and SELLS for market order quantities of a given company, that company's stock price will adjust steps down equivalent to the net negative or move up as many steps as it can fill **price slots** on the stock chart. Different stock tiers require different amounts of slots to be filled before an order can move up in price.

## Operating Rounds

{: #operating-rounds }

**Operating Rounds** are where companies run production and shareholders determine company actions.

### Floating Companies
{: #floating-companies }

Each sector requires companies to sell some percentage of shares from its IPO before it is floated. Companies that are floated are eligible to operate. Companies eligible for operation conduct company actions during the company vote phase. Companies that are not floated may not have open market orders placed against them.

### Throughput
{: #throughput }

Measures company efficiency.  Throughput rewards or penalties are given during the Operating Round Production phase.

- Calculated by subtracting the company demand score from its supply score.
- The closer to 0, the more efficient the company is operating.
- If a company reaches zero efficiency, it will have a 50% reduction in it's operational costs that round.
- All penalties are steps down in share price value.

| Throughput | Reward / Penalty                |
|------------|----------------------------------|
| 0          | %50 Operation Cost Reduction     |
| 1          | 0                                |
| 2          | -1                               |
| 3          | -2                               |
| 4          | -2                               |
| 5          | -3                               |
| 6          | -3                               |
| 7          | -4                               |

### Sales Bonus
{: #sales-bonus }

Companies that sell all of their produced units of the operating round receive a prestige token.

### Production
{: #production }

Calculates revenue and operational efficiency.

- The maximum output of a company is determined by the lower of the company demand score and company supply.
- Companies can supply units only equivalent to the available customers in the sector.  The amount of units sold is whichever is lower, the maximum output or the available customers.
- Revenue is calculated as the unit price multiplied by the amount of units sold.

### Revenue Distribution Vote
{: #revenue-distribution-vote }

Players will vote on how company revenue should be distributed. The vote is weighted based on share ownership. One of three options can be chosen: Full Dividends, Half Dividends, or Retain.  

When revenue is distributed to shareholders, the revenue per share is calculated by dividing the total revenue by all available shares in circulation, regardless of their location. For example, if there are 5 shares in the IPO, 2 shares in the OM, and 3 shares owned by players at a stock price of $100, the dividend is calculated as $10 per share.

### Revenue Distribution
{: #revenue-distribution }

- **Full Dividends:** All revenue is distributed to shareholders.
- **Half Dividends:** Half of the revenue is distributed to shareholders. Half of the revenue is retained for the company.
- **Retain:** All revenue is retained by the company.

### Stock Price Adjustment
{: #stock-price-adjustment }

The company's share price will be adjusted up by one step by the total amount of revenue distributed to shareholders divided by its current stock price, rounded down. If, however, this price change would bring the company's stock price into a new stock tier, it stops at the beginning of that tier. For example, if a company has a stock price of $10 and distributes $100 of revenue to shareholders, the stock price will move up 10 steps, but because the next stock tier starts at $21, this increase is halted at that price at the beginning of the new tier.

If the company elects to retain revenue, it automatically moves down 1 step in stock price.

## End Turn Upkeep
{: #end-turn-upkeep }

### Capital Gains
{: #capital-gains }

Capital gains are taxes players pay based on realized income on the given turn.  That means any income collected from selling shares, collecting dividends, shorting stocks, execising options, or collecting cash rewards from tranches.

Capital gains will be taxed based on the tier the player falls under with their earnings.

### Divestment
{: #divestment }

Every player is beholden to the certificate limit for the game.  If a player exceeds this certificate limit when this phase occurs, they will be forced to liquidate shares until they reach this limit.  

The player has no agency in what shares will be taken.  Shares will be randomly taken until the player is at the certifcate limit. 

## Investor Tranches
{: #investor-tranches }

In this round, players vote on the tranche they want to win. There are three types of rewards:

- Cash
- Prestige
- Passive Sector Effects:
  - Passive Sector Effects are given to one company in the sector.
  - The effect will persist on this company until a passive effect is assigned to a different company in the same sector in a future tranch distribution phase.

Players vote on the tranche they want to win. If more than one player votes on the tranche, no one wins it and the tranche is not distributed. If all prize pools are won by a player, money is doubled in each prize pool. Placing a vote is not required.

After voting, any player who receives a cash reward may distribute this reward amongst all players in the game in whatever way they see fit.

## Insolvency and Bankruptcy
{: #insolvency-and-bankruptcy }

### Insolvency Contributions
{: #insolvency-contributions }

- Should a company fall to 0 dollars due to company actions or operational fees, the company will become INSOLVENT. The next time that company would operate, instead of the typical ACTIVE operating round actions, the company enters an INSOLVENCY action phase. All shareholders of the company can then contribute **cash** or **shares** to help the company avoid bankruptcy.
  - All cash contributions are immediately given directly to the company treasury. All share contributions are immediately sold, and the cash profit is transferred to the company treasury.
  - Shares handed over are sold at market rates. The share price of the company will move share price steps down equal to the net negative of all shares sold **after** the contribution action phase is completed. Therefore, every share sold during the insolvency phase will be equivalent to the share price of the company entering that phase.

### Reactivating the Company
{: #reactivating-the-company }

For the company to become **active** again, the total liquidity generated from contributions must meet or exceed the company's **shortfall** cash value for its tier.

### Transparency of Contributions
{: #transparency-of-contributions }

All contributions made during insolvency are **public** and take effect **immediately** as soon as they are made.

### If the Company Fails to Meet Its Shortfall
{: #if-the-company-fails-to-meet-its-shortfall }

- Following the opportunity for insolvency actions, the company will **permanently close** if it cannot meet or exceed its shortfall cash value.
  - Players holding shares will receive **10%** of the market value for their shares.
  - The company will be **delisted** from the stock market.
  - The company will no longer be able to perform actions.
  - The company will be removed from any considerations made in the stock sector.

## Prestige Tokens
{: #prestige-tokens }

**Prestige Tokens** can be spent on the prestige track to get various prestige rewards. They are used as part of the payment for the company's sector action. Prestige tokens are also factored as the second condition for company priority. The company with the higher prestige token count will have priority over the company with the lower prestige token count.

## Customer Movement
{: #customer-movement }

Each stock sector has customers that move to it from the global consumer pool every turn, based on the sector's demand. Various events can also trigger customer movement to a sector.

## Companies
{: #companies }

Companies are the vessel for financial investment in sectors. Investors will buy and sell stocks and place orders on the spot market and derivative market, placing bets against these companies' performance. Companies will distribute revenue based on earnings during ORs. During ORs, companies will also get a chance to act. Both revenue distribution and company actions are voted on by shareholders of the company.

### Company States
{: #company-states }

- **INACTIVE:** This company has not yet floated. Its stock price will not move and it cannot act or gain revenue.
- **ACTIVE:** This company has floated and is operational.
- **INSOLVENT:** This company has floated and is operational. Its cash on hand has reached 0. If it does not receive financial support, it will go bankrupt.
- **BANKRUPT:** Bankrupted companies can no longer operate and are no longer available for player orders in the market.

### Company Priority
{: #company-priority }

Company Priority is determined in this order of precedence.

- 0: If a company has Economies of Scale, it is considered to be the cheapest company regardless of its unit price.
- 1: Companies are sorted by unit price in ascending order (cheapest first).
- 2: Companies are sorted by prestige tokens in descending order.
- 3: Companies are sorted by demand score in descending order.

### Company Action Order

Because certain company actions impact the company priority order, before the first company action phase, the company prioritiy order is "locked" in a given turn and this becomes the company action order for this turn. Actions that would adjust price, prestige or gain any abilities to impact priority order do not impact the current turns company action order.

### Company Tiers
{: #company-tiers }

| Tier            | Operating Costs | Supply Max | Company Actions/OR | Shortfall |
|-----------------|-----------------|------------|---------------------|-----------|
| **INCUBATOR**    | $10             | 2          | 1                   | 100       |
| **STARTUP**      | $20             | 3          | 1                   | 200       |
| **GROWTH**       | $30             | 4          | 1                   | 300       |
| **ESTABLISHED**  | $50             | 5          | 2                   | 400       |
| **ENTERPRISE**   | $70             | 6          | 2                   | 500       |
| **CONGLOMERATE** | $100            | 8          | 2                   | 600       |
| **TITAN**        | $150            | 10         | 3                   | 700       |

### New Companies
{: #new-companies }

Every third turn, a new GROWTH company is opened in the sector with the highest average stock price across ACTIVE and INSOLVENT companies. If a sector has no INACTIVE, INSOLVENT or ACTIVE company, a STARTUP company is opened in that sector.

### Company Actions
{: #company-actions }

Each Operating Round, companies will take turns in **company priority** order. On their turn, players will vote for a set of company actions to take place. The number of actions a company can take is directly tied to its current company tier. Actions are paid for with assets from the company treasury.

#### Action Cost

Some actions have a fixed price, while others have tiered costs. During an Operating Round, the first company to take a tiered action pays the lowest price, the next company pays the next tier, and all subsequent companies pay the highest price.

#### General Actions
{: #general-actions }

These actions are available to every company every operating round action phase.  Note any company that follows a pattern of PRICE A | PRICE B | PRICE C is a "first come, first serve" action.  The first company to take that action will pay the leftmost price, the second company will pay the middle price and any companies after will pay the rightmost price. 

- **Large Marketing Campaign**
  - The sector receives an additional 3 consumers. Your company receives +4 demand that decays by 1 per production phase.
  - Cash Cost: $300 | $450 | $600

- **Small Marketing Campaign**
  - The company receives +3 demand that decays by 1 per production phase.
  - Cash Cost: $100

- **Research**
  - Invest in research to gain a competitive edge. Draw one card from the research deck.
  - Cash Cost: $200

- **Expansion**
  - Increase company size (base operational costs per OR) to meet higher demand and increase supply.
  - Cash Cost: $300

- **Downsize**
  - Reduce company size (base operational costs per OR) to lower operation costs and decrease supply.
  - Cash Cost: $50

- **Share Buyback**
  - Buy back a share from the open market. This share is taken out of rotation from the game.
  - Cash Cost: $0

- **Share Issue**
  - Issue 2 shares to the open market.
  - Cash Cost: $[Share Price]

- **Increase Unit Price**
  - Increase the unit price of the company's product by 10. The company loses 1 demand.
  - Cash Cost: $0

- **Decrease Unit Price**
  - Decrease the unit price of the company's product by 10.
  - Cash Cost: $0

- **Spend Prestige**
  - Purchase the current prestige track item at its cost to receive the reward on the prestige track and move it forward by 1. If the company does not have enough prestige, move the prestige track forward by 1.
  - Prestige Cost: Variable (See Prestige Track)

- **Loan**
  - Take out a loan of $250 to increase cash on hand. Be careful, loans must be paid back with interest at 0.1% per turn. This action can only be taken once per game.
  - Cash Cost: $0

- **Lobby**
  - Lobby the government to force demand in your favor. Boost the sector's demand by 3. This demand will decay by 1 per stock price adjustment phase.
  - Cash Cost: $150 | $300 | $500

- **Outsource**
  - The company outsources production. Increase supply by 3, which decays by 1 once per turn. Lose all prestige tokens. A company may only ever have up to twice the maximum supply its company tier allows.
  - Cash Cost: $200 | $300 | $400

- **Veto**
  - The company does nothing this turn. Pick this to ensure the company will not act on any other proposal. Additionally, the next turn, this company's operating costs are 50% less.
  - Cash Cost: $0

#### Active Sector Actions
{: #active-sector-actions }

These actions are specific to the company sector, and both cash and prestige must be used to pay for them.

- **Visionary**
  - Draw 2 research cards and the company gains +1 demand permanently.
  - Cash Cost: $400
  - Prestige Cost: 3

- **Strategic Reserve**
  - The company has no production cost next turn and revenue is increased by 10%.
  - Cash Cost: $400
  - Prestige Cost: 3

- **Rapid Expansion**
  - The company expands two levels.
  - Cash Cost: $400
  - Prestige Cost: 3

- **Fast-track Approval**
  - Take up to 3 consumers from each other sector and add them to the Healthcare sector. The company gets +2 temporary demand.
  - Cash Cost: $400
  - Prestige Cost: 3

- **Price Freeze**
  - During the marketing action resolve round, the company stock price will move a maximum of 2 spaces next turn.
  - Cash Cost: $400
  - Prestige Cost: 3

- **Re-Brand**
  - The company gains +1 temporary demand, +1 permanent demand, and a $40 increase in price.
  - Cash Cost: $400
  - Prestige Cost: 3

- **Surge Pricing**
  - Next turn, company revenue is increased by 20%.
  - Cash Cost: $400
  - Prestige Cost: 3

#### Passive Sector Abilities
{: #passive-sector-abilities }

These actions are specific to the company sector and are given out during the Tranches phase. Only one company in a sector may have a passive ability at a time.

- **Innovation Surge**
  - Should the company draw a research card, draw 2 cards instead.

- **Regulatory Shield**
  - Should the company stock price decrease, it will stop at the top of the next stock price tier should it drop any further.

- **Extract**
  - Gain this action during the Company Action phase: The company gains 1 temporary supply and, if the Industrial Sector exists, a random active insolvent Industrials sector company gains one temporary supply.

- **Manufacture**
  - Gain this action during the Company Action phase: The company gains 1 temporary supply and, if the Materials Sector exists, a random active insolvent Materials sector company gains one temporary supply.

- **Steady Demand**
  - Should the company have remaining demand but no consumers are available, sell up to 2 demand anyway.

- **Boom Cycle**
  - Would the company stock price be stopped by a new price tier, allow it to move up at least 3 spaces further.

- **Carbon Credit**
  - This company's throughput can never be less than -1 or greater than 1.

## End Turn Events
{: #end-turn-events }

### Economy Score Adjustment
{: #economy-score-adjustment }

- **Trigger:** Once each sector has floated a company, the economy becomes eligible to move.
- **Conditions:**
  - If at least one company in each sector pays dividends, the economy **moves up by 1**.
  - If at least one company retains earnings, the economy **moves down by 1**.
  - If both conditions are met (dividends paid and earnings retained), the economy **remains unchanged**.

### Consumers Move to Sectors
{: #consumers-move-to-sectors }

- **Timing:** At the end of each turn, consumers rotate between sectors.
- **Mechanism:**
  - A number of consumers are taken from the **global consumer pool** that is equivalent to or as many as can be taken to equal the current **economy score**.
  - Consumers are "spooled" out across sectors until the total economy score is exhausted.  Consumers are spooled out in **sector priority order**
  - The number of consumers moving into each sector is equivalent to the sector's demand score.

## Game Phases
{: #game-phases }

### 1. Influence Bid
{: #influence-bid }

   - **Description:** Players place influence bids to determine initial player priority.

### 2. Influence Bid Resolve
{: #influence-bid-resolve }

   - **Description:** The hidden influence bids are revealed and resolved, showing each player's bid values. Initial player priority is determined.

### 3. Start Turn
{: #start-turn }

   - **Description:** After the first turn, the beginning of a new turn, where players review their strategies, discuss and prepare for upcoming actions.

### 4. Tranches Votes
{: #tranches-votes }

   - **Description:** Every third turn, players vote on which tranches to support, influencing future rewards or penalties.

### 5. Resolve Tranches Votes
{: #resolve-tranches-votes }

   - **Description:** Every third turn, the results of the tranches votes are processed, determining the outcome of the tranches.

### 6. Distribute Tranches
{: #distribute-tranches }

   - **Description:** Every third turn, the rewards associated with the tranches are distributed among players.

### 7. Resolve Tranches Distribution
{: #resolve-tranches-distribution }

   - **Description:** Every third turn, the effects of the tranche distribution are finalized, with players receiving their due rewards or facing penalties.

### 8. Resolve Limit Orders
{: #resolve-limit-orders }

   - **Description:** Limit orders in FILLED_PENDING_SETTLEMENT state are processed.

### 9. Place Stock Orders
{: #place-stock-orders }

   - **Description:** Players place orders in secret to buy or sell stocks in the market.

### 10. Review Concealed Orders
{: #review-concealed-orders }

   - **Description:** Player order locations are revealed, which show which company and market the order was placed under.

### 11. Reveal Orders
{: #reveal-orders }

   - **Description:** All concealed stock orders are revealed, showing the full details of the order.

### 12. Resolve Market Orders
{: #resolve-market-orders }

   - **Description:** Market orders are resolved, executing trades at the current market prices.

### 13. Charge Interest Short Orders
{: #charge-interest-short-orders }

   - **Description:** Interest is charged on outstanding short positions, reflecting the cost of borrowing shares.

### 14. Cover Short Orders
{: #cover-short-orders }

   - **Description:** Players with short positions may optionally cover their orders by buying back shares.

### 15. Resolve Pending Short Orders
{: #resolve-pending-short-orders }

   - **Description:** Pending short orders are OPENED.

### 16. Resolve Expired Contracts
{: #resolve-expired-contracts }

   - **Description:** Expired options contracts are settled.

### 17. Resolve Pending Option Orders
{: #resolve-pending-option-orders }

   - **Description:** PENDING options orders are OPENED.

### 18. Exercise Option Orders
{: #exercise-option-orders }

   - **Description:** Options orders which are valid to be exercised may be exercised.

### 19. Open Pending Limit Orders
{: #open-pending-limit-orders }

   - **Description:** PENDING limit orders are OPENED.

### 20. Stock Round Results
{: #stock-round-results }

   - **Description:** A summary of the stock round's results, including gains, losses, and stock price changes.

### 21. Operating Round Production
{: #operating-round-production }

   - **Description:** The company produces revenue based on its current supply and demand.

### 22. Vote on Revenue Distribution
{: #vote-on-revenue-distribution }

   - **Description:** Shareholders vote on how the company’s revenue should be distributed, one of FULL DIVIDEND, HALF DIVIDEND, or RETAIN.

### 23. Resolve Revenue Distribution
{: #resolve-revenue-distribution }

   - **Description:** The results of the revenue distribution vote are implemented, with dividends paid or funds reinvested.

### 24. Stock Price Adjustment
{: #stock-price-adjustment }

   - **Description:** The company's stock price is adjusted based on its dividends distributed.

### 25. Company Vote
{: #company-vote }

   - **Description:** Shareholders vote on company actions.

### 26. Company Vote Result
{: #company-vote-result }

   - **Description:** The results of the shareholder vote are announced, determining actions which will be resolved.

### 27. Resolve Company Action
{: #resolve-company-action }

   - **Description:** The outcome of the company's planned actions is implemented.

### 28. Capital Gains
{: #capital-gains }

   - **Description:** Players are charged a tax based on their net worth.

### 29. Divestment
{: #divestment }

   - **Description:** Players who have exceeded the share limit must sell off shares.

### 30. End Turn
{: #end-turn }

   - **Description:** Consumers move to sectors, economy score is evaluated and the turn ends.
