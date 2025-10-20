# 🎨 Frontend Quick Start - Modern Operations

**Your backend is 100% ready!** Here's how to build the UI.

---

## 🚀 Getting Started (2 minutes)

### 1. Database Setup
```bash
cd /home/brett/dev/nextjs-nestjs-trpc/apps/server
npx prisma db push
npx ts-node src/scripts/verify-modern-ops.ts
```

### 2. Start Development Server
```bash
cd /home/brett/dev/nextjs-nestjs-trpc
npm run dev
```

### 3. Create Your First Component
```bash
cd apps/sectors/app/components/Game
mkdir ModernOperations
touch ModernOperations/ResourcePriceDisplay.tsx
```

---

## 📦 Component Templates

### 1. Resource Price Display (15 min)
```typescript
// components/Game/ModernOperations/ResourcePriceDisplay.tsx
'use client';

import { trpc } from '@/app/trpc';
import { ResourceType } from '@prisma/client';

interface Props {
  gameId: string;
}

export function ResourcePriceDisplay({ gameId }: Props) {
  const { data: prices, isLoading } = trpc.resource.getAllResourcePrices.useQuery({
    gameId,
  });

  if (isLoading) return <div>Loading resource prices...</div>;

  return (
    <div className="resource-prices">
      <h3>Resource Market Prices</h3>
      <div className="grid grid-cols-3 gap-4">
        {prices?.map(resource => (
          <div key={resource.type} className="resource-card p-4 border rounded">
            <div className="text-lg font-bold">{resource.type}</div>
            <div className="text-2xl">${resource.price}</div>
            <div className="text-sm text-gray-500">
              Position: {resource.trackPosition}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Factory Construction Panel (30 min)
```typescript
// components/Game/ModernOperations/FactoryConstructionPanel.tsx
'use client';

import { trpc } from '@/app/trpc';
import { useState } from 'react';
import { FactorySize, ResourceType } from '@prisma/client';

interface Props {
  companyId: string;
  gameId: string;
  sectorTechLevel: number;
}

export function FactoryConstructionPanel({ 
  companyId, 
  gameId, 
  sectorTechLevel 
}: Props) {
  const [size, setSize] = useState<FactorySize>('FACTORY_I');
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);

  const buildFactory = trpc.factoryConstruction.createOrder.useMutation({
    onSuccess: () => {
      alert('Factory construction order submitted!');
      setResourceTypes([]);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    buildFactory.mutate({
      companyId,
      gameId,
      size,
      resourceTypes,
    });
  };

  // Available sizes based on tech level
  const availableSizes = [
    'FACTORY_I',
    sectorTechLevel >= 1 && 'FACTORY_II',
    sectorTechLevel >= 2 && 'FACTORY_III',
    sectorTechLevel >= 3 && 'FACTORY_IV',
  ].filter(Boolean) as FactorySize[];

  return (
    <div className="factory-construction p-6 border rounded">
      <h3 className="text-xl font-bold mb-4">Build Factory</h3>
      
      <div className="mb-4">
        <label className="block mb-2">Factory Size</label>
        <select 
          value={size} 
          onChange={(e) => setSize(e.target.value as FactorySize)}
          className="w-full p-2 border rounded"
        >
          {availableSizes.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Resource Types</label>
        {/* Add resource type selector here */}
        <div>Selected: {resourceTypes.join(', ')}</div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={buildFactory.isLoading || resourceTypes.length === 0}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {buildFactory.isLoading ? 'Submitting...' : 'Build Factory'}
      </button>
    </div>
  );
}
```

### 3. Production History Viewer (20 min)
```typescript
// components/Game/ModernOperations/ProductionHistoryViewer.tsx
'use client';

import { trpc } from '@/app/trpc';

interface Props {
  companyId: string;
  gameTurnId: string;
}

export function ProductionHistoryViewer({ companyId, gameTurnId }: Props) {
  const { data: summary, isLoading } = 
    trpc.factoryProduction.getFactoryProductionSummary.useQuery({
      companyId,
      gameTurnId,
    });

  const { data: details } = 
    trpc.factoryProduction.getCompanyProduction.useQuery({
      companyId,
      gameTurnId,
    });

  if (isLoading) return <div>Loading production data...</div>;

  return (
    <div className="production-history">
      <h3 className="text-xl font-bold mb-4">Turn {gameTurnId} - Earnings Report</h3>
      
      {/* Summary Card */}
      <div className="summary-card p-6 bg-blue-50 border rounded mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Customers</div>
            <div className="text-2xl font-bold">{summary?.totalCustomers}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              ${summary?.totalRevenue}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Costs</div>
            <div className="text-2xl font-bold text-red-600">
              ${summary?.totalCosts}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Profit</div>
            <div className={`text-2xl font-bold ${
              (summary?.totalProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${summary?.totalProfit}
            </div>
          </div>
        </div>
      </div>

      {/* Factory Breakdown */}
      <div className="factory-details">
        <h4 className="font-bold mb-2">Factory Breakdown</h4>
        {details?.map(record => (
          <div key={record.id} className="factory-record p-4 border rounded mb-2">
            <div className="flex justify-between">
              <span>Factory {record.Factory.slot}</span>
              <span>{record.customersServed} customers</span>
            </div>
            <div className="text-sm text-gray-600">
              Revenue: ${record.revenue} | 
              Costs: ${record.costs} | 
              Profit: ${record.profit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Consumption Bag Viewer (15 min)
```typescript
// components/Game/ModernOperations/ConsumptionBagViewer.tsx
'use client';

import { trpc } from '@/app/trpc';

interface Props {
  sectorId: string;
  gameId: string;
}

export function ConsumptionBagViewer({ sectorId, gameId }: Props) {
  const { data: summary, isLoading } = 
    trpc.consumptionMarker.getConsumptionBagSummary.useQuery({
      sectorId,
      gameId,
    });

  if (isLoading) return <div>Loading consumption bag...</div>;

  const totalMarkers = summary?.reduce((sum, s) => sum + s.count, 0) || 0;

  return (
    <div className="consumption-bag">
      <h4 className="font-bold mb-2">
        Consumption Bag ({totalMarkers} markers)
      </h4>
      
      <div className="space-y-2">
        {summary?.map((item, idx) => (
          <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
            <span>
              {item.resourceType} 
              {item.isPermanent ? ' 🔒' : ' ⏱️'}
            </span>
            <span className="font-bold">{item.count}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 text-sm text-gray-600">
        🔒 = Permanent | ⏱️ = Temporary
      </div>
    </div>
  );
}
```

### 5. Worker Allocation Display (10 min)
```typescript
// components/Game/ModernOperations/WorkerAllocation.tsx
'use client';

import { trpc } from '@/app/trpc';

interface Props {
  companyId: string;
  gameId: string;
}

export function WorkerAllocation({ companyId, gameId }: Props) {
  const { data: workforce } = 
    trpc.modernOperations.getCompanyWorkforceStatus.useQuery({
      companyId,
      gameId,
    });

  if (!workforce) return null;

  const factoryPercentage = (workforce.factoryWorkers / workforce.totalWorkers) * 100;
  const marketingPercentage = (workforce.marketingWorkers / workforce.totalWorkers) * 100;
  const availablePercentage = (workforce.availableWorkers / workforce.totalWorkers) * 100;

  return (
    <div className="worker-allocation">
      <h4 className="font-bold mb-2">Worker Allocation</h4>
      
      <div className="text-sm mb-2">
        {workforce.availableWorkers} / {workforce.totalWorkers} available
      </div>

      {/* Progress bar */}
      <div className="w-full h-8 bg-gray-200 rounded flex overflow-hidden">
        <div 
          className="bg-blue-500 flex items-center justify-center text-white text-xs"
          style={{ width: `${factoryPercentage}%` }}
        >
          Factory: {workforce.factoryWorkers}
        </div>
        <div 
          className="bg-green-500 flex items-center justify-center text-white text-xs"
          style={{ width: `${marketingPercentage}%` }}
        >
          Marketing: {workforce.marketingWorkers}
        </div>
        <div 
          className="bg-gray-400 flex items-center justify-center text-white text-xs"
          style={{ width: `${availablePercentage}%` }}
        >
          Available: {workforce.availableWorkers}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Recommended Development Order

### Phase 1: Read-Only Views (1-2 days)
1. ✅ Resource price display
2. ✅ Consumption bag viewer
3. ✅ Factory list with basic info
4. ✅ Worker allocation display
5. ✅ Research progress tracker

### Phase 2: Factory System (2-3 days)
1. ✅ Factory construction panel
2. ✅ Factory production history
3. ✅ Earnings dashboard
4. ✅ Resource cost calculator

### Phase 3: Marketing & Research (1-2 days)
1. ✅ Marketing campaign manager
2. ✅ Research action submitter
3. ✅ Brand score display
4. ✅ Tech level display

### Phase 4: Polish (1-2 days)
1. ✅ Animations and transitions
2. ✅ Loading states
3. ✅ Error handling
4. ✅ Responsive design
5. ✅ Real-time updates

---

## 💡 Pro Tips

### Use React Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function Providers({ children }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Enable Optimistic Updates
```typescript
const utils = trpc.useUtils();

const buildFactory = trpc.factoryConstruction.createOrder.useMutation({
  onMutate: async (newFactory) => {
    // Cancel outgoing refetches
    await utils.factory.getCompanyFactories.cancel();

    // Optimistically update
    const previousFactories = utils.factory.getCompanyFactories.getData();
    utils.factory.getCompanyFactories.setData({ companyId, gameId }, (old) => [
      ...(old || []),
      newFactory as any, // Optimistic factory
    ]);

    return { previousFactories };
  },
  onError: (err, newFactory, context) => {
    // Rollback on error
    utils.factory.getCompanyFactories.setData(
      { companyId, gameId },
      context?.previousFactories
    );
  },
});
```

### Auto-refetch on Phase Change
```typescript
useEffect(() => {
  const channel = pusher.subscribe(`game-${gameId}`);
  
  channel.bind('EVENT_NEW_PHASE', (phaseName: string) => {
    // Refetch relevant data when phase changes
    if (phaseName === 'CONSUMPTION_PHASE') {
      utils.consumptionMarker.getAllConsumptionBags.invalidate();
    }
    if (phaseName === 'EARNINGS_CALL') {
      utils.factoryProduction.getCompanyProductionSummary.invalidate();
    }
  });

  return () => {
    pusher.unsubscribe(`game-${gameId}`);
  };
}, [gameId]);
```

---

## 🎨 UI Design Patterns

### 1. Factory Construction Flow
```
┌─────────────────────────────────────┐
│  Step 1: Select Factory Size        │
│  ○ Factory I   ○ Factory II         │
│  ○ Factory III ○ Factory IV         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Step 2: Choose Resources           │
│  ☑ Circle   ☑ Healthcare            │
│  ☐ Square   ☐ Triangle              │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Preview:                           │
│  Cost: $150                         │
│  Workers Required: 8                │
│  Customers Per Turn: 4              │
│                                     │
│  [ Submit Order ]                   │
└─────────────────────────────────────┘
```

### 2. Earnings Dashboard Layout
```
┌────────────────────────────────────────┐
│  Turn 5 Earnings Report                │
├────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌─────┐│
│  │  15  │  │ $450 │  │ $210 │  │ $240││
│  │Cust. │  │ Rev. │  │Costs │  │Profit││
│  └──────┘  └──────┘  └──────┘  └─────┘│
├────────────────────────────────────────┤
│  Factory Breakdown:                    │
│  ┌────────────────────────────────────┐│
│  │ Factory 1 (II): 6 cust, $180 rev  ││
│  │ Factory 2 (III): 4 cust, $120 rev ││
│  │ Factory 3 (I): 5 cust, $150 rev   ││
│  └────────────────────────────────────┘│
└────────────────────────────────────────┘
```

### 3. Resource Track Visualization
```
Circle Resources
Position: 3 → Price: $15

[■■■□□□□□□□] 
 0 1 2 3 4 5 6 7 8 9
 $5      $15       $40
```

---

## 🔥 Hot Paths (Most Used Endpoints)

### During Gameplay
1. `trpc.resource.getAllResourcePrices.useQuery()`
2. `trpc.factory.getCompanyFactoriesWithProduction.useQuery()`
3. `trpc.modernOperations.getCompanyWorkforceStatus.useQuery()`
4. `trpc.consumptionMarker.getConsumptionBagSummary.useQuery()`

### CEO Actions
1. `trpc.factoryConstruction.createOrder.useMutation()`
2. `trpc.modernOperations.submitMarketingCampaign.useMutation()`
3. `trpc.modernOperations.submitResearchAction.useMutation()`

### Post-Turn Analysis
1. `trpc.factoryProduction.getFactoryProductionSummary.useQuery()`
2. `trpc.factoryProduction.getCompanyProductionHistory.useQuery()`

---

## 🐛 Common Issues & Solutions

### Issue: "Only CEO can submit"
**Solution:** Check that `company.ceoId === currentPlayerId`
```typescript
const { data: company } = trpc.company.getCompany.useQuery({ id: companyId });
const isCEO = company?.ceoId === currentPlayerId;

// Only show construction panel if CEO
{isCEO && <FactoryConstructionPanel />}
```

### Issue: "Action not allowed during current phase"
**Solution:** Check current phase before showing action buttons
```typescript
const { data: game } = trpc.game.getCurrentGameState.useQuery({ gameId });
const currentPhase = game?.Phase?.find(p => p.id === game.currentPhaseId);

const canBuildFactory = currentPhase?.name === 'FACTORY_CONSTRUCTION';
```

### Issue: Type errors with ResourceType
**Solution:** Import from @prisma/client
```typescript
import { ResourceType, FactorySize } from '@prisma/client';
```

---

## 🎯 Starter Checklist

- [ ] Database pushed (`npx prisma db push`)
- [ ] Verification script passed
- [ ] ResourcePriceDisplay component created
- [ ] FactoryConstructionPanel component created
- [ ] ProductionHistoryViewer component created
- [ ] ConsumptionBagViewer component created
- [ ] WorkerAllocation component created
- [ ] Components integrated into main game view
- [ ] Real-time updates working (Pusher)
- [ ] Error handling implemented
- [ ] Loading states added

---

## 📚 Reference Files

- **`TRPC_API_REFERENCE.md`** - Complete endpoint documentation
- **`README_OPERATION_RULES.md`** - Game rules
- **`FACTORY_PRODUCTION_EXPLAINED.md`** - How production works
- **`DEPLOYMENT_CHECKLIST.md`** - Backend setup

---

## 🚀 You're Ready to Build!

Everything you need is in place:
- ✅ Type-safe API endpoints
- ✅ Validated mutations
- ✅ Efficient queries
- ✅ Real-time capable
- ✅ Component templates
- ✅ Design patterns

**Start with the ResourcePriceDisplay component and work your way up!** 🎨

Questions? Check the API reference or the game rules document!

