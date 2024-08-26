# Rules Overview
{: #rules-overview }

**Sectors** is a game of stocks and running companies. You play as an influential investor trying to make the most money through clever investments and company management. The winner of the game is the player with the greatest net worth at the end of the game.

### End Game Condition
{: #end-game-condition }

Sectors ends in one of two ways: 
- **Bank Breaks:** The bank *"breaks"* as it reaches or goes below 0. As soon as this happens, the remainder of the turn is played out and this is the last turn of the game.
- **Total Turns Exceeded:** If the game runs through its maximum turn length, the game ends on the final turn.

### Game Flow
{: #game-flow }

The game is played over turns, each turn is separated into distinct rounds. The stock round has three sub-rounds. Each round has phases where players will either perform some action or observe the result of a phase's resolution.

Each phase has a given amount of time before it will end and the next phase will begin. If the phase is actionable, players will have an opportunity, given they are eligible, to perform some action or set of actions. Actions conducted in sector phases are performed **simultaneously**. Players are never forced to place an action. If players do not act within the given timer, they are considered not to have acted in that phase.

If a player is ready, they can elect to "ready up," which will signal they have nothing else they wish to do or observe in the current phase. If all players of the game ready up, that phase is considered finished regardless of the time remaining in that phase.

### Sections of the Game
{: #sections-of-the-game }

- **Influence Round:** This round only occurs once at the beginning of the game. It determines initial **player priority** order. Each player will, in secret, perform an influence bid. Each player starts with 100 "influence" points. For each point the player does not spend on their influence bid, they will retain $1. Player priority is then determined in descending order of influence points spent on the bid. In the case of tied bids, priority order is determined randomly.
- **Tranche Distribution:** Tranche packages are made for offer every three turns. These are rewards which are distributed based on player ownership which is handled via a vote.
- **Stock Round:** Players place orders against companies through distinct order mechanisms.
- **Operation Round:** Investors vote on company operations, and companies generate revenue by attracting customers.

## Players
{: #players }

**Players** take the role of investors. The goal of every player is to earn as much capital as possible through cash on hand and ownership of shares. The **net worth** of a player is determined by adding the cash on hand and the value of all shares multiplied by their respective company stock price. At the end of the game, the player with the highest **net worth** is the winner.

During the game, players will have agency to place orders in the **spot market** and **derivatives market** to buy or sell against companies in the game. As **shareholders**, players will have agency to place votes for a company as to how it will distribute revenue and act during an operating round. Players will also have agency in selecting **tranche** packages which are distributed to players and companies in the game.

### Player Priority
{: #player-priority }

Player priority determines how any ties are resolved in relation to the player. A player who has a lower priority number is considered to have higher priority. For example, a player priority of 2 is prioritized ahead of a player priority of 5.

## Stock Rounds
{: #stock-rounds }

**The Stock Round** is the first major section of each turn and provides the mechanisms for players to build their stock portfolio and earn (or lose!) money in investments. The Stock Round is broken down into a number of *"sub-rounds"* where players can place one order in each round. The order is placed in the "Place Stock Orders" phase. Player orders are submitted simultaneously and in secret. Players have 4 distinct order mechanisms: Market Orders, Limit Orders, Short Orders, and Options Contracts.

### Order Mechanisms
{: #order-mechanisms }

- **Market Orders:** Buy or sell shares at the current market price. These are resolved first. If using bid priority, higher asking prices gain advantage. Market Orders are placed against the IPO or OPEN MARKET.
- **Limit Orders:** Trigger an order based on market price changes. A BUY limit order purchases stock when the price reaches a certain value. A SELL limit order sells stock when the price falls below a certain value. Limit Orders are placed against the OPEN MARKET. Limit Orders have limited actions available. If you have no limit order actions remaining, you cannot place another limit order until more actions become available. Limit order actions become available when a limit order has become FILLED.
- **Short Orders:** Borrow shares from the market and sell them immediately. Cover these shares in a subsequent turn by purchasing the same quantity at the current market price. Short Orders are placed against the OPEN MARKET. Short orders have an ongoing interest borrow rate. Short order share dividends must be covered by the player. Short Orders have limited actions available. If you have no short order actions available, you cannot place another short order until more actions become available. Short order actions become available when a short order has been covered.
- **Options Contracts:** Purchase the right to buy or sell stock at a certain price. These contracts are placed against the DERIVATIVES MARKET. The contract price is called the *"premium"*. Contracts have set premiums, shares, terms, and strike prices.

### Share Locations
{: #share-locations }

- **IPO:** Initial Public Offering. The initial shares offered for purchase from the company. The purchase of these shares does not impact the stock market price.
- **OPEN MARKET:** Shares are purchased from the open market. Shares bought or sold in the open market impact the company's stock price. For each share sold, the stock price moves down 1 step. For each share bought, the stock price moves up one slot on the stock tier track. Different stock tiers require different amounts of slots to be filled before an order can move up in price.
- **DERIVATIVES MARKET:** Options contracts are purchased from the bank.

### Market Order Resolution
{: #market-order-resolution }

- Orders are resolved in ascending sub-round order.
- If there are multiple orders in the same sub-round:
  - **Bid Strategy:**
    - Bids are resolved in descending order when using bid priority.
    - In case of bid ties, the player with the highest priority resolves first.
  - **Priority Strategy:**
    - Orders are resolved according to **player priority** order.
- Orders that cannot be filled due to lack of shares are marked as REJECTED.

**Market Order Price Stock Price Adjustments**

Given the net difference between BUYS and SELLS for market order quantities of a given company, that company's stock price will adjust steps down equivalent to the net negative or move up as many steps as it can fill "price slots" on the stock chart. Different stock tiers require different amounts of slots to be filled before an order can move up in price.

**Stock Market Price Impact:**

- A SELL action moves the stock price down 1 step.
- A BUY action fills one slot in the current stock step.
- Different stock tiers require varying amounts of slots to be filled to move the stock price up a step.

### Triggering Limit Orders
{: #triggering-limit-orders }

- Any time a limit order is triggered, its status will be moved to FILLED_PENDING_SETTLEMENT. A limit order is considered triggered if at any time its value falls between the threshold, inclusive, of the company's new stock price and previous stock price.
- The limit order is not FILLED until the "Resolve Limit Orders" phase.

### Prerequisites for a Short Order
{: #prerequisites-for-a-short-order }

- Players must have at least half the total value of the short order in cash to set aside for a *"margin account"*.
- The margin account locks these funds until the short order is covered. These funds cannot be used for any other purpose. These funds are released once the short order is covered.
- Interest is paid every turn the short order is open, calculated as a percentage of the total value of the short order.

**Profits from Options Contracts:** The profit is the difference between the current market price and the strike price, multiplied by the total shares in the contract. Should the price be equal to or less than the strike price, you will lose the premium paid for the contract.

## Operating Rounds
{: #operating-rounds }

**Operating Rounds** are where companies run production and shareholders determine company actions.

### Operating Round Priority Order
{: #operating-round-priority-order }

Companies operate in priority given a myriad of factors.

### Floating Companies
{: #floating-companies }

Each sector requires companies to sell some percentage of shares from its IPO before it is floated. Companies that are floated are eligible to operate. Companies eligible for operation conduct company actions during the company vote phase. Companies that are not floated may not have open market orders placed against them.

### Throughput
{: #throughput }

Measures company efficiency.

- Calculated by subtracting the company demand score from its supply score.
- The closer to 0, the more efficient the company is operating.
- If a company reaches zero efficiency, it is awarded one increment forward in share price.

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

- Revenue is determined by the lower of the company demand score and company supply.
- Unit price multiplied by this number gives the revenue.
- Companies can supply units only equivalent to the available customers in the sector.

### Revenue Distribution Vote
{: #revenue-distribution-vote }

Players will vote on how company revenue should be distributed. The vote is weighted based on share ownership. One of three options can be chosen: Full Dividends, Half Dividends, or Retain.

### Revenue Distribution
{: #revenue-distribution }

- **Full Dividends:** All revenue is distributed to shareholders.
- **Half Dividends:** Half of the revenue is distributed to shareholders. Half of the revenue is retained for the company.
- **Retain:** All revenue is retained by the company.

### Stock Price Adjustment
{: #stock-price-adjustment }

The company's share price will be adjusted by one step by the total amount of revenue distributed to shareholders divided by its current stock price, rounded down. If, however, this price change would bring the company's stock price into a new stock tier, it stops at the beginning of that tier. For example, if a company has a stock price of $10 and distributes $100 of revenue to shareholders, the stock price will move up 10 steps, but because the next stock tier starts at $21, this increase is halted at that price at the beginning of the new tier.

If the company elects to retain revenue, it automatically moves down 1 step in stock price.

## Investor Tranches
{: #investor-tranches }

In this round, players vote on the tranche they want to win. There are three types of rewards:

- Cash
- Prestige
- Passive Sector Effects:
  - Passive Sector Effects are applied to all companies in the sector.
  - These effects will persist on this company until a passive effect is assigned to a different company in the same sector.

Players vote on the tranche they want to win. If more than one player votes on the tranche, no one wins it and the tranche is not distributed. If all votes are distributed, money is doubled in each prize pool. Placing a vote is not required.

After voting, any player who receives a cash reward may distribute this reward amongst all players in the game in whatever way they see fit.

## Insolvency and Bankruptcy
{: #insolvency-and-bankruptcy }

### Insolvency Contributions
{: #insolvency-contributions }

- Should the company fall to 0 dollars due to company actions or operational fees, the company will become INSOLVENT. The next time that company would operate, instead of the typical ACTIVE operating round actions, the company enters an INSOLVENCY action phase. All shareholders of the company can then contribute **cash** or **shares** to help the company avoid bankruptcy.
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
  - Players holding shares will receive **[BANKRUPTCY_SHARE_PERCENTAGE_RETAINED]%** of the market value for their shares.
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

Companies are the vessel for financial investment in sectors. Investors will buy and sell stocks and place orders on the derivative market placing bets against these companies' performance. Companies will distribute revenue based on earnings during ORs. During ORs, companies will also get a chance to act. Both revenue distribution and company actions are voted on by shareholders of the company.

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

### Company Tiers
{: #company-tiers }

| Tier          | Operating Costs | Supply Max | Company Actions/OR |
|---------------|-----------------|------------|---------------------|
| **INCUBATOR** | $10             | 2          | 1                   |
| **STARTUP**   | $20             | 3          | 1                   |
| **GROWTH**    | $30             | 4          | 1                   |
| **ESTABLISHED** | $50           | 5          | 2                   |
| **ENTERPRISE** | $70            | 6          | 2                   |
| **CONGLOMERATE** | $100         | 8          | 2                   |
| **TITAN**     | $150            | 10         | 3                   |

### New Companies
{: #new-companies }

Every third turn, a new company is opened in the sector with the highest average stock price across ACTIVE and INSOLVENT companies. If there are no ACTIVE or INSOLVENT companies in the game, no company is opened.

### Company Actions
{: #company-actions }

Each Operating Round, companies will take turns in **company priority** order. On their turn, players will vote for a set of company actions to take place. The number of actions a company can take is directly tied to its current company tier. Actions are paid for with assets from the company treasury.

#### General Actions
{: #general-actions }

These actions are available to every company every operating round action phase.

- **Large Marketing Campaign**
  - The sector receives an additional 3 consumers. Your company receives +4 demand that decays by 1 per production phase.
  - Cash Cost: $220

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
  - Cash Cost: $50

- **Increase Unit Price**
  - Increase the unit price of the company's product by 10. This will increase the company's revenue. Be careful, as consumers choose the company with the cheapest product in the sector first!
  - Cash Cost: $0

- **Decrease Unit Price**
  - Decrease the unit price of the company's product by 10. This will decrease the company's revenue.
  - Cash Cost: $0

- **Spend Prestige**
  - Purchase the current prestige track item at its cost to receive the reward on the prestige track and move it forward by 1. If the company does not have enough prestige, move the prestige track forward by 1.
  - Cash Cost: $0

- **Loan**
  - Take out a loan of $250 to increase cash on hand. Be careful, loans must be paid back with interest at 0.1% per turn. This action can only be taken once per game.
  - Cash Cost: $0

- **Lobby**
  - Lobby the government to force demand in your favor. Boost the sector's demand by 3. This demand will decay by 1 per stock price adjustment phase.
  - Cash Cost: $120

- **Outsource**
  - The company outsources production. Increase supply by 3, which decays by 1 once per turn. Lose all prestige tokens. A company may only ever have up to twice the maximum supply its company tier allows.
  - Cash Cost: $200

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
  - This company's throughput can never be less than 1.

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
  - Consumers are "spooled" out across sectors until the total economy score is exhausted.
  - The number of consumers moving into each sector is equivalent to the sector's base demand score.
  - Sectors operate in a **priority order**, moving from left to right based on a pre-defined ranking.

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
