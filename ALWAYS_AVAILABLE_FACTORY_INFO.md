# 📊 Always-Available Factory Information (Regardless of Phase)

## ✅ How to See Factory Information Anytime

### **Method 1: Click Company Avatar (Always Available)**

**Location**: Company avatars appear throughout the game UI  
**Action**: Click on any company avatar/stock symbol  
**What Opens**: A popover with company information

**Contains**:
- Company details (name, stock symbol, price, etc.)
- **ModernCompany component** (at bottom) showing:
  - **Factory Slots** - Visual representation of all factories
  - **Marketing Slots** - Active marketing campaigns

**Now Fixed**: 
- ✅ `ModernCompany` now works without `currentPhase` requirement
- ✅ `FactorySlots` now uses **real factory data** from backend (not mock data)
- ✅ Shows actual factory status, workers, resources, production

---

### **Method 2: Use Programmatic Access**

#### In Custom Components:
```typescript
import { useCompanyOperations } from './ModernOperations/hooks';

function MyFactoryView({ companyId }: { companyId: string }) {
  const { factories, production, isLoading } = useCompanyOperations(companyId);
  
  return (
    <div>
      {factories.map(factory => (
        <div key={factory.id}>
          <h3>{factory.size} Factory</h3>
          <p>Slot: {factory.slot}</p>
          <p>Workers: {factory.workers}</p>
          <p>Operational: {factory.isOperational ? 'Yes' : 'No (Under Construction)'}</p>
          <p>Resources: {factory.resourceTypes.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Direct tRPC Query:
```typescript
import { trpc } from '@sectors/app/trpc';

function FactoryList({ companyId, gameId }: { companyId: string; gameId: string }) {
  const { data: factories } = trpc.factory.getCompanyFactories.useQuery({
    companyId,
    gameId,
  });
  
  // Use factories data...
}
```

---

## 🔧 What Was Fixed

### Before:
- ❌ `ModernCompany` returned `null` if `currentPhase` was undefined
- ❌ `FactorySlots` used hardcoded mock data
- ❌ Factory information only visible during specific phases

### After:
- ✅ `ModernCompany` works regardless of phase (only needs phase for factory creation)
- ✅ `FactorySlots` fetches and displays real factory data from backend
- ✅ Factory information available anytime via company popovers
- ✅ Shows real production data when available
- ✅ Shows actual factory status (operational vs under construction)

---

## 📍 Quick Access Guide

| What You Want | How to Access |
|--------------|---------------|
| **See your company's factories** | Click your company avatar → See "Factories" section in popover |
| **See any company's factories** | Click any company avatar → See "Factories" section in popover |
| **View factory details** | Click company → Factory slots show size, workers, resources, status |
| **Check production data** | Click company → Factory slots show profit from current turn (if available) |
| **See all factories in code** | Use `useCompanyOperations(companyId)` hook |
| **Query specific factory** | Use `trpc.factory.getFactoryDetails.useQuery(factoryId)` |

---

## 💡 Tips

1. **Company Avatars**: Look for colored circular avatars with stock symbols - these are clickable
2. **Factory Slots**: The visual slots show:
   - Orange border = factory exists
   - Gray border = empty slot (available for construction)
   - Green indicator = factory is operational
   - No indicator = factory is under construction
3. **Production Data**: Profit shown on factories is from current turn's production (if consumption phase has run)
4. **Always Works**: This works in **any phase** - not just factory-related phases

---

## 🎯 Example: Viewing Factory Info

1. **Find Company Avatar** (visible in various game views)
2. **Click on Avatar** → Popover opens
3. **Scroll Down** → See "Factories" section
4. **View Factory Slots**:
   - Each slot shows factory size (I, II, III, IV)
   - Visual factory card shows:
     - Workers assigned
     - Resources (shapes/colors)
     - Operational status
     - Profit (if production data available)

This information is **always available** regardless of what phase the game is in!
