'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { FactorySlots } from './FactorySlots';
import { MarketingSlots } from './MarketingSlots';

interface CompanyTableauProps {
  companyId: string;
  gameId: string;
  currentPhase: number;
}

export function CompanyTableau({ companyId, gameId, currentPhase }: CompanyTableauProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Company Tableau</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="factories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="factories">Factories</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>
          <TabsContent value="factories">
            <FactorySlots 
              companyId={companyId}
              gameId={gameId}
              currentPhase={currentPhase}
            />
          </TabsContent>
          <TabsContent value="marketing">
            <MarketingSlots
              companyId={companyId}
              gameId={gameId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 