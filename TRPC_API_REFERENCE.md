# 🌐 tRPC API Reference - Modern Operations

Complete backend API for modern operation mechanics.

---

## 🏭 Factory Management

### `trpc.factory.createBlueprint`
Create a factory blueprint (legacy support).

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
  size: FactorySize;
  workers: number;
  slot: number;
  isOperational: boolean;
  resourceTypes: ResourceType[];
}
```

### `trpc.factory.getFactoryDetails`
Get details for a single factory.

**Input:** `factoryId: string`

**Returns:**
```typescript
{
  id: string;
  companyId: string;
  sectorId: string;
  size: FactorySize;
  workers: number;
  slot: number;
  isOperational: boolean;
  resourceTypes: ResourceType[];
}
```

### `trpc.factory.getCompanyFactories`
Get all factories for a company.

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
}
```

### `trpc.factory.getFactoryWithProduction`
Get factory with production history for a specific turn.

**Input:**
```typescript
{
  factoryId: string;
  gameTurnId?: string; // optional
}
```

**Returns:**
```typescript
{
  ...factoryDetails,
  productionRecords: [{
    id: string;
    customersServed: number;
    revenue: number;
    costs: number;
    profit: number;
  }] | null
}
```

### `trpc.factory.getCompanyFactoriesWithProduction`
Get all company factories with their production records for a turn.

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
  gameTurnId?: string;
}
```

---

## 🏗️ Factory Construction

### `trpc.factoryConstruction.createOrder`
Submit a factory construction order (CEO only, during FACTORY_CONSTRUCTION phase).

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
  size: FactorySize; // FACTORY_I, FACTORY_II, FACTORY_III, FACTORY_IV
  resourceTypes: ResourceType[]; // e.g., ['CIRCLE', 'SQUARE', 'HEALTHCARE']
}
```

**Validation:**
- Must be called by CEO of the company
- Must be during FACTORY_CONSTRUCTION phase
- Factory size must be valid for sector technology level
- Resource types count cannot exceed factory size + 1

**Returns:** `FactoryConstructionOrder`

---

## 📊 Resources (Track-Based Pricing)

### `trpc.resource.getGameResources`
Get all resource tracks for a game.

**Input:**
```typescript
{
  gameId: string;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  gameId: string;
  type: ResourceType;
  trackType: 'GLOBAL' | 'SECTOR';
  price: number;
  trackPosition: number;
}>
```

### `trpc.resource.getResourceByType`
Get a specific resource track.

**Input:**
```typescript
{
  gameId: string;
  type: ResourceType; // 'CIRCLE', 'SQUARE', 'TRIANGLE', 'HEALTHCARE', etc.
}
```

### `trpc.resource.getResourcePrice`
Get current price for a resource type.

**Input:**
```typescript
{
  gameId: string;
  type: ResourceType;
}
```

**Returns:** `number` (current price based on trackPosition)

### `trpc.resource.getAllResourcePrices`
Get prices for all resources in a game.

**Input:**
```typescript
{
  gameId: string;
}
```

**Returns:**
```typescript
Array<{
  type: ResourceType;
  trackPosition: number;
  price: number;
}>
```

---

## 🎯 Consumption Markers (Consumption Bags)

### `trpc.consumptionMarker.getSectorConsumptionBag`
Get all consumption markers for a sector.

**Input:**
```typescript
{
  sectorId: string;
  gameId: string;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  sectorId: string;
  gameId: string;
  resourceType: ResourceType;
  isPermanent: boolean;
  companyId: string | null;
}>
```

### `trpc.consumptionMarker.getAllConsumptionBags`
Get consumption bags for all sectors in a game.

**Input:**
```typescript
{
  gameId: string;
}
```

### `trpc.consumptionMarker.getConsumptionBagSummary`
Get summarized consumption bag (grouped by type and permanence).

**Input:**
```typescript
{
  sectorId: string;
  gameId: string;
}
```

**Returns:**
```typescript
Array<{
  resourceType: ResourceType;
  isPermanent: boolean;
  count: number;
}>
```

**Example:**
```typescript
[
  { resourceType: 'HEALTHCARE', isPermanent: true, count: 5 },
  { resourceType: 'HEALTHCARE', isPermanent: false, count: 3 },
  { resourceType: 'CIRCLE', isPermanent: false, count: 2 }
]
```

---

## 📈 Factory Production (Historical Performance)

### `trpc.factoryProduction.getFactoryProduction`
Get production record for a specific factory and turn.

**Input:**
```typescript
{
  factoryId: string;
  gameTurnId: string;
}
```

**Returns:**
```typescript
{
  id: string;
  factoryId: string;
  gameId: string;
  gameTurnId: string;
  companyId: string;
  customersServed: number;
  revenue: number;
  costs: number;
  profit: number;
}
```

### `trpc.factoryProduction.getCompanyProduction`
Get all production records for a company in a specific turn.

**Input:**
```typescript
{
  companyId: string;
  gameTurnId: string;
}
```

**Returns:** Array of production records with Factory and Company relations

### `trpc.factoryProduction.getGameTurnProduction`
Get all production records for all companies in a turn.

**Input:**
```typescript
{
  gameId: string;
  gameTurnId: string;
}
```

### `trpc.factoryProduction.getCompanyProductionHistory`
Get all historical production records for a company (all turns).

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
}
```

### `trpc.factoryProduction.getFactoryProductionSummary`
Get aggregated summary for a company's production in a turn.

**Input:**
```typescript
{
  companyId: string;
  gameTurnId: string;
}
```

**Returns:**
```typescript
{
  totalCustomers: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  factoryCount: number;
}
```

---

## 🎯 Modern Operations (CEO Actions)

### `trpc.modernOperations.submitMarketingCampaign`
Submit a marketing campaign (CEO only, during MARKETING_AND_RESEARCH_ACTION phase).

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
  tier: MarketingCampaignTier; // TIER_1, TIER_2, TIER_3
  slot: number; // 1, 2, or 3
}
```

**Validation:**
- Must be CEO of the company
- Must be during MARKETING_AND_RESEARCH_ACTION phase
- Slot must be 1-3

### `trpc.modernOperations.submitResearchAction`
Submit a research action (CEO only).

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
  sectorId: string;
}
```

**Validation:**
- Must be CEO of the company
- Must be during MARKETING_AND_RESEARCH_ACTION phase

### `trpc.modernOperations.getCompanyWorkforceStatus`
Get company's worker allocation status.

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
}
```

**Returns:**
```typescript
{
  totalWorkers: number;
  factoryWorkers: number;
  marketingWorkers: number;
  availableWorkers: number;
}
```

### `trpc.modernOperations.getSectorResearchProgress`
Get research progress for a sector.

**Input:**
```typescript
{
  sectorId: string;
  gameId: string;
}
```

**Returns:**
```typescript
{
  sectorId: string;
  sectorName: SectorName;
  technologyLevel: number;
  researchMarker: number;
}
```

### `trpc.modernOperations.getAllSectorsResearchProgress`
Get research progress for all sectors.

**Input:**
```typescript
{
  gameId: string;
}
```

---

## 📢 Marketing Campaigns

### `trpc.marketing.createCampaign`
Create a marketing campaign (lower-level, use `modernOperations.submitMarketingCampaign` instead).

### `trpc.marketing.getCompanyCampaigns`
Get all marketing campaigns for a company.

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  companyId: string;
  tier: MarketingCampaignTier;
  workers: number;
  status: 'ACTIVE' | 'DECAYING' | 'EXPIRED';
  brandBonus: number;
  slot: number;
}>
```

### `trpc.marketing.getTotalBrandBonus`
Get total brand bonus from all campaigns.

**Input:**
```typescript
{
  companyId: string;
  gameId: string;
}
```

**Returns:** `number`

---

## 🎮 Game State Queries (Existing, works for Modern)

### `trpc.game.getCurrentGameState`
Get full game state including modern mechanics data.

**Input:** `gameId: string`

**Returns:** Includes `operationMechanicsVersion`, `workers`, etc.

### `trpc.company.getCompanyWithRelations`
Get company with all relations (includes factories, campaigns, production).

**Input:** `{ id: string }`

### `trpc.sector.getSector`
Get sector details (includes `technologyLevel` for modern mechanics).

**Input:** `{ id: string }`

---

## 📝 Usage Examples

### Creating a Factory (CEO during FACTORY_CONSTRUCTION)
```typescript
const order = await trpc.factoryConstruction.createOrder.mutate({
  companyId: 'company-123',
  gameId: 'game-456',
  size: 'FACTORY_II',
  resourceTypes: ['CIRCLE', 'SQUARE', 'HEALTHCARE'],
});
```

### Viewing Resource Prices
```typescript
const prices = await trpc.resource.getAllResourcePrices.query({
  gameId: 'game-456',
});

console.log(prices);
// [
//   { type: 'CIRCLE', trackPosition: 3, price: 15 },
//   { type: 'SQUARE', trackPosition: 1, price: 8 },
//   { type: 'HEALTHCARE', trackPosition: 0, price: 5 }
// ]
```

### Checking Consumption Bag
```typescript
const summary = await trpc.consumptionMarker.getConsumptionBagSummary.query({
  sectorId: 'sector-789',
  gameId: 'game-456',
});

console.log(summary);
// [
//   { resourceType: 'HEALTHCARE', isPermanent: true, count: 5 },
//   { resourceType: 'HEALTHCARE', isPermanent: false, count: 8 },
//   { resourceType: 'CIRCLE', isPermanent: false, count: 3 }
// ]
```

### Viewing Factory Performance
```typescript
const summary = await trpc.factoryProduction.getFactoryProductionSummary.query({
  companyId: 'company-123',
  gameTurnId: 'turn-5',
});

console.log(summary);
// {
//   totalCustomers: 12,
//   totalRevenue: 360,
//   totalCosts: 180,
//   totalProfit: 180,
//   factoryCount: 3
// }
```

### Submitting Marketing Campaign
```typescript
await trpc.modernOperations.submitMarketingCampaign.mutate({
  companyId: 'company-123',
  gameId: 'game-456',
  tier: 'TIER_2',
  slot: 1,
});
```

### Checking Worker Allocation
```typescript
const workforce = await trpc.modernOperations.getCompanyWorkforceStatus.query({
  companyId: 'company-123',
  gameId: 'game-456',
});

console.log(workforce);
// {
//   totalWorkers: 30,
//   factoryWorkers: 18,
//   marketingWorkers: 8,
//   availableWorkers: 4
// }
```

### Viewing Research Progress
```typescript
const progress = await trpc.modernOperations.getAllSectorsResearchProgress.query({
  gameId: 'game-456',
});

console.log(progress);
// [
//   { sectorName: 'HEALTHCARE', technologyLevel: 2, researchMarker: 3 },
//   { sectorName: 'TECHNOLOGY', technologyLevel: 1, researchMarker: 1 },
//   { sectorName: 'ENERGY', technologyLevel: 0, researchMarker: 4 }
// ]
```

---

## 🔐 Authentication & Validation

All mutation endpoints use middleware to:
1. ✅ Verify player is authenticated
2. ✅ Check submission is during correct phase
3. ✅ Validate player is CEO (where required)
4. ✅ Ensure timing is within phase window

**Example error responses:**
```typescript
// Not during correct phase
Error: "Action not allowed during current phase"

// Not CEO
Error: "Only the CEO can submit marketing campaigns"

// Invalid data
Error: "Factory size is not valid for the sector technology level"
```

---

## 📡 Real-time Updates (via Pusher)

These events are triggered automatically during phase transitions:
- `EVENT_NEW_PHASE` - New phase started
- `EVENT_GAME_ENDED` - Game completed
- `EVENT_PLAYER_READINESS_CHANGED` - Player ready status changed

---

## 🚀 Frontend Integration Pattern

### Setup (Next.js App Router)
```typescript
// app/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@server/trpc/trpc.router';

export const trpc = createTRPCReact<AppRouter>();
```

### Component Usage
```typescript
'use client';

export function FactoryDashboard({ companyId, gameId, gameTurnId }: Props) {
  const { data: factories, isLoading } = trpc.factory.getCompanyFactoriesWithProduction.useQuery({
    companyId,
    gameId,
    gameTurnId,
  });

  const { data: workforce } = trpc.modernOperations.getCompanyWorkforceStatus.useQuery({
    companyId,
    gameId,
  });

  const createFactory = trpc.factoryConstruction.createOrder.useMutation();

  const handleBuildFactory = async () => {
    await createFactory.mutateAsync({
      companyId,
      gameId,
      size: 'FACTORY_II',
      resourceTypes: ['CIRCLE', 'HEALTHCARE'],
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Factories ({factories?.length})</h2>
      
      {factories?.map(factory => (
        <div key={factory.id}>
          <h3>{factory.size}</h3>
          <p>Workers: {factory.workers}</p>
          
          {factory.productionRecords?.map(record => (
            <div key={record.id}>
              Customers: {record.customersServed} | 
              Revenue: ${record.revenue} | 
              Profit: ${record.profit}
            </div>
          ))}
        </div>
      ))}

      <div>
        <h3>Workforce Status</h3>
        <p>Available: {workforce?.availableWorkers} / {workforce?.totalWorkers}</p>
        <button onClick={handleBuildFactory}>Build Factory</button>
      </div>
    </div>
  );
}
```

---

## 🔄 Phase-Specific Actions

### FACTORY_CONSTRUCTION Phase
- ✅ `trpc.factoryConstruction.createOrder`

### MARKETING_AND_RESEARCH_ACTION Phase
- ✅ `trpc.modernOperations.submitMarketingCampaign`
- ✅ `trpc.modernOperations.submitResearchAction`

### SHAREHOLDER_MEETING Phase (uses existing routers)
- ✅ `trpc.revenueDistributionVote.createVote` - CEOs vote on distribution
- ✅ `trpc.operatingRoundVote.createVote` - Shareholders vote on actions

### Any Phase (Query/Read-Only)
- ✅ All `.query` endpoints can be called anytime
- ✅ View resources, consumption bags, production history, etc.

---

## 🎯 Complete Workflow Example

### Turn 5 - Healthcare Company
```typescript
// 1. START_TURN - Check resource prices
const resources = await trpc.resource.getAllResourcePrices.query({
  gameId: 'game-123',
});

// 2. FACTORY_CONSTRUCTION - CEO builds factory
await trpc.factoryConstruction.createOrder.mutate({
  companyId: 'healthcare-co',
  gameId: 'game-123',
  size: 'FACTORY_III',
  resourceTypes: ['CIRCLE', 'SQUARE', 'HEALTHCARE'],
});

// 3. MARKETING_AND_RESEARCH_ACTION - CEO launches campaign
await trpc.modernOperations.submitMarketingCampaign.mutate({
  companyId: 'healthcare-co',
  gameId: 'game-123',
  tier: 'TIER_2',
  slot: 1,
});

// 4. CONSUMPTION_PHASE - (automated, no user action)

// 5. EARNINGS_CALL - View results
const summary = await trpc.factoryProduction.getFactoryProductionSummary.query({
  companyId: 'healthcare-co',
  gameTurnId: 'turn-5',
});

console.log(`Turn 5 Results:`);
console.log(`Customers Served: ${summary.totalCustomers}`);
console.log(`Revenue: $${summary.totalRevenue}`);
console.log(`Costs: $${summary.totalCosts}`);
console.log(`Profit: $${summary.totalProfit}`);

// 6. View consumption bag for next turn planning
const bagSummary = await trpc.consumptionMarker.getConsumptionBagSummary.query({
  sectorId: 'healthcare-sector',
  gameId: 'game-123',
});

console.log('Consumption Bag:', bagSummary);
```

---

## 🛠️ Available Routers

### New for Modern Mechanics
- ✅ `trpc.resource.*` - Resource track management
- ✅ `trpc.consumptionMarker.*` - Consumption bag queries
- ✅ `trpc.factoryProduction.*` - Historical performance
- ✅ `trpc.modernOperations.*` - CEO action submissions
- ✅ `trpc.factoryConstruction.*` - Factory orders
- ✅ Enhanced `trpc.factory.*` - With production history

### Existing (works with Modern)
- ✅ `trpc.game.*` - Game state
- ✅ `trpc.company.*` - Company data
- ✅ `trpc.sector.*` - Sector data  
- ✅ `trpc.player.*` - Player data
- ✅ `trpc.phase.*` - Phase management
- ✅ `trpc.gameLog.*` - Game logs
- ✅ `trpc.revenueDistributionVote.*` - Shareholder votes
- ✅ `trpc.operatingRoundVote.*` - Company action votes

---

## 🎨 Type Safety

All endpoints are fully typed! Your IDE will provide:
- ✅ Autocomplete for all methods
- ✅ Type checking for inputs
- ✅ Type inference for outputs
- ✅ Inline documentation

```typescript
// IDE autocomplete works perfectly!
trpc.factoryProduction.
  // ↑ Shows: getFactoryProduction, getCompanyProduction, 
  //          getGameTurnProduction, etc.
```

---

## 🧪 Testing Endpoints

You can test endpoints using:

1. **Prisma Studio** (view database):
   ```bash
   npx prisma studio
   ```

2. **tRPC Panel** (if installed):
   ```bash
   npm install trpc-panel
   ```

3. **Direct service calls** (for backend testing):
   ```typescript
   // In a NestJS context
   const production = await factoryProductionService.getCompanyProductionForTurn(
     'company-123',
     'turn-5'
   );
   ```

---

## 📦 What's Exposed to Frontend

### Read-Only (Queries)
- Resource prices and tracks
- Consumption bag contents
- Factory production history
- Worker allocation status
- Research progress
- All game state data

### CEO Actions (Mutations)
- Build factories
- Launch marketing campaigns
- Submit research actions

### Shareholder Actions (Mutations - existing)
- Vote on revenue distribution
- Vote on company actions

---

## ✨ Next Steps

1. **Test database push**:
   ```bash
   npx prisma db push
   ```

2. **Verify schema**:
   ```bash
   npx ts-node src/scripts/verify-modern-ops.ts
   ```

3. **Create frontend components**:
   - Factory construction panel
   - Resource price display
   - Consumption bag visualizer
   - Production history charts
   - Marketing campaign manager
   - Research progress tracker

4. **Test full flow**:
   - Create modern game
   - Build factory
   - Launch campaign
   - View earnings

---

## 🎉 You're Ready!

All backend tRPC endpoints are:
- ✅ Fully implemented
- ✅ Type-safe
- ✅ Validated with middleware
- ✅ Ready for frontend consumption

**The backend is complete! Time to build the UI! 🚀**

