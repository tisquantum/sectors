# Operating Round Revenue V2 Components

This directory contains V2 components for handling revenue distribution in the modern operation mechanics system. These components are specifically designed to work with the consumption phase revenue instead of traditional production revenue.

## Components

### OperatingRoundRevenueVoteV2
The V2 version of the revenue vote component that handles consumption phase revenue distribution.

**Key Features:**
- Only renders when `gameState.operationMechanicsVersion === OperationMechanicsVersion.MODERN`
- Displays consumption phase revenue instead of production revenue
- Shows factory performance breakdown from consumer consumption
- Sector overview with total revenue per sector
- Company-specific revenue cards with factory details
- Same voting options as V1 (Full Dividend, Half Dividend, Retain)

### Resolving the vote

There is no V2 resolve panel. Once the vote is cast the results are drawn onto
the company tiles on the board by `Board/BoardCompanyRevenue.tsx`, which also
supplies the short totals recap shown in the phase panel.

## Integration

The vote component is automatically integrated into the main Game component and
will only render when:
1. The current phase is `OPERATING_PRODUCTION_VOTE`
2. The game's `operationMechanicsVersion` is set to `MODERN`

## Data Structure

The V2 components expect consumption phase revenue data in the following format:

```typescript
interface ConsumptionRevenue {
  companyId: string;
  revenue: number;
  consumersReceived: number;
  factories: {
    id: string;
    size: string;
    profit: number;
    consumersReceived: number;
    maxConsumers: number;
  }[];
}
```

## Usage

The components are automatically used by the Game component based on the operation mechanics version. No manual integration is required.

## Differences from V1

- **Revenue Source**: V2 uses consumption phase revenue instead of production revenue
- **Factory Focus**: V2 emphasizes factory performance and consumer capacity utilization
- **Sector Overview**: V2 includes sector-level revenue summaries
- **Modern Mechanics**: V2 only works with the modern operation mechanics system

## Future Enhancements

- Integration with real consumption phase backend data
- Enhanced factory performance visualization
- Consumer flow integration
- Real-time revenue updates 