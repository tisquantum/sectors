import { z } from 'zod';
import { ConsumptionMarkerService } from '../../consumption-marker/consumption-marker.service';
import { TrpcService } from '../trpc.service';
import { ResourceType } from '@prisma/client';

type Context = {
  consumptionMarkerService: ConsumptionMarkerService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getSectorConsumptionBag: trpc.procedure
      .input(z.object({
        sectorId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.consumptionMarkerService.getSectorConsumptionBag(
          input.sectorId,
          input.gameId
        );
      }),

    getAllConsumptionBags: trpc.procedure
      .input(z.object({
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        return ctx.consumptionMarkerService.getAllConsumptionBags(input.gameId);
      }),

    getConsumptionBagSummary: trpc.procedure
      .input(z.object({
        sectorId: z.string(),
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        const markers = await ctx.consumptionMarkerService.getSectorConsumptionBag(
          input.sectorId,
          input.gameId
        );
        
        // Group by resource type and permanence
        const summary = markers.reduce((acc, marker) => {
          const key = `${marker.resourceType}_${marker.isPermanent ? 'permanent' : 'temporary'}`;
          if (!acc[key]) {
            acc[key] = {
              resourceType: marker.resourceType,
              isPermanent: marker.isPermanent,
              count: 0,
            };
          }
          acc[key].count++;
          return acc;
        }, {} as Record<string, { resourceType: ResourceType; isPermanent: boolean; count: number }>);

        return Object.values(summary);
      }),
  });

