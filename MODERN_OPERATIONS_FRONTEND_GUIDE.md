# Modern Operations - Frontend Integration Guide

## Phase Actions Summary

This guide outlines what player actions are required during each modern operation phase.

## Player Action Phases

### FACTORY_CONSTRUCTION
**Player Action**: Company CEOs submit factory construction orders

**Required Input**:
```typescript
{
  companyId: string;
  playerId: string; // CEO of the company
  size: FactorySize; // FACTORY_I, FACTORY_II, FACTORY_III, or FACTORY_IV
  resourceTypes: ResourceType[]; // Blueprint choices
  gameTurnId: string;
  gameId: string;
  phaseId: string;
  sectorId: string;
}
```

**Validation**:
- Player must be CEO of company (highest shareholder)
- Factory count must be within sector technology level limits
- Resource types must include sector-specific resource + chosen global resources

**Example**:
```typescript
// Healthcare company building FACTORY_II
{
  size: FactorySize.FACTORY_II,
  resourceTypes: [
    ResourceType.HEALTHCARE,    // Required sector resource
    ResourceType.TRIANGLE,      // Player choice
    ResourceType.SQUARE,        // Player choice
  ]
}
```

### MARKETING_AND_RESEARCH_ACTION
**Player Actions**: 
1. Launch marketing campaigns
2. Invest in research

#### Marketing Campaign Submission
```typescript
{
  companyId: string;
  gameId: string;
  tier: MarketingCampaignTier; // TIER_1, TIER_2, or TIER_3
  slot: number; // 1-5 (based on phase)
}
```

**Costs**:
- Base: $100 (Tier 1), $200 (Tier 2), $300 (Tier 3)
- Slot Penalty: $0 (slot 1), $100 (slot 2), $200 (slot 3), $300 (slot 4), $400 (slot 5)
- Total = Base + Slot Penalty

#### Research Action Submission
```typescript
{
  companyId: string;
  gameId: string;
  researchInvestment: number; // Amount to invest ($100, $200, $300, or $400 based on phase)
}
```

**Effect**: Increases `company.researchProgress` by random amount (0, +1, or +2)

## Read-Only Phases (No Player Input)

### FACTORY_CONSTRUCTION_RESOLVE
**What Happens**:
- System validates all construction orders
- Companies pay blueprint costs (simultaneous resource pricing)
- Factories created (operational next turn)
- Consumption markers added to sector bags
- Resources consumed, prices updated

**Frontend Display**:
- Show which factories were built
- Display updated resource prices
- Show blueprint costs paid

### MARKETING_AND_RESEARCH_ACTION_RESOLVE
**What Happens**:
- Marketing campaigns activated
- Temporary consumption markers added
- Brand scores updated
- Research milestones checked and rewards granted

**Frontend Display**:
- Show active campaigns per company
- Display brand score changes
- Show research progress and milestone rewards

### CONSUMPTION_PHASE
**What Happens**:
- System draws from consumption bags for each customer
- Customers allocated to factories by attraction rating
- Sector scores adjusted based on service quality
- Temporary marketing markers consumed

**Frontend Display**:
- Animation of goods being drawn from bag
- Show which factories served customers
- Display sector score changes
- Show factory capacity usage

### EARNINGS_CALL
**What Happens**:
- Revenue calculated: customers × (unit price + sum of resource prices)
- Costs calculated: workers × salary
- Profit/loss determined
- Stock prices adjusted
- Company cash updated

**Frontend Display**:
- Show revenue breakdown per company
- Display P&L statements
- Animate stock price movements
- Show earnings per factory

## UI Components Needed

### Factory Construction Interface
```typescript
<FactoryConstructionPanel>
  - Display available factory sizes (based on technology level)
  - Show resource requirements for each size
  - Display current resource prices
  - Calculate and show total blueprint cost
  - Resource selector for blueprint configuration
  - Submit construction order button
</FactoryConstructionPanel>
```

### Consumption Bag Visualization
```typescript
<ConsumptionBagView sectorId={string}>
  - Display sector consumption bag contents
  - Show permanent vs temporary markers
  - Animate marker draws during CONSUMPTION_PHASE
  - Show factory assignments
</ConsumptionBagView>
```

### Resource Track Display
```typescript
<ResourceTrackPanel>
  - Show all resource types (global + sector-specific)
  - Display current track position
  - Show current price for each resource
  - Animate track movement when resources consumed
  - Color-code: Global (CIRCLE, SQUARE, TRIANGLE) vs Sector-specific
</ResourceTrackPanel>
```

### Company Dashboard (Modern)
```typescript
<ModernCompanyDashboard companyId={string}>
  - Factories section:
    - Show all factories with sizes, resources, operational status
    - Display customer capacity and current servicing
  - Marketing section:
    - Active campaigns with decay timers
    - Brand score display
    - New campaign creation
  - Research section:
    - Progress tracker
    - Milestone indicators
    - Investment button
  - Financial summary:
    - Revenue from last earnings call
    - Current cash on hand
    - Projected costs (workers, campaigns)
</ModernCompanyDashboard>
```

## tRPC Endpoints Needed

### Factory Construction
```typescript
factoryConstruction: {
  createOrder: procedure
    .input(z.object({
      companyId: z.string(),
      size: z.nativeEnum(FactorySize),
      resourceTypes: z.array(z.nativeEnum(ResourceType)),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create FactoryConstructionOrder
    }),
    
  getCompanyFactories: procedure
    .input(z.object({ companyId: z.string(), gameId: z.string() }))
    .query(async ({ input }) => {
      // Return all factories for company
    }),
}
```

### Marketing Campaigns
```typescript
marketing: {
  launchCampaign: procedure
    .input(z.object({
      companyId: z.string(),
      gameId: z.string(),
      tier: z.nativeEnum(MarketingCampaignTier),
      slot: z.number().min(1).max(5),
    }))
    .mutation(async ({ input }) => {
      // Create marketing campaign
    }),
    
  getActiveCampaigns: procedure
    .input(z.object({ companyId: z.string(), gameId: z.string() }))
    .query(async ({ input }) => {
      // Return active campaigns for company
    }),
}
```

### Research
```typescript
research: {
  investInResearch: procedure
    .input(z.object({
      companyId: z.string(),
      amount: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Increase research progress
      // Draw research card
    }),
    
  getResearchProgress: procedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ input }) => {
      // Return research progress and milestones
    }),
}
```

### Consumption Bag
```typescript
consumptionBag: {
  getSectorBag: procedure
    .input(z.object({ sectorId: z.string(), gameId: z.string() }))
    .query(async ({ input }) => {
      // Return all consumption markers for sector
    }),
}
```

### Resources
```typescript
resources: {
  getGameResources: procedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      // Return all resources with current prices and track positions
    }),
}
```

## Pusher Events

### Phase Transitions
Existing `EVENT_NEW_PHASE` will trigger for all modern phases.

### Suggested New Events
```typescript
// When factory becomes operational
EVENT_FACTORY_OPERATIONAL = 'factory-operational';

// When consumption phase completes
EVENT_CONSUMPTION_COMPLETE = 'consumption-complete';

// When earnings are calculated
EVENT_EARNINGS_ANNOUNCED = 'earnings-announced';

// When resource prices update
EVENT_RESOURCE_PRICES_UPDATED = 'resource-prices-updated';
```

## Phase Timer Configuration

Phase times are defined in `phaseTimes` constant. Recommended times:

```typescript
[PhaseName.FACTORY_CONSTRUCTION]: 180000, // 3 minutes
[PhaseName.FACTORY_CONSTRUCTION_RESOLVE]: 15000, // 15 seconds
[PhaseName.MARKETING_AND_RESEARCH_ACTION]: 120000, // 2 minutes
[PhaseName.MARKETING_AND_RESEARCH_ACTION_RESOLVE]: 15000, // 15 seconds
[PhaseName.CONSUMPTION_PHASE]: 30000, // 30 seconds (animation time)
[PhaseName.EARNINGS_CALL]: 30000, // 30 seconds (review results)
```

## Data Subscription Patterns

### Real-time Updates
```typescript
// Subscribe to game state
const { data: gameState } = trpc.game.getGameState.useQuery(
  { gameId },
  { refetchInterval: false } // Use Pusher events instead
);

// Listen for phase changes
pusher.bind(EVENT_NEW_PHASE, (phaseName: PhaseName) => {
  // Update UI based on phase
  switch (phaseName) {
    case PhaseName.FACTORY_CONSTRUCTION:
      // Show factory construction panel for CEOs
      break;
    case PhaseName.CONSUMPTION_PHASE:
      // Show consumption animation
      break;
    case PhaseName.EARNINGS_CALL:
      // Show earnings results
      break;
  }
});
```

## Example User Flows

### Building a Factory (CEO)
1. **Phase**: FACTORY_CONSTRUCTION starts
2. **Player sees**: Factory construction panel opens
3. **Player selects**:
   - Factory size (limited by technology level)
   - Resources for blueprint
4. **Player confirms**: Sees estimated cost based on current resource prices
5. **Submit order**
6. **Phase**: FACTORY_CONSTRUCTION_RESOLVE
7. **Player sees**: 
   - Factory created (if affordable)
   - Updated company cash
   - New consumption marker added to sector bag
8. **Next turn**: Factory becomes operational

### Marketing Campaign
1. **Phase**: MARKETING_AND_RESEARCH_ACTION starts
2. **Player sees**: Marketing panel with available slots
3. **Player selects**:
   - Campaign tier (I, II, or III)
   - Slot (affects cost)
4. **Submit campaign**
5. **Phase**: MARKETING_AND_RESEARCH_ACTION_RESOLVE
6. **Player sees**:
   - Brand score increased
   - Temporary markers added to consumption bag
   - Campaign appears in active campaigns list
7. **Future turns**: Campaign decays after 2 turns

### Consumption Phase (Watch)
1. **Phase**: CONSUMPTION_PHASE starts
2. **Animation**:
   - Markers drawn from sector bags (one per customer)
   - Customers routed to best factories
   - Factories fill up as they serve customers
3. **Results**:
   - Sector scores adjust
   - Factory performance logged
4. **Next phase**: EARNINGS_CALL calculates revenue

## Common Patterns

### Check if Player is CEO
```typescript
const isCEO = (companyId: string, playerId: string): boolean => {
  const company = companies.find(c => c.id === companyId);
  return company?.ceoId === playerId;
};
```

### Calculate Factory Blueprint Cost
```typescript
const calculateBlueprintCost = (
  resourceTypes: ResourceType[],
  resourcePrices: Map<ResourceType, number>
): number => {
  return resourceTypes.reduce(
    (sum, type) => sum + (resourcePrices.get(type) || 0),
    0
  );
};
```

### Calculate Attraction Rating
```typescript
const calculateAttractionRating = (company: Company): number => {
  const brandBonus = company.marketingCampaigns
    .filter(c => c.status !== 'EXPIRED')
    .reduce((sum, c) => sum + c.brandBonus, 0);
  
  return company.unitPrice - brandBonus;
};
```

## Testing Checklist

- [ ] Factory construction with various resource combinations
- [ ] Multiple factories per company (up to tech limit)
- [ ] Marketing campaigns at all tiers
- [ ] Concurrent marketing slots with increasing costs
- [ ] Research milestones trigger correctly
- [ ] Consumption bag draws distribute fairly
- [ ] Attraction rating sorting works
- [ ] Factories become operational after 1 turn
- [ ] Marketing campaigns decay properly
- [ ] Resource prices update after consumption
- [ ] Earnings calculations are accurate
- [ ] Stock prices adjust based on profitability
- [ ] Sector scores update based on service quality
- [ ] Technology levels unlock new phases

