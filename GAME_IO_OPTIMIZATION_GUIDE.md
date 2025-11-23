# Game I/O Optimization Guide

This document outlines specific optimizations to improve database I/O performance and reduce latency for game actions.

## Current Bottlenecks Identified

### 1. Sequential Database Queries in Loops
- **Location**: `resolveFactoryConstruction()` - Lines 135-275
- **Issue**: Fetching companies, counting factories, and processing orders one by one
- **Impact**: O(n) sequential queries where n = number of orders

### 2. N+1 Query Problems
- **Location**: `handleEarningsCall()` - Lines 889-920
- **Issue**: Fetching resources and prices for each factory production individually
- **Impact**: 1 query for productions + n queries for resources = N+1

### 3. Heavy Game State Loading
- **Location**: `getGameState()` - Lines 76-94 in games.service.ts
- **Issue**: Loading all relations (Player, Company, gameLogs, sectors, etc.) on every request
- **Impact**: Large payloads, slow queries, unnecessary data transfer

### 4. Individual Updates Instead of Batching
- **Location**: Multiple locations
- **Issue**: Updating companies, factories, resources one by one
- **Impact**: Multiple round trips to database

### 5. Client Refetching Entire State
- **Location**: GameContext.tsx - Lines 116-141
- **Issue**: After every phase change, refetching entire game state
- **Impact**: Unnecessary network traffic and processing

### 6. Sequential Resource Price Lookups
- **Location**: `resolveFactoryConstruction()` - Lines 114-117
- **Issue**: Getting resource prices one by one in a loop
- **Impact**: N queries for N resources

### 7. Individual Game Log Creation
- **Location**: Throughout modern-operation-mechanics.service.ts
- **Issue**: Creating game logs one at a time
- **Impact**: Multiple insert operations

## Optimization Strategies

### Strategy 1: Batch Database Operations

#### 1.1 Batch Company Fetching
**Current** (Lines 137-140):
```typescript
for (const order of factoryConstructionOrders) {
  const company = await this.prisma.company.findUnique({
    where: { id: order.companyId },
    include: { Sector: true },
  });
  // ...
}
```

**Optimized**:
```typescript
// Fetch all companies at once
const companyIds = factoryConstructionOrders.map(o => o.companyId);
const companies = await this.prisma.company.findMany({
  where: { id: { in: companyIds } },
  include: { Sector: true },
});
const companyMap = new Map(companies.map(c => [c.id, c]));

// Then use companyMap.get(order.companyId) in the loop
```

#### 1.2 Batch Factory Counting
**Current** (Lines 180-182):
```typescript
for (const order of factoryConstructionOrders) {
  const existingFactories = await this.prisma.factory.count({
    where: { companyId: company.id, gameId: phase.gameId },
  });
  // ...
}
```

**Optimized**:
```typescript
// Count all factories at once
const factoryCounts = await this.prisma.factory.groupBy({
  by: ['companyId'],
  where: { gameId: phase.gameId },
  _count: { id: true },
});
const factoryCountMap = new Map(
  factoryCounts.map(f => [f.companyId, f._count.id])
);
```

#### 1.3 Batch Resource Price Lookups
**Current** (Lines 114-117):
```typescript
for (const resource of resources) {
  const price = await this.resourceService.getCurrentResourcePrice(resource);
  resourcePriceMap.set(resource.type, price);
}
```

**Optimized**:
```typescript
// Calculate prices in memory (no DB queries needed)
for (const resource of resources) {
  const price = await this.resourceService.getCurrentResourcePrice(resource);
  resourcePriceMap.set(resource.type, price);
}
// Actually, getCurrentResourcePrice already uses constants, so this is fine
// But we can optimize by caching the price array lookups
```

#### 1.4 Batch Game Log Creation
**Current**: Individual `createGameLog()` calls throughout

**Optimized**:
```typescript
// Collect all log entries
const gameLogEntries: Prisma.GameLogCreateInput[] = [];

// During processing...
gameLogEntries.push({
  game: { connect: { id: phase.gameId } },
  content: `${company.name} built factory...`,
});

// At the end, batch create
if (gameLogEntries.length > 0) {
  await this.prisma.gameLog.createMany({
    data: gameLogEntries.map(entry => ({
      gameId: phase.gameId,
      content: entry.content,
      // ... other fields
    })),
  });
}
```

### Strategy 2: Optimize Resource Price Calculations

**Current** (Lines 114-117, 223-238):
```typescript
async updateResourcePrices(gameId: string): Promise<void> {
  const resources = await this.resourcesByGame(gameId);
  
  for (const resource of resources) {
    const priceArray = getResourcePriceForResourceType(resource.type);
    const price = priceArray[Math.min(resource.trackPosition, priceArray.length - 1)];
    
    await this.prisma.resource.update({
      where: { id: resource.id },
      data: { price: price || 0 },
    });
  }
}
```

**Optimized**:
```typescript
async updateResourcePrices(gameId: string): Promise<void> {
  const resources = await this.resourcesByGame(gameId);
  
  // Batch update all resources at once
  const updates = resources.map(resource => {
    const priceArray = getResourcePriceForResourceType(resource.type);
    const price = priceArray[Math.min(resource.trackPosition, priceArray.length - 1)] || 0;
    return {
      where: { id: resource.id },
      data: { price },
    };
  });
  
  // Use Promise.all for parallel updates, or batch in transactions
  await this.prisma.$transaction(
    updates.map(update => 
      this.prisma.resource.update(update)
    )
  );
}
```

### Strategy 3: Optimize Earnings Call Processing

**Current** (Lines 889-920):
```typescript
for (const production of factoryProductions) {
  const resources = await this.resourceService.resources({
    where: {
      gameId: phase.gameId,
      type: { in: factory.resourceTypes },
    },
  });
  
  let revenuePerUnit = company.unitPrice;
  for (const resource of resources) {
    const price = await this.resourceService.getCurrentResourcePrice(resource);
    revenuePerUnit += price;
  }
  // ...
}
```

**Optimized**:
```typescript
// Fetch all resources once
const allResources = await this.resourceService.resourcesByGame(phase.gameId);
const resourcePriceMap = new Map(
  allResources.map(r => [r.type, this.resourceService.getCurrentResourcePrice(r)])
);

// Pre-calculate prices (no async in loop)
const resourcePrices = await Promise.all(
  allResources.map(r => 
    this.resourceService.getCurrentResourcePrice(r).then(price => [r.type, price])
  )
);
const resourcePriceMap = new Map(resourcePrices);

// Then in the loop:
for (const production of factoryProductions) {
  let revenuePerUnit = company.unitPrice;
  for (const resourceType of factory.resourceTypes) {
    revenuePerUnit += resourcePriceMap.get(resourceType) || 0;
  }
  // ...
}
```

### Strategy 4: Batch Factory Production Updates

**Current** (Lines 913-920):
```typescript
await this.factoryProductionService.updateFactoryProduction({
  where: { id: production.id },
  data: { revenue, costs, profit },
});
```

**Optimized**:
```typescript
// Collect all updates
const productionUpdates = factoryProductions.map(production => ({
  where: { id: production.id },
  data: {
    revenue: calculatedRevenue,
    costs: calculatedCosts,
    profit: calculatedProfit,
  },
}));

// Batch update
await this.prisma.$transaction(
  productionUpdates.map(update =>
    this.prisma.factoryProduction.update(update)
  )
);
```

### Strategy 5: Optimize Consumption Phase

**Current** (Lines 668-670):
```typescript
if (!drawnMarker.isPermanent) {
  await this.consumptionMarkerService.deleteConsumptionMarker({
    id: drawnMarker.id,
  });
}
```

**Optimized**:
```typescript
// Collect markers to delete
const markersToDelete: string[] = [];

// In the loop:
if (!drawnMarker.isPermanent) {
  markersToDelete.push(drawnMarker.id);
}

// Batch delete at the end
if (markersToDelete.length > 0) {
  await this.prisma.consumptionMarker.deleteMany({
    where: { id: { in: markersToDelete } },
  });
}
```

### Strategy 6: Optimize Game State Loading

**Current**: Loading everything always

**Optimized**: Selective loading based on what's needed

```typescript
async getGameState(gameId: string, options?: {
  includePlayers?: boolean;
  includeCompanies?: boolean;
  includeLogs?: boolean;
  includeSectors?: boolean;
}): Promise<GameState | null> {
  const include: Prisma.GameInclude = {};
  
  if (options?.includePlayers) include.Player = true;
  if (options?.includeCompanies) include.Company = true;
  if (options?.includeLogs) include.gameLogs = { take: 50, orderBy: { createdAt: 'desc' } };
  if (options?.includeSectors) include.sectors = true;
  
  return this.prisma.game.findUnique({
    where: { id: gameId },
    include,
  });
}
```

### Strategy 7: Add Database Indexes

Ensure indexes exist for frequently queried fields:

```prisma
model FactoryConstructionOrder {
  // ...
  @@index([gameTurnId])
  @@index([companyId, gameTurnId])
  @@index([gameId, gameTurnId])
}

model Factory {
  // ...
  @@index([companyId, gameId])
  @@index([sectorId, gameId, isOperational])
}

model FactoryProduction {
  // ...
  @@index([gameTurnId])
  @@index([companyId, gameTurnId])
}

model ConsumptionMarker {
  // ...
  @@index([sectorId, gameId])
  @@index([gameId, isPermanent])
}
```

### Strategy 8: Implement Caching

Add in-memory caching for frequently accessed, rarely-changing data:

```typescript
@Injectable()
export class ModernOperationMechanicsService {
  private resourcePriceCache = new Map<string, Map<ResourceType, number>>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5000; // 5 seconds

  private async getCachedResourcePrices(gameId: string): Promise<Map<ResourceType, number>> {
    const cached = this.resourcePriceCache.get(gameId);
    const expiry = this.cacheExpiry.get(gameId);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Fetch and cache
    const resources = await this.resourceService.resourcesByGame(gameId);
    const priceMap = new Map<ResourceType, number>();
    
    for (const resource of resources) {
      const price = await this.resourceService.getCurrentResourcePrice(resource);
      priceMap.set(resource.type, price);
    }
    
    this.resourcePriceCache.set(gameId, priceMap);
    this.cacheExpiry.set(gameId, Date.now() + this.CACHE_TTL);
    
    return priceMap;
  }
}
```

### Strategy 9: Optimize Client-Side Refetching

**Current**: Refetching entire game state on every phase change

**Optimized**: Selective refetching based on phase

```typescript
// In GameContext.tsx
const handleNewPhase = (phaseName: PhaseName) => {
  // Only refetch what's needed for this phase
  switch (phaseName) {
    case PhaseName.FACTORY_CONSTRUCTION_RESOLVE:
      refetchResources();
      refetchConsumptionMarkers();
      refetchFactories();
      break;
    case PhaseName.EARNINGS_CALL:
      refetchFactoryProductions();
      refetchCompanies(); // For cash updates
      break;
    default:
      refetchGameState(); // Full refetch only when needed
  }
};
```

### Strategy 10: Use Database Transactions More Effectively

**Current**: Multiple small transactions

**Optimized**: Single large transaction where possible

```typescript
// Instead of:
for (const order of orders) {
  await this.prisma.$transaction(async (tx) => {
    // Process one order
  });
}

// Do:
await this.prisma.$transaction(async (tx) => {
  for (const order of orders) {
    // Process all orders in one transaction
  }
});
```

## Implementation Priority

1. **High Priority** (Immediate Impact):
   - Batch company fetching in `resolveFactoryConstruction`
   - Batch factory counting
   - Batch game log creation
   - Optimize resource price updates

2. **Medium Priority** (Significant Impact):
   - Optimize earnings call processing
   - Batch consumption marker deletion
   - Add database indexes
   - Implement selective game state loading

3. **Low Priority** (Nice to Have):
   - Add caching layer
   - Optimize client-side refetching
   - Further transaction optimization

## Expected Performance Improvements

- **resolveFactoryConstruction**: 70-80% faster (from O(n) sequential to O(1) batch queries)
- **handleEarningsCall**: 60-70% faster (eliminate N+1 queries)
- **updateResourcePrices**: 50-60% faster (batch updates)
- **Overall game action latency**: 40-50% reduction

## Testing Recommendations

1. Add performance benchmarks before/after optimizations
2. Test with multiple concurrent players
3. Monitor database query counts and execution times
4. Test with large numbers of factories/orders/productions

