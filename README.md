NestJS Responsibilities
-Web Sockets
-Game Business Logic

TRPC PLAYGROUND
/trpc-playground

TODO: -Assetions for any client mutations.  Always assume we're getting "impossible" data from the client. 
- getCurrentGameState: Retrieves the game along with the current round and phase.  We need a currentPhase enum to know whether we need to look in stock or operations round.
- Context for Players, Companies, Stock and Sectors.  We need a singular place to receive socket data so we can easily update our consuming components. 
- We need debounce, throttling and loading indicators for all interactables.
- Ability to pause game from client, and continue timers from backend if a game that is currently not running any timers was not finished and is accessed from the client (so a "resume" functionality).
- Do we need a vote to determine company IPO?  This would be the first step of the game should it occur.  For now, we're just going to randomly assign IPO on company creation based on min and max values.
- For now we are going to use a linear "1D" stock market, we can explore a possible 2D "axised" stock market in the future.
- Possibly have the idea of "divest" or "over-extended" to force players down to a "certificate limit" or occur some penalty if they buy too many stocks
- CAPTIAL GAINS will work as a percentage you owe based on the net worth of your portfolio being over some threshold.
- Should we mess with the idea of stocks held shares only having realized value once sold?  IE. This would mean all stocks would be liquidated before end-game. This would mean we have to rethink the way the game ends with the typical "bank broken" scenario.  Because money flow would go back to the bank.
- Short Orders must be liquidated to be realized.  Limit Orders unfullfilled do nothing.  
- We should have an ownership share limit % for companies.  Maybe per sector?
- New company actions.  Issue Shares / Share Buyback.  Share buyback takes a share out of rotation.  Issue shares, the company can issue 10 new shares, dilluting the share value. There will be a flat fee for doing so.

Example: 
Initial Situation:
Stock Value: $50
Total Distributed Shares: 100
Market Capitalization: 100 shares * $50 per share = $5,000
New Shares Issued:
New Shares Issued: 100
Total Shares After Issuance: 100 (original) + 100 (new) = 200

- Short Orders need a "principal" value, which is the share value at the time the share was issued.

- Short Orders might cause a players cash on hand to go into the negative.  If this is the case, we can resolve it by having a system where the player needs to select stock to get rid of to make up this difference or we automate the process if they don't do it in the given time for the round.  For example, if the player is at -200 after failing to pay short order interest loans, perhaps in the stock "results" round players need to perform that upkeep or the game will trash stocks automatically to do this for them.  Alternatively, the players cash on hand can simply be negative and the player will need to sell stocks themselves the next stock round to get back into the positive.

- We also need to calculate market capitalization for a company at any given time. (TOTAL shares * Price per share)

Consider that issuing shares is probably static number in the game, like "10".

- A company should never be able to perform two actions in a row.

- Market Orders are only filled as much as they can be and evenly distributed.  When placing an order, you can only place a maximum amount of the shares available.

For example if there is 6 shares available but two players have requested 3 shares and one player has requested 2, all three players receive 2 shares.

If 2 shares are available and 5 players request 2 shares each. only 2 shares can be distributed, in this case, preference goes to the player.  There are two ways to solve this issue.  We can do fractional shares (that can be explored, but not initially) or we can use a lottery system, so they are randomly distributed.

I think the order of precedence would be.

- All Sell Orders Are Resolved.
- Shares are distributed first to the players who placed the earliest orders in the Stock Round.
- If there is still not enough shares to go around, they are instead evenly distributed.
- If they still cannot be evenly distributed, they are awarded on a lottery and some players may receive less or zero shares.

Divestment

- If any player holds more than 60% of a company at the end of a turn, they are forced to "divest" stock down to 60% ownership.

So a complete turn flow would be

- Stock Round
-- Resolve Limit Orders
-- Place Orders (MO/LO/SO)
-- Resolve Market Orders
-- Short Orders
--- Move All Short Orders Up One Term
--- All Short Orders who are moving from "1" resolve and pay-outs and pay-ins are given.

- Operating Round
-- Iterate through companies
--- Production Payout
--- Stock Price Adjustment
--- Hold Company Vote
--- Reveal Vote
--- Resolve Vote Outcome

- Capital Gains
-- Tax players accordingly

- Divestment
-- Force stock liquidation if over 60%

- Sector Round (???)
-- New company opens?
-- Cohesion bonuses? 
-- Review supply and demand?

- Rethinking Shorts and Adding Options, Short Orders are now gonna behave like real life short orders.  That means no fixed term anymore, you simply hold onto shorts waiting for opportunistic time to sell, however, you must set aside a minimum amount of funds/shares in margin account which are LOCKED and cannot be used and they must stay there as long as the short order is opened.  You also accrue interest in "borrowRate" every turn the short is opened.  Also, any dividends that are paid out actually need to be paid out BY THE PLAYER.  This is because shorted stocks are "borrowed", so when you open a short position, you sell those stocks hoping to collect a positive difference in the end.  However, because they are borrowed, you still owe the lender any dividends. So you must pay the broker the dividends collected.  Proper short orders also opens up the potential for a cascade of "short squeeze" as players will rush to cover options pushing the price further up.  Short orders should positively effect the price when they are opened and covered.

- Call Option orders will work simarily as they do in real life as well.  Options contracts will be randomly generated each turn.  If players purchase a contract, they will have the "right" to buy the shares should the price move equal to or beyond the strike price listed on the contract.  Call options are purchased by paying the premium (which is a rate per share).  The profit (or loss) is calculated as Current Market Price minus Strike Price minus the premium paid. Options contracts can be "exercised" or sold.  Execising a call option means buying shares at the strike price, then selling it at the current market price.  

Call Option Example:

Strike Price: $50
Current Market Price: $60
Premium Paid: $3 per share
Intrinsic Value: $60 - $50 = $10 per share
Profit (if exercised): $10 (intrinsic value) - $3 (premium) = $7 per share

Selling an option contract means selling the contract itself at a new premium.

Call Option Example:

Initial Premium Paid: $3 per share
Current Option Premium (market value): $12 per share
Profit (if sold): $12 (current premium) - $3 (initial premium) = $9 per share

For the "selling" option, we might consider player to player exchanges.  Otherwise this option probably won't happen at least in the first version of the game.

- Call Options will be available in the initial version of the game, we can consider put options (selling) later.

I'm thinking that options/short "pool" of shares should only become available after the IPO has completely sold out.

- Use "Derivative Market" for options.  For shorts, perhaps they should share the same pool with the IPO initial offering.

I'm thinking short orders can only be performed on a company you have no ownership of, otherwise it's probably too easy to manipulate the situation in your favor.

- "Insider Trading Rule": You cannot open a short position on a company you already own shares in.

- Should we have a max limit on short shares you can take?  Probably start at 3 and have research deck cards that allow certain companies to be shorted at higher amounts.

- Company tiers should be related to throughput and market cap (???), defined outside db possibly in constants.  Company tier could also be correlated to how much you can short.  The "stronger" and more "stable" the company, the higher you can short because it has greater risk.

- What are prestige tokens for?  They can be traded in for an upgrade to unit price, an upgrade to research deck slots or hold to break ties.  They can be used to upgrade the base demand for the sector.

- Market Orders are the only type of order that can be placed on the IPO

- For determining the consumer pool distribution, what if the global game economy determined how much demand could be "spooled" out after a turn for the following turn/operation round?  The global economy being how much money is spent or stocks are doing?

- If a company buys back shares, and this puts a player over the share cap for that company, they must divest

- We need to use the idea of a marketing cap to identify stock price.

- issuing shares does not change the stock price, simply the dividends pay out. the same is true conversely with share buyback.

- I think the priority for customers buying from a company in a sector is
-- 1. Prestige
-- 2. Price (Lowest price first)
-- 3. Demand Score

- bug with share distribution when 2 players are trying to buy the same amount of shares market order buy ipo

- research cards should probably, at first, only adjust the game state at the moment they occur.  this is simpler than, "when x happens, y should occur".  research upkeep can occur during "end turn" step.

- TODO: Resolution for finding the next company to act is not working during company vote.

- TODO: operating round id / stock round id is being set to null too early. maybe when we switch to upkeep phase?

- TODO: Split out dividend payout.  Make sure calculations are correct.

- Should prestige bonus be based on selling out of your inventory or hitting the expected target customers?  If a companies product is hard to get, does that make it prestigious?