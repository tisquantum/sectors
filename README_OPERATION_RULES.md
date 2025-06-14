New Operation Mechanics

- Global Resource Pool & Resource Economy Tracks
-- Each resource exists on a track, as resources are taken, this commodity becomes cheaper and the price decreases, the more availability of said resource, the more expensive the resource is, this reflects economies of scale
-- There are 3 Global Resources each sector can use for their factories, while each sector has a unique resource track that only it's factories can use

- Workforce Track
-- Workers move from this track to factory or marketing campaigns
-- This track determines the economy score, more workforce, stronger economy.
- Worker Salary
-- The sectors worker salary is determined by sector score.  A sectors consumer score * sector resource price is the per/worker salary. 

- Industrialize (???)
-- Factory tiles are built and can have (up to) the amount of resources the tile has that can be filled.  Factories **must** be filled the required amount of workers to be operational.

Factories
-- A factory can hold x amount of resources for it's product blueprint and x amount of workers
-- When a factory is built. it automatically takes 1 sector resource at the current price, then the company owner chooses up to x amount of additional resources from the global pool.
--- Factory I: 1 Worker, 1 resource + 1 sector resource
--- Factory II: 2 Worker, 2 resource + 1 sector resource
--- Factory III: 3 Worker, 3 resource + 1 sector resource
--- Factory IV: 4 Worker, 4 resource + 1 sector resource
-- A company can only select from the available factories available for that sector.  A company can only choose factories from the max current sector phase.
-- The cost to build factory is all resources allocated at the **current price**
-- The recurring cost to run a factory is the worker pay rate for that sector (???)

- Company Unit Price Track
-- Tracks Unit Price and Modifier for "Brand Score", two cubes, one is the unit price and the brand modifier decreases price for "Attraction" rating which dictates where customers will go first.  So for example, a company may have a unit price of $10 but a brand modifier of 3 decreases perceived price to $7, so customers would prefer it over a company with unit price $8 and brand score 0 in a competing sector.

- Marketing
-- Marketing I: 1 Worker, +1 Brand +1 Resource in Sector Consumption Bag
-- Marketing II: 2 Worker, +2 Brand +2 Resource in Sector Consumption Bag
-- Marketing II: 3 Worker, +3 Brand +3 Resource in Sector Consumption Bag
-- Marketing IV: 4 Worker, +4 Brand +4 Resource in Sector Consumption Bag
-- Marketers degrade one turn at a time, once they are gone you lose the brand bonus

- Sector Consumption Bag
-- By default, each sector starts with five permanent sector specific resources to draw from
-- When a factory is built, a permanent resource marker of the companies choice from goods it produces is put into the consumption bag
-- Marketing resources in the consumption bag are temporary, when they are drawn, they are discarded
-- During each consumption round, goods are drawn equivalent to the customers in each sector. For every customer the sector **cannot service**, the sector score reduces by 1.
-- Each factory can only service the maximum allotment of it's factory size
--- Factory I: 3 customers
--- Factory II: 4 customers
--- Factory III: 5 customers
--- Factory IV: 6 customers
-- As each good goes to a company, the customer marker is moved to that factory to demonstrate product sold, once it fills, the factory no longer can offer anymore product
-- A customer will always buy the most complex product available first.  This reflects the refinement of better factories.


Units sold
-- Units sold are equivalent to the **current price* of all combined resources from the product being manufactured at a company + the unit price of that company. So for example, if a factory blueprint is one circle good @ $4 + one square good @ $8 + one sector good @ $5 + unit price @ $4 the total revenue for each good sold is $21. 


New Operation Round Turn Structure

- Build Factories
-- Each company tableau has a factory section which is limited by the current phase
I I II III IV.  Note that this does not correlate to the factory size that is built on those slots.
-- Phase I: two factory limit
-- Phase II: three factory limit
-- Phase III: four factory limit
-- Phase IV: five factory limit
-- When a factory is built, it will not operate until the subsequent turn.
-- The build actions are taken and revealed simulataneously.  The action is performed by the company owner.
-- A company may build as many factories as it likes and can fill per turn.
- Factory Blueprint Costs
-- When companies pay for the resources in their factory blueprint, they are sources at the price availability of that turn.  So for example if 4 companies all take the same resource, they are given the resource price at the point it is taken, not iteratively after each resource is removed from the track.

- Marketing Campaigns
-- A company may pay for as many marketing campaigns as it can fill per turn
I I II III IV.  These slots are limited by phase just as factories are.
-- Each subsequent simulataneous marketing slot costs more to run concurrently on top of that marketing campaigns fee.  $0, $100, $200, $300, $400
-- Marketing slots are simply filled by workers

- Research Track
-- A company may pay for research in it's respective sector
-- Each research action pulls a card from the research deck.  +2 (major discovery), +1 (minor discovery), +0 (failed research)
-- Companies all have their own track markers, hitting certain goals will net your company grants (cash bonuses) or market favors (stock market advancement).  The first company to hit these bonsuses will receive a major reward. Every other company will receive the minor reward.
-- Every advancement in research also pushes the general technology sentiment tracker for the research track.  Once it hits certain markers, new phases will unlock for that sector.
-- Research always costs a flat fee per phase of $100 (I). $200 (II). $300 (III). $400 (IV).  Research also takes the respective amount of workers out of the pool until the next turn.

Marketing Campaigns and Research are conducted simultanesously.

