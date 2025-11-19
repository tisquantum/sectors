# 🎯 Workforce & Research Tracks Reorganization Plan

## 📊 What Are These Tracks?

### 1. **Workforce Track** (Global Game Mechanic)
- **Purpose**: Shows the global workforce pool and economy score
- **What it shows**:
  - 40 spaces representing available workers
  - Available workers (green spaces) vs allocated workers
  - Economy Score (blue ring) - indicates economic strength
  - Worker allocation to factories and marketing campaigns
  
- **How it works**:
  - Workers start in the pool (available)
  - As companies build factories, workers move from pool to factories
  - As companies create marketing campaigns, workers move to marketing
  - Economy Score increases as more workers are allocated (stronger economy)
  - Economy Score determines worker salaries for factories

- **Why it matters**:
  - More allocated workers = stronger economy = higher worker salaries
  - Worker salaries are calculated from sector consumer score × sector resource price
  - Affects factory operating costs (more workers = higher costs)

### 2. **Sector Research Tracks** (Sector-Specific)
- **Purpose**: Shows research progress for each sector
- **What it shows**:
  - 20-space research track per sector (divided into 4 phases of 5 spaces each)
  - Sector-level progress (researchMarker)
  - Individual company progress within that sector
  - Rewards at milestones (spaces 5, 10, 15, 20)
  
- **How it works**:
  - Each sector has one shared research track
  - Companies in that sector advance research by allocating workers to research actions
  - Sector progress advances when companies complete research
  - Rewards are granted to the sector (grants at 5/10/15, market favors at 20)

- **Why it matters**:
  - Sector-wide technology level increases
  - Unlocks sector bonuses and rewards
  - Competitive advantage for companies in advanced sectors

---

## 🎨 Current Location & Issues

### Where They Are Now:
- **Location**: `StockRoundOrderGrid.tsx` (old component, likely legacy)
- **Displayed in**: Markets tab (incorrect location!)
- **Components**:
  - `WorkforceTrack` function inside `StockRoundOrderGrid.tsx`
  - `SectorResearchTracks` component that includes WorkforceTrack + sector tracks

### Problems:
1. ❌ **Wrong View**: These are NOT market-related, they belong in Economy/Operations
2. ❌ **Mixed with Stock Trading**: Currently shown alongside spot market orders
3. ❌ **Not Hooked Up**: Using old `StockRoundOrderGrid` which may not be fully integrated
4. ❌ **Confusing UX**: Players looking for economic info won't find it in Markets tab

---

## ✅ Proposed Reorganization

### Option 1: Move to Economy View (Recommended)
**Rationale**: Workforce and research are global economy mechanics, not market trading

**Location**: `EndTurnEconomy.tsx` → Create new section for Modern Operations tracks

**Structure**:
```
Economy View
├── Consumer Pool & Economy Score (existing)
├── Sectors Overview (existing)
├── Prestige Track (existing)
├── Research Deck (existing)
└── [NEW] Modern Operations Section (conditional - only for MODERN games)
    ├── Workforce Track
    └── Sector Research Tracks
```

**Benefits**:
- ✅ Logical grouping - all economy/global mechanics in one place
- ✅ Already shows Economy Score (workforce track indicator)
- ✅ Conditional rendering - only shows for modern operations games

### Option 2: Move to Operations View
**Rationale**: These tracks are specifically for modern operations mechanics

**Location**: `CompanyActionSlider` view or create new `OperationsView.tsx`

**Structure**:
```
Operations View
├── Company Action Slider (existing - for operating rounds)
└── [NEW] Modern Operations Tracks
    ├── Workforce Track
    └── Sector Research Tracks
```

**Benefits**:
- ✅ Separates modern operations from legacy operations
- ✅ Clear separation of concerns

---

## 🚀 Implementation Plan

### Step 1: Extract Components
1. Extract `WorkforceTrack` from `StockRoundOrderGrid.tsx` → `components/Game/Tracks/WorkforceTrack.tsx`
2. Extract `SectorResearchTracks` → `components/Game/Tracks/SectorResearchTracks.tsx`
3. Update to use real backend data (game.workforcePool, game.economyScore, sector.researchMarker)

### Step 2: Create New Section in Economy View
1. Add conditional section to `EndTurnEconomy.tsx`:
   ```tsx
   {gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN && (
     <div className="space-y-6 mt-6">
       <WorkforceTrack gameId={gameId} />
       <SectorResearchTracks gameId={gameId} />
     </div>
   )}
   ```

### Step 3: Remove from Markets
1. Remove `SectorResearchTracks` from `StockRoundOrderGrid.tsx`
2. Ensure `MarketsView.tsx` doesn't include these tracks
3. Clean up any unused code

### Step 4: Backend Data Integration
1. Ensure `WorkforceTrack` uses:
   - `game.workforcePool` (available workers)
   - `game.economyScore` (economy score)
   - `game.workers` (total workers)
   
2. Ensure `SectorResearchTracks` uses:
   - `trpc.sector.listSectors.useQuery` (sectors with researchMarker)
   - `trpc.company.listCompanies.useQuery` (company researchProgress)
   - Real-time data updates

### Step 5: Styling & UX
1. Use `ModernOperationsLayout` for consistency
2. Match existing Economy view styling
3. Add tooltips explaining mechanics
4. Responsive design for mobile

---

## 📋 Files to Modify

### New Files:
- `apps/sectors/app/components/Game/Tracks/WorkforceTrack.tsx`
- `apps/sectors/app/components/Game/Tracks/SectorResearchTracks.tsx`
- `apps/sectors/app/components/Game/Tracks/index.ts`

### Modified Files:
- `apps/sectors/app/components/Game/EndTurnEconomy.tsx` (add tracks section)
- `apps/sectors/app/components/Game/StockRoundOrderGrid.tsx` (remove tracks)
- `apps/sectors/app/components/Game/MarketsView.tsx` (ensure tracks not here)

---

## 🎯 Benefits of Reorganization

1. **Better UX**: Players find economic info in the Economy view, not Markets
2. **Clear Separation**: Markets = trading, Economy = global game state
3. **Modern Operations**: Tracks clearly associated with modern mechanics
4. **Maintainability**: Extracted components easier to maintain
5. **Consistency**: Uses `ModernOperationsLayout` for consistent styling

---

## 🔍 Questions to Consider

1. Should tracks be **always visible** or only during specific phases?
   - Recommendation: Always visible in Economy view for reference

2. Should we combine Workforce + Sector Research into one component or keep separate?
   - Recommendation: Keep separate for flexibility

3. Do we need a dedicated "Operations" view for modern operations, or is Economy sufficient?
   - Recommendation: Economy view is sufficient, add conditional section

