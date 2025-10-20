# Backend Testing - Step-by-Step Guide

## 🚀 Quick Start

Follow these steps to verify your modern operation mechanics implementation.

---

## Step 1: Generate Prisma Client ⚡

**Required**: Regenerate Prisma client to include new models

```bash
cd /home/brett/dev/nextjs-nestjs-trpc
npx prisma generate --schema=./apps/server/prisma/schema.prisma
```

**Expected output**:
```
✔ Generated Prisma Client
```

**Verify**:
- No errors
- TypeScript types generated for `ConsumptionMarker`, `FactoryProduction`

---

## Step 2: Run Manual Test Script 🧪

```bash
cd /home/brett/dev/nextjs-nestjs-trpc
npx ts-node apps/server/test-modern-ops.ts
```

**Expected output**:
```
🧪 MODERN OPERATION MECHANICS - BACKEND TEST

✓ Test room and user created
✓ Game created: [game-id]
✓ Created 6 resources
✓ Consumption bag initialized with 5 permanent markers
✓ Player created: TestCEO
✓ Company created: MediCorp
✓ Factory construction order created
✓ Factory built successfully
✓ Consumption markers: 5 → 6 (+1 from factory)
✓ FactoryProduction record created
✓ Earnings processed

✅ ALL TESTS PASSED!
```

**What this validates**:
- ✅ Game initialization with MODERN mechanics
- ✅ Resource tracks created at position 0
- ✅ Consumption bags initialized (5 markers per sector)
- ✅ Factory construction flow
- ✅ Resource consumption and price updates
- ✅ Consumption markers added
- ✅ FactoryProduction records created
- ✅ Earnings calculations accurate

---

## Step 3: Database Inspection 🔍

### Check Resources
```sql
SELECT 
  type,
  trackType,
  trackPosition,
  price
FROM "Resource"
WHERE "gameId" = '[your-game-id]'
ORDER BY trackType, type;
```

**Expected**:
- 3 GLOBAL resources (CIRCLE, SQUARE, TRIANGLE)
- N SECTOR resources (one per sector in game)
- All at trackPosition ≥ 0
- Prices match arrays from constants

### Check Consumption Bags
```sql
SELECT 
  s."sectorName",
  cm."resourceType",
  cm."isPermanent",
  c.name as "companyName",
  COUNT(*) as count
FROM "ConsumptionMarker" cm
JOIN "Sector" s ON cm."sectorId" = s.id
LEFT JOIN "Company" c ON cm."companyId" = c.id
WHERE cm."gameId" = '[your-game-id]'
GROUP BY s."sectorName", cm."resourceType", cm."isPermanent", c.name
ORDER BY s."sectorName", cm."isPermanent" DESC;
```

**Expected**:
- 5 permanent markers per sector (companyName = NULL)
- Additional markers if factories built (companyName = company)
- Temporary markers if marketing campaigns active (isPermanent = false)

### Check Factory Production Records
```sql
SELECT 
  c.name as company,
  f.size as factory,
  gt.turn,
  fp."customersServed",
  fp.revenue,
  fp.costs,
  fp.profit
FROM "FactoryProduction" fp
JOIN "Factory" f ON fp."factoryId" = f.id
JOIN "Company" c ON fp."companyId" = c.id
JOIN "GameTurn" gt ON fp."gameTurnId" = gt.id
WHERE fp."gameId" = '[your-game-id]'
ORDER BY gt.turn, c.name;
```

**Expected**:
- One record per factory per turn
- customersServed > 0
- revenue, costs, profit all calculated (> 0 after EARNINGS_CALL)

---

## Step 4: Test Through Real Game UI 🎮

### Option A: Create New Modern Game
1. Go to game creation screen
2. Set `Operation Mechanics: MODERN`
3. Start game
4. Verify in database:
   ```sql
   SELECT 
     COUNT(*) as resource_count 
   FROM "Resource" 
   WHERE "gameId" = '[new-game-id]';
   -- Should be: 3 global + (sectors × 1)
   
   SELECT 
     COUNT(*) as marker_count 
   FROM "ConsumptionMarker" 
   WHERE "gameId" = '[new-game-id]';
   -- Should be: sectors × 5
   ```

### Option B: Test Individual Phases
Use your admin/debug tools to:

1. **Advance to FACTORY_CONSTRUCTION**
   - Submit factory order as CEO
   - Check order in database

2. **Advance to FACTORY_CONSTRUCTION_RESOLVE**
   - Watch game logs
   - Verify factory created
   - Check company cash reduced
   - Check resources consumed

3. **Advance to next turn START_TURN**
   - Verify factory.isOperational = true

4. **Advance to CONSUMPTION_PHASE**
   - Watch customers allocate
   - Check FactoryProduction records created

5. **Advance to EARNINGS_CALL**
   - Check production records updated with revenue/costs/profit
   - Check company cash updated

---

## Step 5: Verify Game Logs 📝

Query game logs to see what happened:

```sql
SELECT 
  "content",
  "createdAt"
FROM "GameLog"
WHERE "gameId" = '[your-game-id]'
ORDER BY "createdAt" DESC
LIMIT 20;
```

**Look for these key messages**:
- ✓ "Consumption bags initialized for all sectors"
- ✓ "[Company] built FACTORY_II for $X"
- ✓ "Resource prices updated based on supply and demand"
- ✓ "[Company]'s factory is now operational"
- ✓ "[Company]'s factory served X customers"
- ✓ "[Company] earnings: Revenue $X, Costs $Y, Profit $Z"
- ✓ "[Sector] serviced all customers! Sector score increased"

**Red flags** (shouldn't see these):
- ❌ "cannot afford factory construction"
- ❌ "Factory construction failed"
- ❌ "No factory production records found"
- ❌ "has no consumption markers in bag"

---

## Step 6: Validation Checklist ✅

Run through this checklist:

### Game Initialization
- [ ] Game has `operationMechanicsVersion = MODERN`
- [ ] `game.workers = 60`
- [ ] Resources table has 3 GLOBAL resources
- [ ] Resources table has 1 SECTOR resource per sector
- [ ] All resources at `trackPosition = 0`
- [ ] ConsumptionMarker table has `sectors × 5` markers
- [ ] All initial markers are `isPermanent = true`

### Factory Construction
- [ ] FactoryConstructionOrder can be created
- [ ] Order includes `gameTurnId`, `sectorId`, `playerId`
- [ ] Order stores `resourceTypes` array
- [ ] FACTORY_CONSTRUCTION_RESOLVE creates Factory
- [ ] Factory starts with `isOperational = false`
- [ ] Company cash is deducted
- [ ] Resource `trackPosition` increases
- [ ] Resource `price` updates from new position
- [ ] ConsumptionMarker added to sector bag
- [ ] Construction order is deleted

### Factory Operations
- [ ] START_TURN makes factories operational
- [ ] Factory `isOperational` changes to `true`
- [ ] Game log shows factory operational message

### Consumption Phase
- [ ] Customers are allocated to factories
- [ ] FactoryProduction record created per factory
- [ ] `customersServed` field populated with exact count
- [ ] Temporary markers removed after drawing
- [ ] Sector score adjusts based on service quality

### Earnings Call
- [ ] FactoryProduction records fetched
- [ ] Revenue calculated: `customersServed × (unitPrice + Σ resource prices)`
- [ ] Costs calculated: `workers × BASE_WORKER_SALARY`
- [ ] Profit calculated: `revenue - costs`
- [ ] Production record updated with calculations
- [ ] Company cash updated with profit
- [ ] Game log shows earnings breakdown

### Data Integrity
- [ ] All FactoryProduction records link to valid Factory
- [ ] All FactoryProduction records link to valid Company
- [ ] All FactoryProduction records link to valid GameTurn
- [ ] All ConsumptionMarker records link to valid Sector
- [ ] All Resource trackPositions are valid (≥ 0)
- [ ] Resource prices match their trackPosition index in arrays

---

## Common Issues & Solutions

### Issue: "Prisma Client validation failed"
**Cause**: Prisma client not regenerated
**Solution**: Run `npx prisma generate`

### Issue: "Property 'consumptionMarker' does not exist"
**Cause**: TypeScript using old Prisma types
**Solution**: Restart TypeScript server, regenerate Prisma

### Issue: "No consumption markers in bag"
**Cause**: `initializeConsumptionBags()` not called
**Solution**: Verify it's called in `startGame()` at line 5691

### Issue: "Factory construction failed: Company not found"
**Cause**: Company doesn't exist or wrong ID
**Solution**: Check company creation, verify company.status = ACTIVE

### Issue: "No factory production records found"
**Cause**: CONSUMPTION_PHASE didn't run or no factories operational
**Solution**: Check factory.isOperational = true, verify phase ran

---

## Debug Queries

### See What Phase Game Is On
```sql
SELECT 
  g.id,
  g.name,
  g."operationMechanicsVersion",
  g."currentPhaseId",
  p.name as "currentPhase"
FROM "Game" g
LEFT JOIN "Phase" p ON g."currentPhaseId" = p.id
WHERE g.id = '[game-id]';
```

### See All Factories and Their Status
```sql
SELECT 
  c.name as company,
  f.id,
  f.size,
  f."isOperational",
  f.workers,
  f."resourceTypes"
FROM "Factory" f
JOIN "Company" c ON f."companyId" = c.id
WHERE f."gameId" = '[game-id]';
```

### See Factory Production History
```sql
SELECT 
  gt.turn,
  c.name as company,
  f.size as factory,
  fp."customersServed",
  fp.revenue,
  fp.costs,
  fp.profit
FROM "FactoryProduction" fp
JOIN "Factory" f ON fp."factoryId" = f.id
JOIN "Company" c ON fp."companyId" = c.id
JOIN "GameTurn" gt ON fp."gameTurnId" = gt.id
WHERE fp."gameId" = '[game-id]'
ORDER BY gt.turn, c.name;
```

---

## Success Criteria

You're ready to move to frontend development when:

✅ Test script runs without errors
✅ All database tables populated correctly
✅ Resource tracks move as expected
✅ Consumption bags work properly
✅ Factories build and become operational
✅ FactoryProduction records created accurately
✅ Earnings calculations are correct
✅ Company cash updates properly
✅ Game logs show comprehensive activity

---

## Next Steps After Testing Passes

1. **Add stock price integration** (5 lines of code)
2. **Create tRPC endpoints** for frontend
3. **Build UI components** for factory construction
4. **Test with real gameplay**

---

## Running the Test

```bash
# Make sure you're in the project root
cd /home/brett/dev/nextjs-nestjs-trpc

# Run the test script
npx ts-node apps/server/test-modern-ops.ts

# Expected runtime: ~5-10 seconds
# Expected result: ✅ ALL TESTS PASSED!
```

If any test fails, the error message will indicate exactly what went wrong.

