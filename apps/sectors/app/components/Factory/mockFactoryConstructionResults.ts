export const mockFactoryConstructionResults = [
  {
    id: '1',
    companyName: 'Acme Corp',
    playerName: 'Alice',
    factorySize: 'FACTORY_I',
    resources: [
      { type: 'MATERIALS', label: 'STAR', price: 25 },
      { type: 'CIRCLE', label: 'CIRCLE', price: 20 },
    ],
    workersAssigned: 2,
    totalCost: 45,
  },
  {
    id: '2',
    companyName: 'Beta Industries',
    playerName: 'Bob',
    factorySize: 'FACTORY_II',
    resources: [
      { type: 'INDUSTRIALS', label: 'STAR', price: 30 },
      { type: 'SQUARE', label: 'SQUARE', price: 15 },
      { type: 'TRIANGLE', label: 'TRIANGLE', price: 10 },
    ],
    workersAssigned: 3,
    totalCost: 55,
  },
]; 