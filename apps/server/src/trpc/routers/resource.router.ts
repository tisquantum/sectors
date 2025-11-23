import { z } from 'zod';
import { ResourceService } from '../../resource/resource.service';
import { TrpcService } from '../trpc.service';
import { ResourceType, Resource } from '@prisma/client';

type Context = {
  resourceService: ResourceService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getGameResources: trpc.procedure
      .input(z.object({
        gameId: z.string().min(1, { message: 'gameId is required and must be a non-empty string' }),
      }).refine((data) => data.gameId && typeof data.gameId === 'string' && data.gameId.length > 0, {
        message: 'gameId must be a valid non-empty string',
        path: ['gameId'],
      }))
      .query(async ({ input }) => {
        // Additional defensive check
        if (!input.gameId || typeof input.gameId !== 'string' || input.gameId.trim().length === 0) {
          throw new Error('Invalid gameId: must be a valid non-empty string');
        }
        return ctx.resourceService.getGameResources(input.gameId);
      }),

    getResourceByType: trpc.procedure
      .input(z.object({
        gameId: z.string(),
        type: z.nativeEnum(ResourceType),
      }))
      .query(async ({ input }) => {
        return ctx.resourceService.getResourceByType(input.gameId, input.type);
      }),

    getResourcePrice: trpc.procedure
      .input(z.object({
        gameId: z.string(),
        type: z.nativeEnum(ResourceType),
      }))
      .query(async ({ input }) => {
        const resource = await ctx.resourceService.getResourceByType(
          input.gameId,
          input.type
        );
        if (!resource) {
          throw new Error('Resource not found');
        }
        return ctx.resourceService.getCurrentResourcePrice(resource);
      }),

    getAllResourcePrices: trpc.procedure
      .input(z.object({
        gameId: z.string(),
      }))
      .query(async ({ input }) => {
        const resources = await ctx.resourceService.getGameResources(input.gameId);
        return Promise.all(
          resources.map(async (resource: Resource) => ({
            type: resource.type,
            trackPosition: resource.trackPosition,
            price: await ctx.resourceService.getCurrentResourcePrice(resource),
          }))
        );
      }),
  });

