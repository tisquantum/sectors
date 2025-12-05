# Consumption Phase Fixes and Improvements

## Overview

This document describes the fixes and improvements made to the consumption phase to address bugs and implement proper consumer routing logic.

## Issues Fixed

### 1. Factory maxCustomers Limit Bug
**Problem**: Factories were accepting more consumers than their `maxCustomers` limit allowed (e.g., 6 consumers in a factory with maxCustomers of 3).

**Solution**: 
- Added strict enforcement of `maxCustomers` limit during consumer assignment
- Factories are filtered out once they reach capacity
- Added safety checks to prevent exceeding limits

### 2. Consumer Routing Logic
**Problem**: The previous routing logic used "attraction rating" (unitPrice - brandScore) which didn't match the intended game mechanics.

**Solution**: Implemented proper consumer routing with the following priority order:
1. **Resource Match**: Consumer goes to factories that produce the drawn resource preference
2. **Price Priority**: If multiple factories match, prefer cheaper factory (lower total unit price = sum of resource prices)
3. **Company Priority**: If price is tied, use company share value (currentStockPrice) - higher is better
4. **Top to Bottom Order**: If share value is tied, use factory slot order (lower slot = better)

## New Features

### Waiting Area System

Consumers that cannot be serviced by any factory are placed in a waiting area with capacity based on research stage:

- **Stage 1** (researchMarker 0-5): 3 spaces
- **Stage 2** (researchMarker 6-10): 5 spaces
- **Stage 3** (researchMarker 11-15): 7 spaces
- **Stage 4** (researchMarker 16+): 10 spaces

#### Waiting Area Behavior

1. **If waiting area doesn't fill**: Consumers stay in waiting area and their markers return to the draw bag for the next turn
2. **If waiting area overflows**: 
   - All consumers in waiting area return to global consumer pool
   - Sector loses 1 demand permanently
   - Markers are removed (not returned to bag)

## Implementation Details

### Schema Changes

Added `waitingArea` field to `Sector` model:
```prisma
model Sector {
  // ... existing fields
  waitingArea Int @default(0) // Consumers waiting for service
}
```

### Code Changes

#### Helper Methods Added

1. **`getWaitingAreaCapacity(researchStage: number): number`**
   - Returns waiting area capacity based on research stage

2. **`calculateFactoryTotalPrice(factory, resourcePriceMap): number`**
   - Calculates total unit price for a factory (sum of all resource prices in blueprint)

#### Consumption Phase Logic

The `handleConsumptionPhase` method has been completely rewritten with:

1. **Resource Price Fetching**: All resource prices are fetched once at the start for efficiency
2. **Factory Ordering**: Factories are ordered by slot (ascending) for "top to bottom" tie-breaking
3. **Strict Capacity Enforcement**: Factories are filtered out once they reach `maxCustomers`
4. **Waiting Area Management**: Consumers unable to be serviced are tracked in waiting area
5. **Demand Reduction**: Sectors lose 1 demand if waiting area overflows

### Consumer Routing Algorithm

```typescript
// 1. Find factories that can produce the resource
const matchingFactories = factories.filter(f => canProduceResource(f, drawnMarker));

// 2. Filter out full factories
const eligibleFactories = matchingFactories
  .filter(f => currentCustomers < maxCustomers)
  .sort((a, b) => {
    // Sort by total unit price (lower is better)
    if (aTotalPrice !== bTotalPrice) return aTotalPrice - bTotalPrice;
    
    // Sort by company share value (higher is better)
    if (aShareValue !== bShareValue) return bShareValue - aShareValue;
    
    // Sort by factory slot (lower is better - "top to bottom")
    return a.slot - b.slot;
  });

// 3. Assign to best factory or add to waiting area
if (eligibleFactories.length > 0) {
  assignToFactory(eligibleFactories[0]);
} else {
  addToWaitingArea();
}
```

## Example Scenarios

### Scenario 1: Factory Capacity Enforcement
- Factory A (FACTORY_I) has maxCustomers = 3
- 5 consumers want CIRCLE resource
- Factory A can produce CIRCLE
- **Result**: Factory A serves 3 consumers, 2 go to waiting area

### Scenario 2: Price-Based Routing
- Consumer draws CIRCLE marker
- Factory A: CIRCLE ($15) + SQUARE ($5) = $20 total
- Factory B: CIRCLE ($15) + CIRCLE ($15) = $30 total
- **Result**: Consumer goes to Factory A (cheaper)

### Scenario 3: Company Priority Tie-Breaker
- Consumer draws CIRCLE marker
- Factory A: $20 total, Company share value = $100, Slot 1
- Factory B: $20 total, Company share value = $150, Slot 2
- **Result**: Consumer goes to Factory B (higher share value)

### Scenario 4: Waiting Area Overflow
- Sector has 8 consumers waiting
- Research Stage 2 (capacity = 5)
- **Result**: All 8 consumers return to pool, sector demand reduced by 1

## Testing Checklist

- [x] Factory maxCustomers limit is strictly enforced
- [x] Consumers route to factories matching their resource preference
- [x] Price-based routing works correctly (lower total price wins)
- [x] Company priority tie-breaker works (higher share value wins)
- [x] Factory slot tie-breaker works (lower slot wins)
- [x] Waiting area capacity is correct for each research stage
- [x] Waiting area overflow triggers demand reduction
- [x] Waiting area consumers return to bag if not full
- [x] Temporary markers are deleted only when consumers are served
- [x] Permanent markers can be reused

## Migration Notes

After deploying these changes, you'll need to:

1. **Run Prisma migration** to add `waitingArea` field to Sector model:
   ```bash
   npx prisma migrate dev --name add_waiting_area_to_sector
   ```

2. **Existing games**: The `waitingArea` field will default to 0 for existing sectors

## Related Files

- `apps/server/src/game-management/modern-operation-mechanics.service.ts` - Main consumption phase logic
- `apps/server/prisma/schema.prisma` - Sector model with waitingArea field
- `apps/sectors/app/components/Company/Actions/BuildActions.tsx` - Factory configuration (maxCustomers)

## Future Improvements

Potential enhancements for future iterations:

1. Visual indicator of waiting area capacity in UI
2. Notification when waiting area is close to capacity
3. Historical tracking of waiting area usage
4. Analytics on consumer routing patterns

