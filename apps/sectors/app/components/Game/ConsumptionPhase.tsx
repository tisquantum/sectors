'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { ConsumerFlowPerSector } from './ConsumptionPhase/ConsumerFlowPerSector';
import { CompanyPerformance } from './ConsumptionPhase/CompanyPerformance';
import { ConsumerFlowLog } from './ConsumptionPhase/ConsumerFlowLog';

// Dummy data for demonstration
const dummySectors = [
  {
    id: '1',
    name: 'Technology',
    consumerProfiles: [
      {
        factorySize: 'FACTORY_I',
        resources: ['TRIANGLE', 'SQUARE', 'CIRCLE'],
        consumerCount: 5
      },
      {
        factorySize: 'FACTORY_II', 
        resources: ['TRIANGLE', 'SQUARE', 'CIRCLE', 'STAR'],
        consumerCount: 3
      },
      {
        factorySize: 'FACTORY_III',
        resources: ['TRIANGLE', 'SQUARE', 'CIRCLE', 'STAR', 'MATERIALS'],
        consumerCount: 2
      },
      {
        factorySize: 'FACTORY_I',
        resources: ['WILDCARD', 'TECHNOLOGY'],
        consumerCount: 3
      },
      {
        factorySize: 'FACTORY_II',
        resources: ['WILDCARD', 'WILDCARD', 'ENERGY'],
        consumerCount: 2
      }
    ]
  },
  {
    id: '2',
    name: 'Healthcare',
    consumerProfiles: [
      {
        factorySize: 'FACTORY_I',
        resources: ['HEALTHCARE', 'TECHNOLOGY'],
        consumerCount: 4
      },
      {
        factorySize: 'FACTORY_II',
        resources: ['HEALTHCARE', 'TECHNOLOGY', 'ENERGY'],
        consumerCount: 3
      },
      {
        factorySize: 'FACTORY_I',
        resources: ['WILDCARD', 'HEALTHCARE'],
        consumerCount: 2
      }
    ]
  }
];

const dummyCompanies = [
  {
    id: '1',
    name: 'TechCorp',
    brandScore: 85,
    sector: 'Technology',
    factories: [
      {
        id: 'f1',
        size: 'FACTORY_I',
        resources: ['TRIANGLE', 'SQUARE', 'CIRCLE'],
        consumersReceived: 3,
        maxConsumers: 5,
        profit: 150
      },
      {
        id: 'f2',
        size: 'FACTORY_II',
        resources: ['TRIANGLE', 'SQUARE', 'CIRCLE', 'STAR'],
        consumersReceived: 2,
        maxConsumers: 3,
        profit: 200
      },
      {
        id: 'f3',
        size: 'FACTORY_I',
        resources: ['WILDCARD', 'TECHNOLOGY'],
        consumersReceived: 2,
        maxConsumers: 3,
        profit: 120
      }
    ]
  },
  {
    id: '2',
    name: 'HealthTech',
    brandScore: 92,
    sector: 'Healthcare',
    factories: [
      {
        id: 'f4',
        size: 'FACTORY_I',
        resources: ['HEALTHCARE', 'TECHNOLOGY'],
        consumersReceived: 4,
        maxConsumers: 4,
        profit: 180
      },
      {
        id: 'f5',
        size: 'FACTORY_II',
        resources: ['WILDCARD', 'WILDCARD', 'ENERGY'],
        consumersReceived: 1,
        maxConsumers: 2,
        profit: 250
      }
    ]
  },
  {
    id: '3',
    name: 'FlexiTech',
    brandScore: 78,
    sector: 'Technology',
    factories: [
      {
        id: 'f6',
        size: 'FACTORY_I',
        resources: ['WILDCARD', 'HEALTHCARE'],
        consumersReceived: 2,
        maxConsumers: 2,
        profit: 100
      }
    ]
  }
];

const dummyFlowLog = [
  {
    id: '1',
    consumerProfile: 'FACTORY_I - [TRIANGLE, SQUARE, CIRCLE]',
    destination: 'TechCorp Factory I',
    reason: 'Exact match, highest brand score (85)',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    consumerProfile: 'FACTORY_I - [HEALTHCARE, TECHNOLOGY]',
    destination: 'HealthTech Factory I',
    reason: 'Exact match, only option',
    timestamp: '2024-01-15T10:31:00Z'
  },
  {
    id: '3',
    consumerProfile: 'FACTORY_II - [TRIANGLE, SQUARE, CIRCLE, STAR]',
    destination: 'TechCorp Factory II',
    reason: 'Exact match, only option',
    timestamp: '2024-01-15T10:32:00Z'
  },
  {
    id: '4',
    consumerProfile: 'FACTORY_I - [WILDCARD, TECHNOLOGY]',
    destination: 'TechCorp Factory I (Wildcard)',
    reason: 'Wildcard match, highest brand score (85)',
    timestamp: '2024-01-15T10:33:00Z'
  },
  {
    id: '5',
    consumerProfile: 'FACTORY_II - [WILDCARD, WILDCARD, ENERGY]',
    destination: 'HealthTech Factory II',
    reason: 'Wildcard match, only option',
    timestamp: '2024-01-15T10:34:00Z'
  },
  {
    id: '6',
    consumerProfile: 'FACTORY_I - [WILDCARD, HEALTHCARE]',
    destination: 'FlexiTech Factory I',
    reason: 'Wildcard match, only option',
    timestamp: '2024-01-15T10:35:00Z'
  }
];

export function ConsumptionPhase() {
  const [activeTab, setActiveTab] = useState('flow');

  return (
    <div className="w-full h-full p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Consumption Phase</h1>
        <p className="text-gray-400">
          Consumer flow distribution based on factory schematics and brand scores
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flow">Consumer Flow</TabsTrigger>
          <TabsTrigger value="performance">Company Performance</TabsTrigger>
          <TabsTrigger value="log">Flow Log</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-4">
          <ConsumerFlowPerSector 
            sectors={dummySectors}
            companies={dummyCompanies}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <CompanyPerformance companies={dummyCompanies} />
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <ConsumerFlowLog flowLog={dummyFlowLog} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 