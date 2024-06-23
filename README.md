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