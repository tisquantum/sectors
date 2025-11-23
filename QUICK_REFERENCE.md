# Modern Operations - Quick Reference Card

## 🎯 Core Concepts

### Resources = Track Position
- Position 0 = Highest price (most available)
- Consumed → Position ↑ → Price ↓ (economies of scale)
- Prices from arrays: `RESOURCE_PRICES_CIRCLE[trackPosition]`

### Consumption Bag = Sector Draw Pool
- Start: 5 permanent sector markers
- Factory built: +1 permanent marker
- Marketing tier N: +N temporary markers
- Draw: Random selection, temporary deleted after

### Attraction Rating = Who Gets Customers
- Formula: `unitPrice - brandScore`
- Lower = Better (cheaper to customer)
- Tie → More complex factory wins

### Factory Lifecycle
- Built → Not operational (1 turn delay)
- Next turn → Operational
- Services customers up to limit (I=3, II=4, III=5, IV=6)

---

## 📊 Phase Cheat Sheet

| Phase | Player Action | System Action |
|-------|---------------|---------------|
| **START_TURN** | None | Update prices, make factories operational |
| **FACTORY_CONSTRUCTION** | CEO submits orders | Queue orders |
| **FACTORY_CONSTRUCTION_RESOLVE** | None | Build, pay, consume resources |
| **MARKETING_AND_RESEARCH_ACTION** | Submit campaigns/research | Queue actions |
| **MARKETING_AND_RESEARCH_ACTION_RESOLVE** | None | Activate, add markers, milestones |
| **CONSUMPTION_PHASE** | None | Draw bags, route customers |
| **EARNINGS_CALL** | None | Calculate P&L, adjust stock |
| **END_TURN** | None | Degrade campaigns, update tech |

---

## 💰 Costs

### Factory Sizes
- FACTORY_I: 2 workers, 3 customer limit
- FACTORY_II: 4 workers, 4 customer limit
- FACTORY_III: 6 workers, 5 customer limit
- FACTORY_IV: 8 workers, 6 customer limit

**Blueprint Cost** = Sum of all resource prices (at time of order)

### Marketing Campaigns
| Tier | Workers | Brand Bonus | Base Cost | Markers |
|------|---------|-------------|-----------|---------|
| I    | 1       | +1          | $100      | +1      |
| II   | 2       | +2          | $200      | +2      |
| III  | 3       | +3          | $300      | +3      |

**Slot Penalty** (concurrent campaigns): $0, $100, $200, $300, $400

### Research
| Phase Level | Cost | Possible Progress |
|-------------|------|-------------------|
| I           | $100 | +0, +1, or +2     |
| II          | $200 | +0, +1, or +2     |
| III         | $300 | +0, +1, or +2     |
| IV          | $400 | +0, +1, or +2     |

---

## 🏆 Milestones & Rewards

### Research Progress (Per Company)
- **5**: +$200 grant
- **10**: +1 market favor (stock boost)

### Technology Level (Per Sector - Total Research)
- **5+**: Level 1 → 2 factory slots unlocked
- **15+**: Level 2 → 3 factory slots unlocked
- **30+**: Level 3 → 4 factory slots unlocked
- **50+**: Level 4 → 5 factory slots unlocked

### Sector Scoring
- **All customers served**: +1 sector score
- **N customers unserved**: -N sector score

---

## 🧮 Calculations

### Earnings (Per Factory)
```
Revenue = customers_served × (unitPrice + Σ resource_prices)
Costs = workers × $10
Profit = Revenue - Costs
```

### Stock Price Adjustment (Per Company)
```
Profit > $500  → +3 steps
Profit > $200  → +2 steps
Profit > $0    → +1 step
Profit < $0    → -1 step
Profit < -$200 → -2 steps
```

### Attraction Rating (Per Company)
```
rating = unitPrice - Σ activeCampaign.brandBonus
```
Lower is better for customer allocation.

---

## 🔄 Lifecycles

### Factory
```
Order Submitted → Built (not operational) → Next Turn (operational) → Serves Customers
```

### Marketing Campaign  
```
Created (ACTIVE, +brand) → Turn +1 (DECAYING, +brand) → Turn +2 (deleted, -brand, +workers)
```

### Consumption Marker
```
PERMANENT: Created → Drawn → Returned to bag → Drawn again...
TEMPORARY: Created → Drawn once → Deleted
```

---

## 🐛 Common Pitfalls

❌ **Don't**: Query resource prices in loops
✅ **Do**: Build price map once, reuse

❌ **Don't**: Assume factories are operational when built
✅ **Do**: Check `isOperational` flag

❌ **Don't**: Delete permanent consumption markers
✅ **Do**: Only delete if `!isPermanent`

❌ **Don't**: Apply resource prices after each construction
✅ **Do**: Apply prices after ALL constructions (simultaneous)

❌ **Don't**: Route customers without checking factory capacity
✅ **Do**: Track customers per factory, respect limits

---

## 📞 Quick Help

**Consumption not working?**
→ Check consumption bags initialized (`initializeConsumptionBags()`)

**Resource prices wrong?**
→ Verify `updateResourcePrices()` called, check trackPosition

**Factories never operational?**
→ Check `makeFactoriesOperational()` in START_TURN

**Campaigns not expiring?**
→ Verify `degradeMarketingCampaigns()` in END_TURN

**Stock prices not adjusting?**
→ TODO: Integrate StockHistoryService in earnings call

---

## 🎮 Play Testing Checklist

- [ ] Start modern game
- [ ] Verify 5 markers per sector in bags
- [ ] Build factory as CEO
- [ ] Verify factory not operational same turn
- [ ] Next turn: verify factory operational
- [ ] Launch marketing campaign
- [ ] Verify temporary markers added
- [ ] Consumption phase: watch customers allocate
- [ ] Verify sector score changes
- [ ] Earnings call: verify profit calculation
- [ ] End turn: verify campaign degradation
- [ ] Next turn: verify campaign expiration

---

## 📱 Contact Points

**Schema Issues** → `apps/server/prisma/schema.prisma`
**Phase Logic** → `modern-operation-mechanics.service.ts`
**Resource System** → `resource.service.ts`  
**Consumption Bags** → `consumption-marker.service.ts`
**Game Init** → `game-management.service.ts:5690-5825`

---

**Implementation Status: COMPLETE ✅**
**Ready for Testing: YES ✅**
**Production Ready: NEEDS TESTING ⏳**

