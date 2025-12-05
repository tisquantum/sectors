# Stock Round Frontend Changes Required

## Overview

The backend changes allow players to place multiple orders in a single stock round phase, but the frontend currently has logic that prevents this. The following changes are needed:

## Required Changes

### 1. Remove Order Input Auto-Close Logic

**File**: `apps/sectors/app/components/Game/StockRoundOrderGrid.tsx`

**Issue**: The `isOrderInputOpenPlayerOrderCounter` function closes the order input drawer after the player places one order, preventing multiple orders.

**Current Code** (lines 44-55):
```typescript
function isOrderInputOpenPlayerOrderCounter(
  playerOrdersConcealed: PlayerOrderConcealed[],
  authPlayer: Player,
  currentPhase: Phase,
  setIsOrderInputOpen: (open: boolean) => void
) {
  const orderCount = playerOrdersConcealed?.filter(
    (order) =>
      order.playerId === authPlayer.id && order.phaseId == currentPhase.id
  ).length;
  setIsOrderInputOpen(orderCount == 0); // This closes drawer after first order
}
```

**Fix**: Remove or modify this function to allow multiple orders. Options:
- **Option A**: Remove the auto-close logic entirely (let players manually close)
- **Option B**: Keep drawer open but allow manual closing
- **Option C**: Remove the function call entirely

**Recommended Change**:
```typescript
// Remove or comment out the function call that auto-closes the drawer
// In useEffect around line 148-156, remove or modify:
useEffect(() => {
  if (authPlayer && playerOrdersConcealed && currentPhase) {
    // REMOVE THIS: isOrderInputOpenPlayerOrderCounter(...)
    // Or modify to keep drawer open:
    // setIsOrderInputOpen(true); // Keep drawer open for multiple orders
  }
  if (currentPhase?.name !== PhaseName.STOCK_ACTION_ORDER) {
    closeDrawer();
  }
}, [playerOrdersConcealed, currentPhase]);
```

### 2. Update Sub-Round Display Logic

**Files**:
- `apps/sectors/app/components/Game/PhaseListComponent.tsx` (line 72-74)
- `apps/sectors/app/components/Company/StockOrderCompanyCard.tsx` (line 78, 92)
- `apps/sectors/app/components/Game/PendingOrders.tsx` (line 114-115)

**Issue**: These components display sub-round numbers, which are no longer relevant since we removed sub-rounds.

**Current Code Examples**:

**PhaseListComponent.tsx**:
```typescript
{phase == PhaseName.STOCK_ACTION_ORDER &&
  currentPhase?.StockSubRound?.roundNumber &&
  `(${currentPhase?.StockSubRound?.roundNumber})`}
```

**StockOrderCompanyCard.tsx**:
```typescript
const mapPhaseToStockRound = (phaseId: string) => {
  return phasesOfStockRound.findIndex((phase) => phase.id === phaseId) + 1;
};
// Used to show "Sub-round X" labels
```

**Fix**: 
- Remove sub-round number displays
- Since there's only one `STOCK_ACTION_ORDER` phase per stock round now, the `phasesOfStockRound` array will only have one element
- Update any UI that shows "Sub-round 1", "Sub-round 2" etc. to just show "Stock Round" or remove the label

**Recommended Changes**:

**PhaseListComponent.tsx**:
```typescript
// Remove sub-round display
<div>
  {friendlyPhaseName(phase) || phase}
  {/* REMOVED: Sub-round number display */}
</div>
```

**StockOrderCompanyCard.tsx**:
```typescript
// The mapPhaseToStockRound function is still used but will always return 1
// Consider removing sub-round references in the UI
// Or update to show "Stock Round" instead of "Sub-round X"
```

### 3. Update Order Validation Messages

**File**: `apps/sectors/app/components/Player/PlayerOrderInput.tsx`

**Issue**: The frontend should display helpful error messages when validation fails.

**Current**: Error messages are shown via toast (line 579), which is good.

**Enhancement**: Consider adding client-side validation hints before submission:
- Show warning if player already has a sell order for the company they're trying to buy
- Show warning if buy order would exceed 60% ownership
- Display current ownership percentage and pending orders

**Optional Enhancement**:
```typescript
// In PlayerOrderInput.tsx, add validation hints
const checkBuySellConflict = () => {
  const existingOrders = playerOrders?.filter(
    order => order.companyId === currentOrder.id && 
             order.stockRoundId === currentPhase?.stockRoundId
  );
  const hasBuyOrder = existingOrders.some(o => !o.isSell);
  const hasSellOrder = existingOrders.some(o => o.isSell);
  
  if (isBuy && hasSellOrder) {
    return "You already have a sell order for this company in this stock round.";
  }
  if (!isBuy && hasBuyOrder) {
    return "You already have a buy order for this company in this stock round.";
  }
  return null;
};

const checkOwnershipLimit = () => {
  if (!isBuy || !company) return null;
  
  const currentShares = company.Share.filter(
    s => s.location === ShareLocation.PLAYER && 
         s.playerId === authPlayer?.id
  ).length;
  
  const pendingBuyOrders = playerOrders?.filter(
    order => order.companyId === currentOrder.id && 
             !order.isSell && 
             order.stockRoundId === currentPhase?.stockRoundId
  ) || [];
  
  const pendingShares = pendingBuyOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  const totalAfterOrder = currentShares + pendingShares + share;
  const maxAllowed = Math.floor(company.Share.length * 0.6);
  
  if (totalAfterOrder > maxAllowed) {
    return `This order would exceed 60% ownership limit. Current: ${currentShares}, Pending: ${pendingShares}, This order: ${share}, Max: ${maxAllowed}`;
  }
  return null;
};
```

### 4. Update UI Text/Messaging

**File**: `apps/sectors/app/components/Game/StockRoundAction.tsx`

**Current** (line 41):
```typescript
<div>Place an Order With A Company to Start.</div>
```

**Suggested Update**:
```typescript
<div>Place orders with companies. You can place multiple orders, but cannot buy and sell from the same company.</div>
```

### 5. Verify Order Display

**File**: `apps/sectors/app/components/Player/PlayerCurrentQueuedOrders.tsx`

**Status**: ✅ This component already correctly shows all orders for the stock round, so it will work with multiple orders without changes.

## Summary of Changes

1. **Critical**: Remove auto-close logic in `StockRoundOrderGrid.tsx` to allow multiple orders
2. **Important**: Remove sub-round number displays from UI components
3. **Enhancement**: Add client-side validation hints in `PlayerOrderInput.tsx`
4. **Enhancement**: Update UI messaging to reflect new multi-order capability

## Testing Checklist

- [ ] Player can place multiple buy orders for different companies
- [ ] Player can place multiple sell orders for different companies
- [ ] Player cannot place both buy and sell orders for the same company (backend validation)
- [ ] Player cannot exceed 60% ownership with multiple buy orders (backend validation)
- [ ] Order input drawer stays open after placing first order
- [ ] Sub-round numbers are no longer displayed
- [ ] All orders are visible in "Current Queued Orders" component
- [ ] Error messages display correctly when validation fails

