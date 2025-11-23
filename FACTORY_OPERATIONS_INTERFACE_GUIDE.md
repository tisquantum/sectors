# 🏭 Factory Operations Interface Guide

## Quick Overview

Modern factory operations are accessed through:
1. **UI Components** - Visual interfaces in specific game phases
2. **tRPC Queries** - Programmatic data access
3. **Shared Hooks** - React hooks for common data fetching

---

## 🎨 UI Components (What You See)

### Phase-Based Views

#### 1. **Factory Construction Phase** (`ModernOperations/phases/FactoryConstructionPhase.tsx`)
**When**: During `FACTORY_CONSTRUCTION` phase  
**What it shows**:
- Resource tracks (prices and availability)
- Your companies eligible for factory construction
- Factory creation form per company

**Access**: Automatically displayed when phase is active

```tsx
// In Game.tsx, this component renders automatically:
gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN ? (
  <ModernFactoryConstructionPhase />
) : (
  <FactoryConstructionPhase />
)
```

#### 2. **Factory Construction Resolve Phase** (`ModernOperations/phases/FactoryConstructionResolvePhase.tsx`)
**When**: During `FACTORY_CONSTRUCTION_RESOLVE` phase  
**What it shows**:
- All factories just constructed this turn
- Factory details: size, resources, workers, cost
- Construction status (operational or under construction)

**Access**: Automatically displayed when phase resolves

#### 3. **Consumption Phase** (`ModernOperations/phases/ConsumptionPhase.tsx`)
**When**: During `CONSUMPTION_PHASE`  
**What it shows**:
- Which factories served customers
- Customer counts per factory
- Resource consumption flow
- Factory performance by sector

**Tabs**:
- **Consumer Flow** - Shows factories and customer allocation by sector
- **Company Performance** - Aggregated stats per company
- **Flow Log** - Detailed customer-to-factory assignments

#### 4. **Earnings Call Phase** (`ModernOperations/phases/EarningsCallPhase.tsx`)
**When**: During `EARNINGS_CALL` phase  
**What it shows**:
- Factory revenue, costs, and profit
- Per-factory performance breakdown
- Company-level summaries
- Customer counts served

---

## 🔌 tRPC Endpoints (How to Query Data)

### Factory Information

#### Get All Factories for a Company
```typescript
const { data: factories } = trpc.factory.getCompanyFactories.useQuery({
  companyId: 'company-id',
  gameId: 'game-id',
});

// Returns:
// Array<{
//   id: string;
//   size: FactorySize;
//   workers: number;
//   slot: number;
//   isOperational: boolean;
//   resourceTypes: ResourceType[];
//   sectorId: string;
//   companyId: string;
// }>
```

#### Get Factory with Production History
```typescript
const { data: factory } = trpc.factory.getFactoryWithProduction.useQuery({
  factoryId: 'factory-id',
  gameTurnId: 'turn-id', // optional
});

// Returns factory with:
// - productionRecords: Array<{
//     customersServed: number;
//     revenue: number;
//     costs: number;
//     profit: number;
//   }>
```

#### Get Company Factories with Production (All Factories)
```typescript
const { data: factories } = trpc.factory.getCompanyFactoriesWithProduction.useQuery({
  companyId: 'company-id',
  gameId: 'game-id',
  gameTurnId: 'turn-id', // optional - adds production records
});
```

### Factory Production Data

#### Get Production for Current Turn (All Companies)
```typescript
const { data: production } = trpc.factoryProduction.getGameTurnProduction.useQuery({
  gameId: 'game-id',
  gameTurnId: 'turn-id',
});

// Returns: Array<FactoryProduction & {
//   Factory: Factory;
//   Company: Company;
//   Game: Game;
//   GameTurn: GameTurn;
// }>
```

#### Get Company Production for Specific Turn
```typescript
const { data: production } = trpc.factoryProduction.getCompanyProductionForTurn.useQuery({
  companyId: 'company-id',
  gameTurnId: 'turn-id',
});

// Returns: Array<FactoryProduction>
```

#### Get Company Production History (All Turns)
```typescript
const { data: history } = trpc.factoryProduction.getCompanyProductionHistory.useQuery({
  companyId: 'company-id',
  gameId: 'game-id',
});

// Returns: Array<FactoryProduction> (all turns)
```

#### Get Factory Production Summary
```typescript
const { data: summary } = trpc.factoryProduction.getFactoryProductionSummary.useQuery({
  companyId: 'company-id',
  gameTurnId: 'turn-id',
});

// Returns: {
//   totalCustomers: number;
//   totalRevenue: number;
//   totalCosts: number;
//   totalProfit: number;
//   factoryCount: number;
// }
```

---

## 🪝 React Hooks (Easiest Way)

### `useModernOperations()` - Global Modern Ops Data

Fetches all common modern operations data in one hook:

```typescript
import { useModernOperations } from './ModernOperations/hooks';

function MyComponent() {
  const { 
    productionData,    // All FactoryProduction for current turn
    resources,         // Resource tracks
    sectors,           // Game sectors
    consumptionBags,   // Consumption markers
    researchProgress,  // Research progress
    isLoading,
    errors 
  } = useModernOperations();

  // productionData contains:
  // Array<FactoryProduction & {
  //   Factory: Factory;  // Full factory details
  //   Company: Company;  // Company info
  // }>
  
  // Access factory info like:
  productionData.forEach(prod => {
    const factory = prod.Factory;
    console.log('Factory:', factory.size, factory.resourceTypes);
    console.log('Served:', prod.customersServed);
    console.log('Profit:', prod.profit);
  });
}
```

### `useCompanyOperations(companyId)` - Company-Specific Data

Fetches data for a specific company:

```typescript
import { useCompanyOperations } from './ModernOperations/hooks';

function CompanyDashboard({ companyId }: { companyId: string }) {
  const {
    factories,          // All factories for this company
    production,         // Production for current turn
    productionHistory,  // All historical production
    workforce,          // Worker allocation status
    isLoading
  } = useCompanyOperations(companyId);

  return (
    <div>
      <h2>Factories ({factories.length})</h2>
      {factories.map(factory => (
        <div key={factory.id}>
          <p>{factory.size} - Slot {factory.slot}</p>
          <p>Workers: {factory.workers}</p>
          <p>Operational: {factory.isOperational ? 'Yes' : 'No'}</p>
        </div>
      ))}
      
      <h2>Current Turn Production</h2>
      {production.map(prod => (
        <div key={prod.id}>
          <p>Customers: {prod.customersServed}</p>
          <p>Revenue: ${prod.revenue}</p>
          <p>Profit: ${prod.profit}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 Common Use Cases

### 1. Show Factory List for Current Company

```typescript
import { useCompanyOperations } from './ModernOperations/hooks';
import { useGame } from './GameContext';

function MyFactoryList() {
  const { gameState, authPlayer } = useGame();
  const myCompany = gameState.Company.find(c => c.ceoId === authPlayer?.id);
  
  if (!myCompany) return <div>No company</div>;
  
  const { factories, isLoading } = useCompanyOperations(myCompany.id);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {factories.map(factory => (
        <div key={factory.id}>
          <h3>{factory.size} Factory</h3>
          <p>Slot: {factory.slot}</p>
          <p>Workers: {factory.workers}</p>
          <p>Status: {factory.isOperational ? 'Operational' : 'Under Construction'}</p>
          <p>Resources: {factory.resourceTypes.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Show Factory Performance Summary

```typescript
import { useModernOperations } from './ModernOperations/hooks';

function FactoryPerformanceSummary() {
  const { productionData, isLoading } = useModernOperations();
  
  if (isLoading) return <div>Loading...</div>;
  
  // Group by company
  const byCompany = productionData.reduce((acc, prod) => {
    const companyId = prod.companyId;
    if (!acc[companyId]) {
      acc[companyId] = {
        company: prod.Company,
        totalRevenue: 0,
        totalProfit: 0,
        totalCustomers: 0,
        factories: []
      };
    }
    acc[companyId].totalRevenue += prod.revenue;
    acc[companyId].totalProfit += prod.profit;
    acc[companyId].totalCustomers += prod.customersServed;
    acc[companyId].factories.push(prod);
    return acc;
  }, {} as Record<string, any>);
  
  return (
    <div>
      {Object.values(byCompany).map((company: any) => (
        <div key={company.company.id}>
          <h3>{company.company.name}</h3>
          <p>Total Revenue: ${company.totalRevenue}</p>
          <p>Total Profit: ${company.totalProfit}</p>
          <p>Customers Served: {company.totalCustomers}</p>
          <p>Factories: {company.factories.length}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Check Factory Construction Status

```typescript
import { useCompanyOperations } from './ModernOperations/hooks';

function ConstructionStatus({ companyId }: { companyId: string }) {
  const { factories, isLoading } = useCompanyOperations(companyId);
  
  if (isLoading) return <div>Loading...</div>;
  
  const underConstruction = factories.filter(f => !f.isOperational);
  const operational = factories.filter(f => f.isOperational);
  
  return (
    <div>
      <h2>Construction Status</h2>
      <p>Operational: {operational.length}</p>
      <p>Under Construction: {underConstruction.length}</p>
      
      {underConstruction.length > 0 && (
        <div>
          <h3>Factories Being Built</h3>
          {underConstruction.map(factory => (
            <div key={factory.id}>
              {factory.size} Factory - Will be operational next turn
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🗺️ Data Flow Summary

```
FACTORY_CONSTRUCTION Phase
  ↓
CEO submits factory construction order
  ↓
FACTORY_CONSTRUCTION_RESOLVE Phase
  ↓
Factory created (isOperational = false)
  ↓
CONSUMPTION_PHASE
  ↓
FactoryProduction records created (customersServed tracked)
  ↓
EARNINGS_CALL Phase
  ↓
FactoryProduction updated (revenue, costs, profit calculated)
  ↓
Factory becomes operational (isOperational = true) in next turn
```

---

## 🔍 Where to Find Factory Data

1. **In Game Phases**: Components automatically show relevant factory info
2. **Custom Components**: Use `useModernOperations()` or `useCompanyOperations()`
3. **Direct Queries**: Use tRPC endpoints directly for specific needs
4. **Game Context**: `gameState.Company` contains company data, then query factories per company

---

## 💡 Tips

- **Use hooks** (`useModernOperations`, `useCompanyOperations`) for most cases - they handle loading/errors
- **Check phase** to know which component is showing factory info
- **FactoryProduction** is the source of truth for performance (not Factory itself)
- **isOperational** tells you if factory is ready or still under construction
- **productionData** from `useModernOperations()` includes Factory and Company relations automatically

---

## 🚀 Quick Reference

| What You Want | Use This |
|--------------|----------|
| See factories in a phase | Phase component (auto-rendered) |
| Get all company factories | `useCompanyOperations(companyId)` |
| Get current turn production | `useModernOperations().productionData` |
| Check factory details | `trpc.factory.getFactoryDetails.useQuery()` |
| See production history | `trpc.factoryProduction.getCompanyProductionHistory.useQuery()` |
| Get factory summary | `trpc.factoryProduction.getFactoryProductionSummary.useQuery()` |

