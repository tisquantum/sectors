import {
  Company,
  CompanyTier,
  ResearchDeck,
  Sector,
  SectorName,
} from '@prisma/client';

interface GameDataJson {
  sectors: any[];
  companies: any[];
  researchDeck: Partial<any>[];
}
export const gameDataJson: GameDataJson = {
  sectors: [
    {
      id: '1',
      name: 'Consumer Cyclical',
      supply: 100,
      demand: 3,
      marketingPrice: 40.0,
      basePrice: 75.0,
      ipoMin: 20,
      ipoMax: 70,
      supplyDefault: 2,
      demandMax: 0,
      demandMin: 0,
      unitPriceMin: 40,
      unitPriceMax: 60,
      supplyMin: 2,
      supplyMax: 2,
      sectorName: SectorName.CONSUMER_CYCLICAL,
    },
    {
      id: '2',
      name: 'Consumer Defensive',
      supply: 100,
      demand: 2,
      marketingPrice: 50.0,
      basePrice: 75.0,
      sharePercentageToFloat: 30,
      ipoMin: 40,
      ipoMax: 60,
      supplyDefault: 3,
      demandMax: 0,
      demandMin: 0,
      unitPriceMin: 50,
      unitPriceMax: 80,
      supplyMin: 0,
      supplyMax: 3,
      sectorName: SectorName.CONSUMER_DEFENSIVE,
    },
    {
      id: '3',
      name: 'Industrial',
      supply: 100,
      demand: 2,
      marketingPrice: 50.0,
      basePrice: 75.0,
      ipoMin: 55,
      ipoMax: 70,
      sharePercentageToFloat: 50,
      supplyDefault: 2,
      demandMax: 0,
      demandMin: 0,
      unitPriceMin: 70,
      unitPriceMax: 80,
      supplyMin: 1,
      supplyMax: 2,
      sectorName: SectorName.INDUSTRIALS,
    },
    {
      id: '4',
      name: 'Technology',
      supply: 100,
      demand: 1,
      marketingPrice: 50.0,
      basePrice: 75.0,
      ipoMin: 5,
      ipoMax: 80,
      sharePercentageToFloat: 70,
      supplyDefault: 3,
      demandMax: 0,
      demandMin: 0,
      unitPriceMin: 30,
      unitPriceMax: 100,
      supplyMin: 0,
      supplyMax: 4,
      sectorName: SectorName.TECHNOLOGY,
    },
    {
      id: '5',
      name: 'Healthcare',
      supply: 100,
      demand: 2,
      marketingPrice: 50.0,
      basePrice: 75.0,
      sharePercentageToFloat: 60,
      ipoMin: 50,
      ipoMax: 60,
      supplyDefault: 2,
      demandMax: 1,
      demandMin: 1,
      unitPriceMin: 60,
      unitPriceMax: 80,
      supplyMin: 1,
      supplyMax: 3,
      sectorName: SectorName.HEALTHCARE,
    },
    {
      id: '6',
      name: 'Energy',
      supply: 100,
      demand: 2,
      marketingPrice: 50.0,
      basePrice: 75.0,
      sharePercentageToFloat: 60,
      ipoMin: 30,
      ipoMax: 40,
      supplyDefault: 2,
      demandMax: 1,
      demandMin: 1,
      unitPriceMin: 50,
      unitPriceMax: 80,
      supplyMin: 1,
      supplyMax: 2,
      sectorName: SectorName.ENERGY,
    },
    {
      id: '7',
      name: 'Materials',
      supply: 100,
      demand: 2,
      marketingPrice: 50.0,
      basePrice: 75.0,
      sharePercentageToFloat: 50,
      ipoMin: 60,
      ipoMax: 70,
      supplyDefault: 2,
      demandMax: 1,
      demandMin: 1,
      unitPriceMin: 50,
      unitPriceMax: 60,
      supplyMin: 3,
      supplyMax: 5,
      sectorName: SectorName.MATERIALS,
    },
  ],
  companies: [
    {
      id: '1',
      name: 'Cyco Corp',
      stockSymbol: 'CYCO',
      unitPrice: 10.0,
      throughput: 10,
      sectorId: '1',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '2',
      name: 'FunTimes Inc.',
      stockSymbol: 'FUN',
      unitPrice: 12.0,
      throughput: 12,
      sectorId: '1',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '3',
      name: 'Happy Goods Ltd.',
      stockSymbol: 'HAPPY',
      unitPrice: 11.0,
      throughput: 11,
      sectorId: '1',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '4',
      name: 'Leisure Co.',
      stockSymbol: 'LEIS',
      unitPrice: 9.0,
      throughput: 9,
      sectorId: '1',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '5',
      name: 'Joyful Enterprises',
      stockSymbol: 'JOY',
      unitPrice: 13.0,
      throughput: 13,
      sectorId: '1',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '6',
      name: 'Steady Supply Co.',
      stockSymbol: 'STEADY',
      unitPrice: 14.0,
      throughput: 14,
      sectorId: '2',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '7',
      name: 'Defendable Goods',
      stockSymbol: 'DEFEND',
      unitPrice: 15.0,
      throughput: 15,
      sectorId: '2',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '8',
      name: 'SafeBuy Ltd.',
      stockSymbol: 'SAFE',
      unitPrice: 16.0,
      throughput: 16,
      sectorId: '2',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '9',
      name: 'HomeGoods Co.',
      stockSymbol: 'HOME',
      unitPrice: 17.0,
      throughput: 17,
      sectorId: '2',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '10',
      name: 'Essential Supplies Inc.',
      stockSymbol: 'ESSENT',
      unitPrice: 18.0,
      throughput: 18,
      sectorId: '2',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '11',
      name: 'Heavy Industries Ltd.',
      stockSymbol: 'HEAVY',
      unitPrice: 19.0,
      throughput: 19,
      sectorId: '3',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '12',
      name: 'Machinery Inc.',
      stockSymbol: 'MACH',
      unitPrice: 20.0,
      throughput: 20,
      sectorId: '3',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '13',
      name: 'Industrial Solutions Co.',
      stockSymbol: 'INDSOL',
      unitPrice: 21.0,
      throughput: 21,
      sectorId: '3',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '14',
      name: 'SteelWorks Ltd.',
      stockSymbol: 'STEEL',
      unitPrice: 22.0,
      throughput: 22,
      sectorId: '3',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '15',
      name: 'Industrial Giants Inc.',
      stockSymbol: 'GIANT',
      unitPrice: 23.0,
      throughput: 23,
      sectorId: '3',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '16',
      name: 'Tech Innovations Ltd.',
      stockSymbol: 'TECH',
      unitPrice: 24.0,
      throughput: 24,
      sectorId: '4',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.INCUBATOR,
    },
    {
      id: '17',
      name: 'FutureTech Inc.',
      stockSymbol: 'FUTURE',
      unitPrice: 25.0,
      throughput: 25,
      sectorId: '4',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.INCUBATOR,
    },
    {
      id: '18',
      name: 'Digital Solutions Co.',
      stockSymbol: 'DIGITAL',
      unitPrice: 26.0,
      throughput: 26,
      sectorId: '4',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.INCUBATOR,
    },
    {
      id: '19',
      name: 'HighTech Ltd.',
      stockSymbol: 'HITECH',
      unitPrice: 27.0,
      throughput: 27,
      sectorId: '4',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.INCUBATOR,
    },
    {
      id: '20',
      name: 'Tech Titans Inc.',
      stockSymbol: 'TITAN',
      unitPrice: 28.0,
      throughput: 28,
      sectorId: '4',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.INCUBATOR,
    },
    {
      id: '21',
      name: 'HealthFirst Co.',
      stockSymbol: 'HEALTH',
      unitPrice: 29.0,
      throughput: 29,
      sectorId: '5',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '22',
      name: 'MediCare Ltd.',
      stockSymbol: 'MED',
      unitPrice: 30.0,
      throughput: 30,
      sectorId: '5',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '23',
      name: 'Wellness Inc.',
      stockSymbol: 'WELL',
      unitPrice: 31.0,
      throughput: 31,
      sectorId: '5',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '24',
      name: 'PharmaTech Co.',
      stockSymbol: 'PHARMA',
      unitPrice: 32.0,
      throughput: 32,
      sectorId: '5',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '25',
      name: 'BioHealth Inc.',
      stockSymbol: 'BIO',
      unitPrice: 33.0,
      throughput: 33,
      sectorId: '5',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.STARTUP,
    },
    {
      id: '26',
      name: 'Green Energy Ltd.',
      stockSymbol: 'GREEN',
      unitPrice: 34.0,
      throughput: 34,
      sectorId: '6',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '27',
      name: 'PowerPlus Inc.',
      stockSymbol: 'POWER',
      unitPrice: 35.0,
      throughput: 35,
      sectorId: '6',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '28',
      name: 'EcoEnergy Co.',
      stockSymbol: 'ECO',
      unitPrice: 36.0,
      throughput: 36,
      sectorId: '6',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '29',
      name: 'SolarWave Ltd.',
      stockSymbol: 'SOLAR',
      unitPrice: 37.0,
      throughput: 37,
      sectorId: '6',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '30',
      name: 'Energy Innovations Inc.',
      stockSymbol: 'ENERGY',
      unitPrice: 38.0,
      throughput: 38,
      sectorId: '6',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.ESTABLISHED,
    },
    {
      id: '31',
      name: 'Material Pros Ltd.',
      stockSymbol: 'MATER',
      unitPrice: 39.0,
      throughput: 39,
      sectorId: '7',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '32',
      name: 'RawGoods Inc.',
      stockSymbol: 'RAW',
      unitPrice: 40.0,
      throughput: 40,
      sectorId: '7',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '33',
      name: 'Resourceful Co.',
      stockSymbol: 'RESFUL',
      unitPrice: 41.0,
      throughput: 41,
      sectorId: '7',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '34',
      name: 'Building Blocks Ltd.',
      stockSymbol: 'BLOCKS',
      unitPrice: 42.0,
      throughput: 42,
      sectorId: '7',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
    {
      id: '35',
      name: 'Material Masters Inc.',
      stockSymbol: 'MASTER',
      unitPrice: 43.0,
      throughput: 43,
      sectorId: '7',
      gameId: '1',
      insolvent: false,
      mergedWithParent: null,
      companyTier: CompanyTier.GROWTH,
    },
  ],
  researchDeck: [
    {
      id: 1,
      gameId: '1',
      cards: [
        {
          name: 'Innovation Surge',
          description: "Boosts all companies' throughput by 10% for 3 turns",
          effect: { type: 'boost', target: 'all', value: 0.1, duration: 3 },
        },
      ],
    },
    {
      id: 2,
      gameId: '1',
      cards: [
        {
          name: 'Market Boom',
          description: 'Increases market demand by 20%',
          effect: { type: 'market', target: 'demand', value: 0.2 },
        },
      ],
    },
    {
      id: 3,
      gameId: '1',
      cards: [
        {
          name: 'Efficiency Upgrade',
          description: 'Reduces production costs by 15% for selected company',
          effect: { type: 'cost', target: 'company', value: -0.15 },
        },
      ],
    },
    {
      id: 4,
      gameId: '1',
      cards: [
        {
          name: 'Research Grant',
          description: "Adds $500k to company's cash on hand",
          effect: { type: 'cash', target: 'company', value: 500000 },
        },
      ],
    },
    {
      id: 5,
      gameId: '1',
      cards: [
        {
          name: 'Consumer Trend',
          description: 'Increases demand for consumer goods by 25%',
          effect: { type: 'demand', target: 'consumer', value: 0.25 },
        },
      ],
    },
    {
      id: 6,
      gameId: '1',
      cards: [
        {
          name: 'Technological Breakthrough',
          description: 'Doubles throughput for tech companies',
          effect: { type: 'throughput', target: 'tech', value: 2.0 },
        },
      ],
    },
    {
      id: 7,
      gameId: '1',
      cards: [
        {
          name: 'Healthcare Advancement',
          description: 'Reduces healthcare costs by 20%',
          effect: { type: 'cost', target: 'healthcare', value: -0.2 },
        },
      ],
    },
    {
      id: 8,
      gameId: '1',
      cards: [
        {
          name: 'Energy Efficiency',
          description: 'Reduces energy consumption by 10%',
          effect: { type: 'efficiency', target: 'energy', value: 0.1 },
        },
      ],
    },
    {
      id: 9,
      gameId: '1',
      cards: [
        {
          name: 'Material Innovation',
          description: 'Increases supply for materials by 30%',
          effect: { type: 'supply', target: 'materials', value: 0.3 },
        },
      ],
    },
    {
      id: 10,
      gameId: '1',
      cards: [
        {
          name: 'Industrial Growth',
          description: 'Boosts industrial production by 15%',
          effect: { type: 'production', target: 'industrial', value: 0.15 },
        },
      ],
    },
    {
      id: 11,
      gameId: '1',
      cards: [
        {
          name: 'Consumer Confidence',
          description: 'Increases consumer spending by 10%',
          effect: { type: 'spending', target: 'consumer', value: 0.1 },
        },
      ],
    },
    {
      id: 12,
      gameId: '1',
      cards: [
        {
          name: 'Defensive Strategy',
          description:
            'Decreases marketing costs for defensive companies by 10%',
          effect: { type: 'marketing', target: 'defensive', value: -0.1 },
        },
      ],
    },
    {
      id: 13,
      gameId: '1',
      cards: [
        {
          name: 'Infrastructure Upgrade',
          description: 'Increases production capacity by 20%',
          effect: { type: 'capacity', target: 'all', value: 0.2 },
        },
      ],
    },
    {
      id: 14,
      gameId: '1',
      cards: [
        {
          name: 'Market Expansion',
          description: 'Opens new markets, increasing demand by 15%',
          effect: { type: 'demand', target: 'all', value: 0.15 },
        },
      ],
    },
    {
      id: 15,
      gameId: '1',
      cards: [
        {
          name: 'Government Contract',
          description: 'Provides $1M to selected company',
          effect: { type: 'cash', target: 'company', value: 1000000 },
        },
      ],
    },
    {
      id: 16,
      gameId: '1',
      cards: [
        {
          name: 'Breakthrough Technology',
          description: 'Triples tech sector productivity',
          effect: { type: 'productivity', target: 'tech', value: 3.0 },
        },
      ],
    },
    {
      id: 17,
      gameId: '1',
      cards: [
        {
          name: 'Energy Subsidy',
          description: 'Reduces energy sector costs by 20%',
          effect: { type: 'cost', target: 'energy', value: -0.2 },
        },
      ],
    },
    {
      id: 18,
      gameId: '1',
      cards: [
        {
          name: 'Healthcare Funding',
          description: 'Adds $750k to healthcare companies',
          effect: { type: 'cash', target: 'healthcare', value: 750000 },
        },
      ],
    },
    {
      id: 19,
      gameId: '1',
      cards: [
        {
          name: 'Raw Material Surge',
          description: 'Increases material supply by 25%',
          effect: { type: 'supply', target: 'materials', value: 0.25 },
        },
      ],
    },
    {
      id: 20,
      gameId: '1',
      cards: [
        {
          name: 'Production Efficiency',
          description: 'Increases throughput by 20%',
          effect: { type: 'throughput', target: 'all', value: 0.2 },
        },
      ],
    },
  ],
};

//make a single company of each sector
export const tierTwoCompanies = [
  {
    id: '2',
    name: 'FunTimes Inc.',
    stockSymbol: 'FUN',
    unitPrice: 15.0,
    throughput: 12,
    sectorId: '1',
    gameId: '1',
    insolvent: false,
    mergedWithParent: null,
    companyTier: CompanyTier.ENTERPRISE,
  },
  {
    id: '6',
    name: 'Steady Supply Co.',
    stockSymbol: 'STEADY',
    unitPrice: 20.0,
    throughput: 14,
    sectorId: '2',
    gameId: '1',
    insolvent: false,
    mergedWithParent: null,
    companyTier: CompanyTier.GROWTH,
  },
  {
    id: '11',
    name: 'Heavy Industries Ltd.',
    stockSymbol: 'HEAVY',
    unitPrice: 20.0,
    throughput: 19,
    sectorId: '3',
    gameId: '1',
    insolvent: false,
    mergedWithParent: null,
    companyTier: CompanyTier.ESTABLISHED,
  },
  {
    id: '16',
    name: 'Tech Innovations Ltd.',
    stockSymbol: 'TECH',
    unitPrice: 30.0,
    throughput: 24,
    sectorId: '4',
    gameId: '1',
    insolvent: false,
    mergedWithParent: null,
    companyTier: CompanyTier.STARTUP,
  },
  {
    id: '21',
    name: 'HealthFirst Co.',
    stockSymbol: 'HEALTH',
    unitPrice: 30.0,
    throughput: 29,
    sectorId: '5',
    gameId: '1',
    insolvent: false,
    mergedWithParent: null,
    companyTier: CompanyTier.GROWTH,
  },
  {
    id: '26',
    name: 'Green Energy Ltd.',
    stockSymbol: 'GREEN',
    unitPrice: 50.0,
    throughput: 34,
    sectorId: '6',
    gameId: '1',
    insolvent: false,
    mergedWithParent: null,
    companyTier: CompanyTier.STARTUP,
  },
  {
    id: '31',
    name: 'Material Pros Ltd.',
    stockSymbol: 'MATER',
    unitPrice: 40.0,
    throughput: 39,
    sectorId: '7',
    gameId: '1',
    insolvent: false,
    mergedWithParent: null,
    companyTier: CompanyTier.ESTABLISHED,
  },
];

export const sectorColors: { [key: string]: string } = {
  'Consumer Cyclical': '#B28800',
  'Consumer Defensive': '#FF5733',
  Industrial: '#C70039',
  Technology: '#900C3F',
  Healthcare: '#581845',
  Energy: '#2C3E50',
  Materials: '#154360',
};

export const consumerCyclical = [
  { name: 'TesLoop Motors', symbol: 'TLM' },
  { name: 'ToyAuto', symbol: 'TA' },
  { name: 'Forge Motors', symbol: 'FGM' },
  { name: 'Jungle Books', symbol: 'JUB' },
  { name: 'AliBuy', symbol: 'ALB' },
  { name: "McDougall's", symbol: 'MCD' },
  { name: 'Chimichotle', symbol: 'CML' },
  { name: 'StarBrews', symbol: 'SBW' },
  { name: "Domino's Pizzeria", symbol: 'DMP' },
  { name: 'HomePalace', symbol: 'HMP' },
  { name: 'Hilman Hotels', symbol: 'HH' },
  { name: 'Marriott Inn', symbol: 'MIT' },
  { name: 'LuLuActive', symbol: 'LLA' },
  { name: 'The Void Clothing', symbol: 'TVC' },
  { name: 'Nikey Footwear', symbol: 'NKF' },
  { name: 'AdiSport', symbol: 'ADS' },
];

export const consumerDefensive = [
  { name: 'WallMarket', symbol: 'WALL' },
  { name: 'Bullseye', symbol: 'BSE' },
  { name: 'BulkCo', symbol: 'BUL' }, 
  { name: 'Gamble & Prosper', symbol: 'GB' },
  { name: 'ToothGuard', symbol: 'TG' },
  { name: 'RedCola', symbol: 'RCO' },
  { name: 'PeppyPop', symbol: 'PP' },
  { name: 'BrewKing', symbol: 'BREW' },
  { name: 'SunshineBrew', symbol: 'SUN' },
  { name: 'CerealGeneral', symbol: 'CG' },
  { name: 'NoodleCraft', symbol: 'CRAFT' },
  { name: 'Dollar Central', symbol: 'DC' },
  { name: 'Maltson', symbol: 'MAL' },
  { name: 'ChocoHers', symbol: 'CH' },
  { name: 'GrocerCo', symbol: 'GC' },
  { name: 'SafeMarkets', symbol: 'SM' },
  { name: 'Jenny & Jennie', symbol: 'JJ' },
  { name: 'Dr. Poppins', symbol: 'DP' },
  { name: 'BlueBison', symbol: 'BBON' },
  { name: 'NestRoast', symbol: 'NR' },
];

export const industrial = [
  { name: 'MegaBuild Corp.', symbol: 'MBC' },
  { name: 'TitanMach Industries', symbol: 'TMI' },
  { name: 'HeavyLift Solutions', symbol: 'HLS' },
  { name: 'SteelWorks Manufacturing', symbol: 'SWM' },
  { name: 'PowerPlant Engineering', symbol: 'PPE' },
  { name: 'Industrious Innovators', symbol: 'II' },
  { name: 'ForgeTech', symbol: 'FT' },
  { name: 'BuildMaster Co.', symbol: 'BMC' },
  { name: 'IronHaven Construction', symbol: 'IHC' },
  { name: 'PrecisionForge Industries', symbol: 'PFI' },
  { name: 'MightyConstruct', symbol: 'MC' },
  { name: 'PrimeMach', symbol: 'PM' },
  { name: 'SolidSteel Corp.', symbol: 'SSC' },
  { name: 'UltraForge', symbol: 'UF' },
  { name: 'MegaWorks', symbol: 'MW' },
  { name: 'Titanic Industries', symbol: 'TI' },
  { name: 'IronBuilt', symbol: 'IB' },
  { name: 'HeavyDuty Co.', symbol: 'HDC' },
  { name: 'SteelMakers', symbol: 'SM' },
  { name: 'BuildTech', symbol: 'BT' },
];

export const technology = [
  { name: 'Searchly', symbol: 'SRH' },
  { name: 'Mango', symbol: 'MANG' },
  { name: 'SoftWorks', symbol: 'SWK' },
  { name: 'GraphiXcore', symbol: 'GXC' },
  { name: 'RideByte', symbol: 'RBT' },
  { name: 'StreamFlix', symbol: 'SFX' },
  { name: 'TeleWave Networks', symbol: 'TWN' },
  { name: 'DashDeliver', symbol: 'DDV' },
  { name: 'GameTendo', symbol: 'GTD' },
  { name: 'ChipFusion', symbol: 'CFN' },
  { name: 'ShopMaster', symbol: 'SMR' },
  { name: 'SocialBook', symbol: 'SBK' },
  { name: 'InstaFrame', symbol: 'IFM' },
  { name: 'ClipClap', symbol: 'CLP' },
  { name: 'DataSeer', symbol: 'DSR' },
  { name: 'NetConnect Systems', symbol: 'NCS' },
  { name: 'CoreMicro', symbol: 'CMI' },
  { name: 'MindNet', symbol: 'MNT' },
];

export const healthcare = [
  { name: 'HealthGuard Systems', symbol: 'HGS' },
  { name: 'Medivita Solutions', symbol: 'MS' },
  { name: 'WellnessTech', symbol: 'WT' },
  { name: 'PureCare Pharmaceuticals', symbol: 'PCP' },
  { name: 'LifePulse Diagnostics', symbol: 'LPD' },
  { name: 'SafeMed Innovations', symbol: 'SMI' },
  { name: 'BioGuard Labs', symbol: 'BGL' },
  { name: 'VitalCore Health', symbol: 'VCH' },
  { name: 'MediNexus', symbol: 'MN' },
  { name: 'HealthWave Biotech', symbol: 'HWB' },
  { name: 'LifeWell', symbol: 'LW' },
  { name: 'HealthNova', symbol: 'HN' },
  { name: 'MediSecure', symbol: 'MS' },
  { name: 'VitalTech', symbol: 'VT' },
  { name: 'BioLife Labs', symbol: 'BLL' },
  { name: 'HealthFusion', symbol: 'HF' },
  { name: 'SafeGuard Pharma', symbol: 'SGP' },
  { name: 'WellCare Systems', symbol: 'WCS' },
  { name: 'MediWave', symbol: 'MW' },
  { name: 'VitalInnovations', symbol: 'VI' },
];

export const energy = [
  { name: 'EcoPower Solutions', symbol: 'EPS' },
  { name: 'GreenWave Energy', symbol: 'GWE' },
  { name: 'SolarRise Corp.', symbol: 'SRC' },
  { name: 'EnerGen Technologies', symbol: 'EGT' },
  { name: 'PureEnergy Systems', symbol: 'PES' },
  { name: 'WindFusion', symbol: 'WF' },
  { name: 'HydroNova', symbol: 'HN' },
  { name: 'RenewPower', symbol: 'RP' },
  { name: 'EnergyMasters', symbol: 'EM' },
  { name: 'CleanTech Energy', symbol: 'CTE' },
  { name: 'PowerGrid Solutions', symbol: 'PGS' },
  { name: 'FutureEnergy', symbol: 'FE' },
  { name: 'EcoFusion Power', symbol: 'EFP' },
  { name: 'SolarTech', symbol: 'ST' },
  { name: 'EnergyInnovators', symbol: 'EI' },
  { name: 'NextGen Energy', symbol: 'NGE' },
  { name: 'RenewalPower', symbol: 'RP' },
  { name: 'SustainableEnergy Co.', symbol: 'SEC' },
  { name: 'GreenTech Systems', symbol: 'GTS' },
  { name: 'EcoVolt Energy', symbol: 'EVE' },
];

export const materials = [
  { name: 'PureMaterials Corp.', symbol: 'PMC' },
  { name: 'EcoBlend Solutions', symbol: 'EBS' },
  { name: 'Prime Minerals', symbol: 'PM' },
  { name: 'PolyTech Industries', symbol: 'PTI' },
  { name: 'MetalWorks Co.', symbol: 'MWC' },
  { name: 'ComposiTech', symbol: 'CT' },
  { name: 'BioMaterials Inc.', symbol: 'BMI' },
  { name: 'SteelFusion', symbol: 'SF' },
  { name: 'Nano Materials', symbol: 'NM' },
  { name: 'GreenComposites', symbol: 'GC' },
  { name: 'AlloyMaster', symbol: 'AM' },
  { name: 'PureMetals', symbol: 'PM' },
  { name: 'AdvancedPolymers', symbol: 'AP' },
  { name: 'EcoAlloys', symbol: 'EA' },
  { name: 'Mineral Innovations', symbol: 'MI' },
  { name: 'Sustainable Materials', symbol: 'SM' },
  { name: 'NextGen Composites', symbol: 'NGC' },
  { name: 'MaterialMasters', symbol: 'MM' },
  { name: 'FusionMaterials', symbol: 'FM' },
  { name: 'ElementTech', symbol: 'ET' },
];
