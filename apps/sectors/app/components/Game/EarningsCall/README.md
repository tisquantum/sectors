# Earnings Call Component

The `EarningsCall` component displays the breakdown of net profits from the consumption phase, showing how companies performed after accounting for operating expenses.

## Features

- **Summary Statistics**: Shows total net profit, gross profit, operating expenses, and consumers served
- **Company Breakdown**: Detailed view of each company's performance
- **Factory Analysis**: Individual factory performance with profit calculations
- **Operating Expense Calculation**: Breakdown of how operating expenses are calculated

## Operating Expense Formula

The operating expense for each factory is calculated as:
```
Operating Expense = (Worker Track Score × Factory Workers) + Sector Demand
```

Where:
- **Worker Track Score**: Current economy score that determines worker salary rates
- **Factory Workers**: Number of workers assigned to the factory
- **Sector Demand**: Additional cost based on sector consumer demand and resource prices

## Data Structure

The component expects data in the following format:

```typescript
interface FactoryEarnings {
  id: string;
  size: FactorySize;
  workers: number;
  consumersReceived: number;
  maxConsumers: number;
  grossProfit: number;
  operatingExpense: number;
  netProfit: number;
}

interface CompanyEarnings {
  id: string;
  name: string;
  sector: SectorName;
  brandScore: number;
  factories: FactoryEarnings[];
  totalGrossProfit: number;
  totalOperatingExpense: number;
  totalNetProfit: number;
}
```

## Usage

```tsx
import { EarningsCall } from '@/components/Game/EarningsCall';

// In your game component
{currentPhase?.name === PhaseName.EARNINGS_CALL && (
  <EarningsCall />
)}
```

## Styling

The component follows the existing dark theme pattern:
- Background: `bg-gray-800`
- Borders: `border-gray-700`
- Text: `text-white`, `text-gray-300`, `text-gray-400`
- Profit colors: `text-green-400` (net profit), `text-blue-400` (gross profit), `text-red-400` (expenses)

## Future Enhancements

- Real-time data integration with the game state
- Historical earnings comparison
- Export functionality for financial reports
- Interactive charts and graphs
- Detailed operating expense breakdown with actual game calculations 