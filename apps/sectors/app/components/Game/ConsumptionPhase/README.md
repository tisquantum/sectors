# Consumption Phase Components

This directory contains components for visualizing the consumption phase of the game, where consumers are distributed to factories based on their schematics and company brand scores.

## Components

### ConsumptionPhase (Main Component)
The main orchestrator component that provides a tabbed interface to view different aspects of the consumption phase.

**Features:**
- Tabbed interface with three main sections
- Dummy data for demonstration
- Responsive design

### ConsumerFlowPerSector
Shows consumer profiles for each sector and how companies' factories match against them.

**Features:**
- Consumer profiles with resource icons
- Factory matching visualization
- Capacity utilization indicators
- Brand score display

### CompanyPerformance
Provides detailed breakdown of how each company performed in the consumption phase.

**Features:**
- Summary table with key metrics
- Detailed factory breakdown per company
- Efficiency calculations
- Profit tracking

### ConsumerFlowLog
Detailed log of where each consumer went and why they were assigned to specific factories.

**Features:**
- Filterable by reason (exact match, brand score, only option)
- Sortable by timestamp or destination
- Visual indicators for different assignment reasons
- Summary statistics

### ResourceIcon
Reusable component for rendering different resource types as colored shapes.

**Features:**
- Support for all resource types (TRIANGLE, SQUARE, CIRCLE, STAR, etc.)
- Hover tooltips
- Customizable size
- Consistent color scheme

## Consumer Flow Priority Rules

The consumption phase follows these priority rules:

1. **Exact Match**: Consumers only go to factories that match their exact resource profile
2. **Brand Score**: If multiple factories can receive consumers, the company with the higher brand score is chosen first
3. **Company Age**: If brand scores are tied, the older company is chosen first

## Data Structure

The components expect data in the following format:

```typescript
interface Sector {
  id: string;
  name: string;
  consumerProfiles: ConsumerProfile[];
}

interface ConsumerProfile {
  factorySize: string;
  resources: string[];
  consumerCount: number;
}

interface Company {
  id: string;
  name: string;
  brandScore: number;
  sector: string;
  factories: Factory[];
}

interface Factory {
  id: string;
  size: string;
  resources: string[];
  consumersReceived: number;
  maxConsumers: number;
  profit: number;
}

interface FlowLogEntry {
  id: string;
  consumerProfile: string;
  destination: string;
  reason: string;
  timestamp: string;
}
```

## Usage

```tsx
import { ConsumptionPhase } from '@/components/Game/ConsumptionPhase';

// In your game component
{currentPhase?.name === PhaseName.CONSUMPTION_PHASE && (
  <ConsumptionPhase />
)}
```

## Styling

All components use Tailwind CSS classes and follow the existing dark theme pattern:
- Background: `bg-gray-800`
- Borders: `border-gray-700`
- Text: `text-white`, `text-gray-300`, `text-gray-400`
- Accent colors: `text-green-400`, `text-blue-400`, `text-yellow-400`

## Future Enhancements

- Real-time data integration with the game state
- Animation for consumer flow visualization
- Export functionality for performance reports
- Interactive factory management
- Historical consumption data tracking 