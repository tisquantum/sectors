# Modern Operation Mechanics Implementation

## Overview
This document describes the implementation of the modern operation mechanics for the Sectors game, which introduces a factory-based production system with resource tracking, consumption bags, and dynamic pricing.

## Schema Changes

### New Model: ConsumptionMarker
```prisma
model ConsumptionMarker {
  id          String       @id @default(uuid())
  sectorId    String
  gameId      String
  resourceType ResourceType
  isPermanent Boolean      @default(true)
  companyId   String?
  
  Sector      Sector       @relation(fields: [sectorId], references: [id])
  Game        Game         @relation(fields: [gameId], references: [id])
  Company     Company?     @relation(fields: [companyId], references: [id])
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

**Purpose**: Tracks the consumption bag for each sector. Each sector has:
- 5 permanent sector-specific markers (default)
- Additional permanent markers added when factories are built
- Temporary markers added by marketing campaigns (discarded after drawing)

### Updated Model: FactoryConstructionOrder
Added fields:
- `gameTurnId`: Links to the game turn when order was placed
- `sectorId`: References the sector for easier querying

### Updated Relations
- `Sector` ← `ConsumptionMarker[]`
- `Company` ← `ConsumptionMarker[]`
- `Game` ← `ConsumptionMarker[]`
- `GameTurn` ← `FactoryConstructionOrder[]`

## Resource System Refactor

### Track-Based Pricing
Resources no longer use a `quantity` field. Instead:
- **trackPosition** (Int): Index into price arrays from constants
- **price** (Float): Current price, calculated from trackPosition
- **Consumption moves track DOWN** (increases trackPosition = cheaper prices)
- **Replenishment moves track UP** (decreases trackPosition = more expensive prices)

### Price Arrays
Resource prices defined in constants (e.g., `RESOURCE_PRICES_CIRCLE`, `RESOURCE_PRICES_SQUARE`, etc.)

## New Services

### ConsumptionMarkerService
Location: `/apps/server/src/consumption-marker/consumption-marker.service.ts`

Key Methods:
- `initializeSectorConsumptionBag()`: Create 5 permanent markers per sector
- `addFactoryMarkerToBag()`: Add permanent marker when factory built
- `addMarketingMarkersToBag()`: Add temporary markers from marketing
- `drawMarkerFromBag()`: Random draw for consumption phase
- `removeTemporaryMarker()`: Delete temporary markers after use

### Updated ResourceService
Location: `/apps/server/src/resource/resource.service.ts`

Key Changes:
- `consumeResources()`: Moves trackPosition down (cheaper)
- `addResources()`: Moves trackPosition up (more expensive)
- `updateResourcePrices()`: Updates prices from arrays based on trackPosition
- `getCurrentResourcePrice()`: Gets price for a resource based on its position

## Phase Flow Implementation

### Phase Sequence (Modern Operations)
```
START_TURN
  ↓
SHAREHOLDER_MEETING (voting for company actions)
  ↓
FACTORY_CONSTRUCTION (CEOs submit factory orders)
  ↓
FACTORY_CONSTRUCTION_RESOLVE (pay & build factories)
  ↓
MARKETING_AND_RESEARCH_ACTION (submit campaigns)
  ↓
MARKETING_AND_RESEARCH_ACTION_RESOLVE (process campaigns)
  ↓
CONSUMPTION_PHASE (draw from bags, serve customers)
  ↓
EARNINGS_CALL (calculate profits, adjust stock prices)
  ↓
END_TURN (degrade campaigns, update research)
```

### CONSUMPTION_PHASE
**File**: `modern-operation-mechanics.service.ts:451-604`

**Process**:
1. For each sector with customers:
   - Get all consumption markers in the bag
   - Get all operational factories
   - For each customer:
     - Draw random marker from bag
     - Find eligible factories that can produce that resource
     - Sort by attraction rating (unitPrice - brandScore)
     - Tie-breaker: prefer more complex factories (higher size)
     - Assign customer to best factory (if not full)
     - Remove temporary markers after drawing
2. Update sector scores:
   - Unserved customers → reduce sector score
   - All serviced → increase sector score by 1

**Key Logic**:
- Attraction Rating = `company.unitPrice - totalBrandBonus` (lower = better)
- Factory Complexity: FACTORY_IV > FACTORY_III > FACTORY_II > FACTORY_I
- Customer Limits per Factory: I=3, II=4, III=5, IV=6

### FACTORY_CONSTRUCTION_RESOLVE
**File**: `modern-operation-mechanics.service.ts:86-215`

**Process**:
1. Get all factory construction orders for this turn
2. Fetch current resource prices (SAME for all orders - simultaneous pricing)
3. For each order:
   - Calculate blueprint cost (sum of all resource prices)
   - Check if company can afford it
   - Deduct cash from company
   - Create factory (not operational until next turn)
   - Add permanent consumption marker to sector bag
   - Delete construction order
4. After ALL orders processed:
   - Consume resources (move tracks down)
   - Update resource prices globally
   - Update workforce track

**Important**: All companies pay the SAME resource prices (prevents front-running).

### MARKETING_AND_RESEARCH_ACTION_RESOLVE
**File**: `modern-operation-mechanics.service.ts:631-715`

**Process**:
1. **Marketing**:
   - Get all new marketing campaigns
   - Add temporary markers to sector consumption bags
   - Update company brand scores
   - Log campaign launches

2. **Research**:
   - Check research progress milestones
   - Grant rewards at milestones:
     - Progress 5: $200 grant
     - Progress 10: Market favor (stock boost)

### EARNINGS_CALL
**File**: `modern-operation-mechanics.service.ts:734-819`

**Process**:
1. For each floated company:
   - Calculate revenue: customers served × (unit price + sum of resource prices in blueprint)
   - Calculate costs: workers × base salary
   - Profit = Revenue - Costs
2. Update company cash
3. Adjust stock price based on profit:
   - Profit > $500: +3 steps
   - Profit > $200: +2 steps
   - Profit > $0: +1 step
   - Profit < -$200: -2 steps
   - Profit < $0: -1 step

**Note**: Stock price adjustment would integrate with existing StockHistoryService.

### END_TURN (Modern Extension)
**File**: `modern-operation-mechanics.service.ts:821-917`

**Process**:
1. **Degrade Marketing Campaigns**:
   - ACTIVE → DECAYING
   - DECAYING → Expired (deleted)
   - Reduce brand scores
   - Return workers to pool

2. **Update Research Progress**:
   - Calculate total research per sector
   - Update technology levels based on milestones:
     - 5+ progress: Level 1 (2 factory slots)
     - 15+ progress: Level 2 (3 factory slots)
     - 30+ progress: Level 3 (4 factory slots)
     - 50+ progress: Level 4 (5 factory slots)

## Game Initialization (Modern)

### InitializeConsumptionBags()
**File**: `game-management.service.ts:5798-5825`

Called during game start for modern mechanics:
- Creates 5 permanent consumption markers per sector
- Uses sector-specific resource types
- Logs initialization

## Key Design Decisions

### 1. Simultaneous Resource Pricing
Factory constructions all pay the SAME resource price at the start of the phase, preventing strategic ordering advantages.

### 2. Attraction Rating
Customers prefer companies with the lowest effective price (unit price - brand score), with tie-breaking to more complex factories.

### 3. Factory Operational Delay
Factories built in a turn become operational in the NEXT turn, giving time for resource allocation and strategic planning.

### 4. Marketing Decay System
- **Turn 1** (ACTIVE): Full brand bonus, temporary markers active
- **Turn 2** (DECAYING): Full brand bonus, markers consumed
- **Turn 3**: Expires, brand bonus removed, workers returned

### 5. Research Milestone System
Progressive rewards encourage sustained investment:
- Early milestone (5): Cash grant
- Mid milestone (10): Stock market favor
- Sector-wide milestones unlock factory phases

## Constants Added

```typescript
export const MARKETING_SLOT_COSTS = [0, 100, 200, 300, 400];
export const RESEARCH_COSTS_BY_PHASE = [100, 200, 300, 400];
export const DEFAULT_CONSUMPTION_MARKERS_PER_SECTOR = 5;
export const FACTORY_WORKER_REQUIREMENTS = { FACTORY_I: 2, II: 4, III: 6, IV: 8 };
export const FACTORY_CUSTOMER_LIMITS = { FACTORY_I: 3, II: 4, III: 5, IV: 6 };
export const BASE_WORKER_SALARY = 10;
```

## Integration Points

### ModernOperationMechanicsService
Injected into `GameManagementService` and checked first in `handlePhase()`:
```typescript
if (game.operationMechanicsVersion === OperationMechanicsVersion.MODERN) {
  const handled = await this.modernOperationMechanicsService.handlePhase(phase, game);
  if (handled) return; // Phase handled by modern mechanics
}
// Fall through to legacy handling
```

### Dependencies
- ConsumptionMarkerService
- ResourceService
- FactoryService
- MarketingService
- FactoryConstructionOrderService
- CompanyService
- SectorService
- GameLogService

## Testing Considerations

### Resource Track Testing
- Verify trackPosition increments when consuming
- Verify prices update correctly from arrays
- Test bounds (don't exceed array length)

### Consumption Bag Testing
- Verify 5 permanent markers created per sector
- Verify factory markers added on construction
- Verify temporary markers removed after drawing
- Test random drawing logic

### Earnings Calculation
- Verify revenue = customers × (unit price + sum of resource prices)
- Verify worker costs deducted
- Test stock price step calculations

## Future Enhancements

1. **Shareholder Meeting Implementation**: Full voting system for company actions
2. **Worker Salary Dynamics**: Link to sector scores and resource prices
3. **Factory Servicing Tracking**: Persist customer counts per factory for accurate revenue
4. **Research Card System**: Draw cards based on research actions
5. **Phase Unlock System**: Dynamic phase availability based on technology level

## Migration Notes

### From Legacy to Modern
If migrating existing games:
1. Initialize resource tracks with `createInitialResourceTrackValues()`
2. Initialize consumption bags with `initializeConsumptionBags()`
3. Set `game.operationMechanicsVersion = MODERN`
4. Set `game.workers = DEFAULT_WORKERS (60)`

### Backward Compatibility
Legacy games continue using old operation mechanics. The routing in `handlePhase()` ensures no breaking changes.

