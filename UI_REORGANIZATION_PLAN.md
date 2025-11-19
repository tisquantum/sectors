# 🎨 Modern Operations UI Reorganization Plan

## Current Issues
1. Components scattered across different folders
2. Dummy data in ConsumptionPhase instead of real backend calls
3. No consistent structure for modern operation phases
4. Missing proper data hooks for shared logic
5. Resolve phases not fully implemented

## New Structure

```
apps/sectors/app/components/Game/
├── ModernOperations/
│   ├── phases/
│   │   ├── FactoryConstructionPhase.tsx (moved from root)
│   │   ├── FactoryConstructionResolvePhase.tsx (new)
│   │   ├── MarketingAndResearchPhase.tsx (moved from root)
│   │   ├── MarketingAndResearchResolvePhase.tsx (moved from root)
│   │   ├── ConsumptionPhase.tsx (moved from root, refactored)
│   │   └── EarningsCallPhase.tsx (moved from root)
│   ├── components/
│   │   ├── ConsumptionBagViewer.tsx (existing)
│   │   ├── ResourceTracksDisplay.tsx (new, extracted from FactoryConstruction)
│   │   ├── FactoryList.tsx (new)
│   │   ├── ProductionHistory.tsx (new)
│   │   └── WorkerStatus.tsx (existing, renamed)
│   ├── hooks/
│   │   ├── useModernOperations.ts (new - shared data fetching)
│   │   ├── useResourceTracks.ts (new)
│   │   ├── useConsumptionBags.ts (new)
│   │   └── useFactoryProduction.ts (new)
│   ├── layouts/
│   │   └── ModernOperationsLayout.tsx (new - consistent wrapper)
│   └── index.ts (barrel export)
```

## Implementation Steps

### Phase 1: Create Structure & Hooks
1. ✅ Create ModernOperations folder structure
2. Create shared hooks for data fetching
3. Create ModernOperationsLayout component

### Phase 2: Refactor Components
1. Move phase components to ModernOperations/phases/
2. Extract shared components
3. Refactor ConsumptionPhase to use real data
4. Create missing resolve phase components

### Phase 3: Update Integration
1. Update Game.tsx to use new structure
2. Ensure all tRPC calls are properly connected
3. Add error handling and loading states

### Phase 4: Polish
1. Consistent styling
2. Add tooltips and help text
3. Improve mobile responsiveness

## Key Improvements

### 1. Shared Data Hooks
```typescript
// useModernOperations.ts
export function useModernOperations(gameId: string) {
  const resources = trpc.resource.getGameResources.useQuery({ gameId });
  const sectors = trpc.sector.listSectors.useQuery({ where: { gameId } });
  const consumptionBags = trpc.consumptionMarker.getAllConsumptionBags.useQuery({ gameId });
  // ... etc
  return { resources, sectors, consumptionBags, ... };
}
```

### 2. Consistent Layout
```typescript
// ModernOperationsLayout.tsx
export function ModernOperationsLayout({ 
  title, 
  description, 
  children,
  sidebar 
}) {
  return (
    <div className="modern-operations-layout">
      <Header title={title} description={description} />
      <div className="content-grid">
        <main>{children}</main>
        {sidebar && <aside>{sidebar}</aside>}
      </div>
    </div>
  );
}
```

### 3. Real Data Integration
- ConsumptionPhase: Use real FactoryProduction data
- FactoryConstruction: Already connected ✅
- EarningsCall: Already connected ✅
- MarketingAndResearch: Partially connected, needs improvement

## Benefits
- ✅ Organized, maintainable code structure
- ✅ Reusable hooks reduce duplication
- ✅ Consistent UI/UX across all modern operation phases
- ✅ All components use real backend data
- ✅ Easier to add new phases in the future

