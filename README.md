NestJS Responsibilities
-Web Sockets
-Game Business Logic

Email
Resend

DB
Supabase

Transport Layer
TRPC

Sockets
Pusher

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

- TODO: Add hyperlinks to company and player names so that when you click it will automatically bring up that detailed accordion in the left panel.

- TODO: Player cash is going to zero at the end of a turn?

- TODO: Limit order functionality, unlimited sells, 1 buy?

- TODO: Extend pending order component to include dropdowns for all order statuses

- TODO: Option Order action limit?

- TODO: Bank breaks x amount, 10K? Give two company actions per OR

- TODO: Market notifications for orders placed, so players don't need to monitor both tabs to see if something popped up

- TODO: Because companies start with 10 shares, make floats divisble by 10 (done)

- TODO: Turn order on company carousel is not accurate

- TODO: Better illustrate divestment stocks being lost, not the stocks you own

- TODO: Better illustrate how consumers move to each sector

- TODO: A table showing company demand more clearly during revenue

- TODO: Game results not correct? Net worth doesn't match placement
- TODO: Production OR revenue results breaking db, too much write data?
- TODO: Dropdown for player share ownership on table per row
- TODO: Increase timer for company action decisions
- TODO: How do we handle bankruptcy? (replace actions with bankruptcy gameplay)
- TODO: Sector demand, should we give options for increasing?
- TODO: Generated Options should be for active companies only
- TODO: Insolvency should only be allowed in company action vote round
- TODO: Insolvency actions should only be rendered for the current turn
- TODO: Start on SUPPLY_CHAIN for passive, PRICE_FREEZE needs to be implemented
- prizes for sectors that are inactive???
- company demand vs sector demand 

-- Drop the trigger
drop trigger if exists after_insert_profile on public.profiles;

-- Drop the trigger that depends on the function
drop trigger if exists on_auth_user_created on auth.users;

-- Drop the function with CASCADE to remove all dependencies
drop function if exists public.handle_new_user() cascade;
-- inserts a row into public.user with authUserId set to the new.id
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public."User" (id, "authUserId", "createdAt", "updatedAt")
  values (new.id, new.id, current_timestamp, current_timestamp);
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Check if the user has a User record on updates and insert if missing
create function public.create_user_if_missing()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Log the user ID being processed
  RAISE NOTICE 'Processing user ID: %', new.id;

  -- Check if the user record exists
  if not exists (select 1 from public."User" where "authUserId" = new.id) then
    -- Log if the user record is missing
    RAISE NOTICE 'No User record found for authUserId: %. Creating new record.', new.id;

    -- Insert the new user record
    insert into public."User" (id, "authUserId", "createdAt", "updatedAt")
    values (new.id, new.id, current_timestamp, current_timestamp);

    -- Log successful insertion
    RAISE NOTICE 'User record created for authUserId: %', new.id;
  else
    -- Log if the user record already exists
    RAISE NOTICE 'User record already exists for authUserId: %', new.id;
  end if;

  return new;
end;
$$;

-- Trigger the function when user record is updated
create trigger check_user_record_on_update
  after update on auth.users
  for each row execute procedure create_user_if_missing();

-- EXECUTIVES

Should bribes be left on the table for that trick round if they are not taken?

I think so!  It's a powerful "sacrifice" for influence then.

CEO or COO starts for accepting bids? Or just next player to left.

Tricks and Trick history need to show the lead and trump data as well.

-- BRAND VALUE
Unit Price - Brand Bonus (from marketing), lower brand value wins

Process for consumer, FILTERING OUT competing companies through pulls

<Company A Factory A CIRCLE SQUARE>

<Company A Factory B CIRCLE SQUARE SQUARE>

<Company B Factory A CIRCLE CIRCLE CIRCLE>

Consumer Bag -> Pulls Circle

<Company A Factory A CIRCLE SQUARE>

<Company A Factory B CIRCLE SQUARE SQUARE>

<Company B Factory A CIRCLE CIRCLE CIRCLE>

Consumer Bag -> Pulls Square

<Company A Factory A CIRCLE SQUARE>

<Company A Factory B CIRCLE SQUARE SQUARE>

Result: Automatically fills highest factory within company

**Bag resets (???)**

Consumer Profile Idea

A Consumer for the **next turn** is looking for X, Y and Z (???)

~~What if the Sector Token was like a **wild card** and other tokens were specifity.~~

Scratch that the bag for every sector will have 5 **Wild Card** Influence tokens.

On each new phase, an additional wildcard **resource influence** is put into the influence bag. (???)


Sector product recipes **can** include wild cards.

If you elect to only make a recipe with wild cards, yes, you will be chosen everytime, but you also then risk the reward of being picked over another company.

Also, sector specific resources typically have lower values.

In phase I, a consumer will only look for a 2 pull, etc. etc.

The company MUST match exactly the pull to sell to that consumer from that factory.  The specific resource is preferred over wildcards.

As phases progress, a company profile for each available phase is drawn each round.

Consumers will always service **all possible factory industries from highest to lowest**.

Phase I Sector: 2 Pull
Phase II Sector: 3 Pull
Phase III Sector: 4 Pull **rusts phase I factories** (???)
Phase IV Sector: 5 Pull  **rusts phase II factories** (???)

Rusting factories return their resource cubes back to the resource track.

In the case of contested purchase decision, the consumer goes to the lowest brand score

**How do players combat the only one resource strategy and flooding the market with that?**


Marketing campaigns are active until their temporary token is pulled from the bag.  

When a temporary token is pulled, it is subsequently removed after that turn.

When the temporary token is removed, the marketing campaign ends.