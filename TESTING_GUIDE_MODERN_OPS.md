# Testing Guide - Modern Operation Mechanics

## Phase-by-Phase Testing

### START_TURN
**What to Test**:
- [ ] Resource prices update from trackPosition
- [ ] Workforce tracking calculates correctly
- [ ] Non-operational factories become operational
- [ ] Game cache updates with current turn

**Expected Results**:
```
✓ All resource prices match their trackPosition index
✓ Workers calculated: game.workers - (factory workers + marketing workers)
✓ Economy score reflects workforce allocation
✓ Game log: "Workforce track updated..."
✓ Game log: "[Company] factory is now operational" (for each new factory)
```

**Test Cases**:
```typescript
// Test 1: New game initialization
- Start modern game
- Verify resources at trackPosition 0
- Verify prices match RESOURCE_PRICES_*[0]

// Test 2: Factory operational status
- Build factory in turn N
- Advance to turn N+1 START_TURN
- Verify factory.isOperational = true
```

---

### FACTORY_CONSTRUCTION
**What to Test**:
- [ ] CEOs can submit construction orders
- [ ] Non-CEOs cannot submit orders
- [ ] Technology level limits factory count
- [ ] Resource types validated (must include sector resource)

**Expected Results**:
```
✓ FactoryConstructionOrder created with correct gameTurnId
✓ Order includes sectorId, playerId, companyId
✓ resourceTypes array properly stored
```

**Test Cases**:
```typescript
// Test 1: CEO authority
- Player with most shares can submit
- Player with fewer shares gets rejected

// Test 2: Technology limits
- Sector at tech level 1 → max 2 factories
- Attempt 3rd factory → rejected

// Test 3: Resource requirements
- FACTORY_I: 1 sector + 1 global resource
- FACTORY_II: 1 sector + 2 global resources
- Verify validation
```

---

### FACTORY_CONSTRUCTION_RESOLVE
**What to Test**:
- [ ] Blueprint costs calculated correctly (simultaneous pricing)
- [ ] Companies with insufficient funds rejected
- [ ] Resources consumed after all orders processed
- [ ] Consumption markers added to bags
- [ ] Track positions updated

**Expected Results**:
```
✓ All orders see same resource prices
✓ Factory created with isOperational = false
✓ Company cash reduced by blueprint cost
✓ Permanent consumption marker created
✓ Resource trackPosition increased by total consumption
✓ Resource prices updated globally
```

**Test Cases**:
```typescript
// Test 1: Simultaneous pricing
- 3 companies order CIRCLE resource
- All pay same price (e.g., RESOURCE_PRICES_CIRCLE[0])
- After all orders: trackPosition = 3
- Next price = RESOURCE_PRICES_CIRCLE[3]

// Test 2: Insufficient funds
- Company with $50 cash
- Factory costs $200
- Order rejected, game log created

// Test 3: Consumption marker
- Build FACTORY_II with [HEALTHCARE, TRIANGLE, SQUARE]
- Verify ConsumptionMarker created with:
  - resourceType = HEALTHCARE (first in array)
  - isPermanent = true
  - companyId = company.id
```

---

### MARKETING_AND_RESEARCH_ACTION
**What to Test**:
- [ ] Marketing campaigns created with correct tier
- [ ] Worker allocation respected
- [ ] Slot costs applied correctly
- [ ] Research investments deduct cash
- [ ] Phase limits enforced

**Expected Results**:
```
✓ MarketingCampaign created with status = ACTIVE
✓ Company cash reduced by (base cost + slot penalty)
✓ Workers deducted from game pool
✓ Research progress incremented
```

**Test Cases**:
```typescript
// Test 1: Slot costs
- Tier 1 in slot 1: $100 + $0 = $100
- Tier 2 in slot 3: $200 + $200 = $400
- Verify correct cash deduction

// Test 2: Worker availability
- Game has 10 workers
- Attempt Tier 3 campaign (3 workers) → success
- Attempt another Tier 3 → rejected (only 7 left)

// Test 3: Research phase costs
- Phase 1: $100
- Phase 2: $200
- Verify costs enforced
```

---

### MARKETING_AND_RESEARCH_ACTION_RESOLVE
**What to Test**:
- [ ] Temporary markers added to consumption bag
- [ ] Brand scores updated
- [ ] Research milestones trigger rewards
- [ ] Technology levels update

**Expected Results**:
```
✓ Tier 1: 1 temporary marker added
✓ Tier 2: 2 temporary markers added  
✓ Tier 3: 3 temporary markers added
✓ Brand score = company.brandScore + campaign.brandBonus
✓ Research progress 5 → +$200 grant
✓ Research progress 10 → +1 market favor
✓ Sector tech level updates at milestones (5, 15, 30, 50)
```

**Test Cases**:
```typescript
// Test 1: Marketing markers
- Company launches Tier 3 campaign in HEALTHCARE
- Verify 3 ConsumptionMarkers created:
  - sectorId = healthcare sector
  - resourceType = HEALTHCARE
  - isPermanent = false
  - companyId = company.id

// Test 2: Research milestones
- Company at researchProgress = 4
- Invest $100 (draws card, gets +1)
- researchProgress = 5
- Verify: cashOnHand += 200, researchGrants += 1

// Test 3: Technology unlock
- All companies in MATERIALS have total progress = 15
- Sector technologyLevel: 1 → 2
- Game log: "MATERIALS technology advanced to level 2"
```

---

### CONSUMPTION_PHASE
**What to Test**:
- [ ] Markers drawn randomly (one per customer)
- [ ] Factories sorted by attraction rating
- [ ] Complex factories preferred in ties
- [ ] Factory capacity limits respected
- [ ] Temporary markers removed after drawing
- [ ] Sector scores update correctly

**Expected Results**:
```
✓ Each customer triggers one marker draw
✓ Customer assigned to lowest attraction rating factory
✓ Factory cannot exceed customer limit
✓ Temporary markers deleted after use
✓ All customers served → sector.demand += 1
✓ N unserved → sector.demand -= N
```

**Test Cases**:
```typescript
// Test 1: Attraction rating
- Company A: unitPrice $20, brandScore 5 → rating 15
- Company B: unitPrice $18, brandScore 2 → rating 16
- Customer draws marker → goes to Company A (lower rating)

// Test 2: Factory complexity tie-breaker
- Company A: FACTORY_I, rating 15
- Company B: FACTORY_IV, rating 15
- Customer → Company B (more complex)

// Test 3: Capacity limits
- FACTORY_I serves max 3 customers
- 4 customers need this resource
- First 3 → Factory I
- 4th → unserved (sector score reduces)

// Test 4: Temporary marker removal
- Marketing campaign added 3 temporary markers
- 3 customers draw them
- Verify: 3 ConsumptionMarkers deleted
- Permanent markers remain

// Test 5: Sector score adjustment
Scenario A: All 10 customers served
- sector.demand: 5 → 6 (+1)

Scenario B: Only 7/10 customers served
- sector.demand: 5 → 2 (-3)
```

---

### EARNINGS_CALL
**What to Test**:
- [ ] Revenue calculated correctly
- [ ] Resource prices fetched accurately
- [ ] Worker costs calculated
- [ ] Profit/loss determined
- [ ] Stock price steps correct
- [ ] Cash updated

**Expected Results**:
```
✓ Revenue = customers × (unit price + Σ resource prices)
✓ Costs = workers × base salary
✓ Profit = Revenue - Costs
✓ Stock adjustment matches profit thresholds
✓ Company cash updated
```

**Test Cases**:
```typescript
// Test 1: Revenue calculation
- Factory with blueprint: [HEALTHCARE($5), TRIANGLE($10), SQUARE($15)]
- Unit price: $20
- Customers served: 3
- Revenue = 3 × (20 + 5 + 10 + 15) = 3 × 50 = $150

// Test 2: Worker costs
- Factory has 4 workers
- Base salary: $10
- Costs = 4 × 10 = $40

// Test 3: Stock price steps
- Profit $600 → +3 steps
- Profit $250 → +2 steps
- Profit $50 → +1 step
- Profit -$50 → -1 step
- Profit -$250 → -2 steps
```

---

### END_TURN
**What to Test**:
- [ ] Marketing campaigns degrade (ACTIVE → DECAYING → delete)
- [ ] Brand scores reduce when campaigns expire
- [ ] Workers returned to pool when campaigns expire
- [ ] Sector technology levels update

**Expected Results**:
```
✓ All ACTIVE campaigns → DECAYING
✓ All DECAYING campaigns deleted
✓ Brand scores reduced by expired campaign bonuses
✓ Workers returned to game.workers pool
✓ Sector tech levels updated based on total research
```

**Test Cases**:
```typescript
// Test 1: Campaign lifecycle
Turn 1 (created): status = ACTIVE, brandScore +3
Turn 2 (END_TURN): status = DECAYING, brandScore still +3
Turn 3 (END_TURN): deleted, brandScore -3, workers +3

// Test 2: Technology levels
- MATERIALS total research: 14 → tech level 1
- One company researches: total = 16 → tech level 2
- Game log: "MATERIALS technology advanced to level 2"
```

---

## Integration Testing

### Full Turn Cycle
```typescript
// Test complete modern turn
1. START_TURN
   - Resources price at position 0
   - 60 workers available
   
2. FACTORY_CONSTRUCTION
   - Company A (CEO: Player 1) orders FACTORY_II
   - resourceTypes: [HEALTHCARE, TRIANGLE, SQUARE]
   
3. FACTORY_CONSTRUCTION_RESOLVE
   - Verify cost = HEALTHCARE[0] + TRIANGLE[0] + SQUARE[0]
   - Verify factory created (isOperational = false)
   - Verify trackPositions: HEALTHCARE+1, TRIANGLE+1, SQUARE+1
   - Verify consumption marker added to HEALTHCARE bag
   
4. MARKETING_AND_RESEARCH_ACTION
   - Company A launches Tier 2 marketing (slot 1)
   - Company B invests $100 in research
   
5. MARKETING_AND_RESEARCH_ACTION_RESOLVE
   - Verify 2 temporary markers in HEALTHCARE bag
   - Verify Company A brandScore += 2
   - Verify Company B researchProgress += random(0-2)
   
6. CONSUMPTION_PHASE
   - HEALTHCARE has 5 customers
   - Verify 5 markers drawn
   - Verify customers routed by attraction rating
   - Verify temporary markers removed
   - Verify sector score updates
   
7. EARNINGS_CALL
   - Calculate expected revenue
   - Calculate expected costs
   - Verify profit
   - Verify stock price adjustment
   
8. END_TURN
   - Verify ACTIVE campaigns → DECAYING
   - Verify research progress checked
```

## Edge Cases

### Resource Exhaustion
```typescript
// What if trackPosition exceeds array length?
- Resource at trackPosition 9
- Array has 10 items (indices 0-9)
- Consume 2 more → trackPosition 11
- Price should use array[9] (last element)
```

### Empty Consumption Bag
```typescript
// What if bag has fewer markers than customers?
- Bag has 5 markers
- Sector has 10 customers
- Result: 5 served, 5 unserved
- Sector score: -5
```

### No Eligible Factories
```typescript
// What if no factory can produce drawn resource?
- Marker drawn: CIRCLE
- All factories use: [HEALTHCARE, TRIANGLE, SQUARE]
- Result: Customer unserved, sector score -1
```

### Factory Oversubscription
```typescript
// Multiple customers need same factory
- FACTORY_I capacity: 3
- 5 customers draw compatible markers
- Result: First 3 served, 2 unserved
```

## Performance Considerations

### Database Queries
- Batch resource price lookups (use Map)
- Single query for all consumption markers per sector
- Parallel processing where possible

### Optimization Opportunities
```typescript
// GOOD: Fetch all resources once
const resources = await resourceService.resourcesByGame(gameId);
const priceMap = new Map();
for (const r of resources) {
  priceMap.set(r.type, await getCurrentResourcePrice(r));
}

// BAD: Query in loop
for (const order of orders) {
  const price = await getResourcePrice(gameId, order.resourceType);
}
```

## Debugging Tools

### Helpful Queries
```sql
-- Check consumption bag contents
SELECT 
  s.sectorName,
  cm.resourceType,
  cm.isPermanent,
  c.name as companyName,
  COUNT(*) as count
FROM "ConsumptionMarker" cm
JOIN "Sector" s ON cm.sectorId = s.id
LEFT JOIN "Company" c ON cm.companyId = c.id
WHERE cm.gameId = 'game-id'
GROUP BY s.sectorName, cm.resourceType, cm.isPermanent, c.name;

-- Check resource track positions
SELECT 
  type,
  trackType,
  trackPosition,
  price
FROM "Resource"
WHERE gameId = 'game-id'
ORDER BY trackType, type;

-- Check factory status
SELECT 
  c.name as companyName,
  f.size,
  f.isOperational,
  f.workers,
  f.resourceTypes
FROM "Factory" f
JOIN "Company" c ON f.companyId = c.id
WHERE f.gameId = 'game-id';
```

### Game Log Monitoring
Search for these key phrases:
- "built FACTORY_" → Factory construction success
- "cannot afford factory" → Insufficient funds
- "launched marketing campaign" → Campaign activated
- "marketing campaign expired" → Campaign lifecycle
- "factory is now operational" → Factory activation
- "serviced all customers" → Full sector service
- "failed to service" → Partial sector service
- "earnings: Revenue" → Profit calculation

## Common Issues & Solutions

### Issue: "Resource not found"
**Cause**: Resource tracks not initialized for game
**Solution**: Ensure `createInitialResourceTrackValues()` called on game start

### Issue: "No consumption markers in bag"
**Cause**: Consumption bags not initialized
**Solution**: Ensure `initializeConsumptionBags()` called on game start

### Issue: "Factory construction failed"
**Cause**: Missing required fields in order
**Solution**: Verify order includes gameTurnId, sectorId, playerId

### Issue: "Factories never become operational"
**Cause**: START_TURN not making factories operational
**Solution**: Verify `makeFactoriesOperational()` is called in START_TURN handler

### Issue: "Marketing markers not removed"
**Cause**: Temporary markers not being deleted in consumption phase
**Solution**: Verify `!marker.isPermanent` check and delete call

## Validation Scripts

### Verify Game State
```typescript
async function validateModernGameState(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  
  // Check resources initialized
  const resources = await prisma.resource.count({ where: { gameId } });
  console.log(`✓ Resources: ${resources} (expected: 13 for 3 sectors + 3 global)`);
  
  // Check consumption bags initialized
  const markers = await prisma.consumptionMarker.count({ 
    where: { gameId, isPermanent: true } 
  });
  console.log(`✓ Permanent markers: ${markers} (expected: 15 for 3 sectors × 5)`);
  
  // Check worker pool
  console.log(`✓ Workers available: ${game.workers} / ${DEFAULT_WORKERS}`);
  
  // Check economy score
  console.log(`✓ Economy score: ${game.economyScore}`);
}
```

### Verify Consumption Phase Results
```typescript
async function validateConsumptionPhase(gameId: string, sectorId: string) {
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    include: { consumptionMarkers: true },
  });
  
  console.log(`Sector: ${sector.sectorName}`);
  console.log(`Customers: ${sector.consumers}`);
  console.log(`Markers in bag: ${sector.consumptionMarkers.length}`);
  console.log(`Permanent: ${sector.consumptionMarkers.filter(m => m.isPermanent).length}`);
  console.log(`Temporary: ${sector.consumptionMarkers.filter(m => !m.isPermanent).length}`);
}
```

### Verify Resource Pricing
```typescript
async function validateResourcePricing(gameId: string) {
  const resources = await prisma.resource.findMany({ where: { gameId } });
  
  for (const resource of resources) {
    const priceArray = getResourcePriceForResourceType(resource.type);
    const expectedPrice = priceArray[resource.trackPosition];
    
    if (resource.price !== expectedPrice) {
      console.error(`❌ ${resource.type}: price ${resource.price} !== expected ${expectedPrice}`);
    } else {
      console.log(`✓ ${resource.type}: $${resource.price} at position ${resource.trackPosition}`);
    }
  }
}
```

## Load Testing

### Scenario: 10 Companies, 3 Sectors, 100 Customers
```typescript
// Expected performance
- FACTORY_CONSTRUCTION_RESOLVE: < 5 seconds
- CONSUMPTION_PHASE: < 10 seconds (with animation)
- EARNINGS_CALL: < 3 seconds
- Total turn time: ~20-30 seconds server-side
```

## Regression Testing

### Ensure Legacy Games Still Work
```typescript
// Test that LEGACY mechanics unaffected
1. Create game with operationMechanicsVersion = LEGACY
2. Verify legacy phase flow works
3. Verify no consumption bags created
4. Verify no resource tracks created
5. Verify legacy production calculations work
```

## Acceptance Criteria

### Phase Implementation ✅
- [x] All 6 modern phases handled
- [x] Proper error handling
- [x] Comprehensive game logging
- [x] Backward compatibility maintained

### Data Integrity ✅
- [x] Resources use trackPosition correctly
- [x] Consumption bags manage markers properly
- [x] Factories track operational status
- [x] Marketing campaigns lifecycle correctly

### Business Logic ✅
- [x] Attraction rating sorting works
- [x] Simultaneous resource pricing implemented
- [x] Factory customer limits enforced
- [x] Sector scoring based on service quality
- [x] Research milestones grant rewards
- [x] Technology levels unlock phases

### Code Quality ✅
- [x] No linter errors
- [x] TypeScript types properly defined
- [x] Modules properly wired
- [x] Services exported correctly
- [x] Documentation complete

## Ready for Testing

All core functionality is implemented and ready for:
1. Unit testing of individual phase handlers
2. Integration testing of full turn cycles
3. Frontend development and UI integration
4. End-to-end gameplay testing

## Next Steps After Testing

Based on test results, prioritize:
1. Customer count persistence (if earnings inaccurate)
2. Worker salary dynamics (if needed for balance)
3. Shareholder meeting voting (for complete CEO feature)
4. Research card drawing system (for gameplay variety)

