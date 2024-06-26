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