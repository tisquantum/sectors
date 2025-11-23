'use client';

import { Card } from '@/components/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { BuildActions } from './BuildActions';
import { ResearchActions } from './ResearchActions';
import { OperationMechanicsVersion } from '@server/prisma/prisma.client';

interface CompanyActionsProps {
  companyId: string;
  gameId: string;
  phase: number;
  availableWorkers: number;
  availableCash: number;
  availablePrestige: number;
  operationMechanicsVersion: OperationMechanicsVersion;
  sectorName: string;
  onActionComplete?: () => void;
}

export function CompanyActions({
  companyId,
  gameId,
  phase,
  availableWorkers,
  availableCash,
  availablePrestige,
  operationMechanicsVersion,
  sectorName,
  onActionComplete,
}: CompanyActionsProps) {
  return (
    <Card className="w-full p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Company Actions</h3>
        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
          <div>Available Workers: {availableWorkers}</div>
          <div>Available Cash: ${availableCash}</div>
          <div>Available Prestige: {availablePrestige}</div>
        </div>
      </div>

      <Tabs defaultValue="build" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sector">Sector</TabsTrigger>
        </TabsList>

        <TabsContent value="build">
          <BuildActions
            companyId={companyId}
            gameId={gameId}
            phase={phase}
            availableWorkers={availableWorkers}
            availableCash={availableCash}
            onActionComplete={onActionComplete}
          />
        </TabsContent>

        <TabsContent value="research">
          <ResearchActions
            companyId={companyId}
            gameId={gameId}
            phase={phase}
            availableWorkers={availableWorkers}
            availableCash={availableCash}
            onActionComplete={onActionComplete}
          />
        </TabsContent>

        <TabsContent value="marketing">
          <div>test</div>
        </TabsContent>

        <TabsContent value="general">
          <div>test</div>
        </TabsContent>

        <TabsContent value="sector">
          <div>test</div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 