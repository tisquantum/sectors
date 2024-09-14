import { z } from 'zod';
import { UsersService } from '@server/users/users.service';
import { TrpcService } from '../trpc.service';
import { USER_NAME_MAX_LENGTH } from '@server/data/constants';
import { TRPCError } from '@trpc/server';

type Context = {
  userService: UsersService;
};

export default (trpc: TrpcService, ctx: Context) =>
  trpc.router({
    getUser: trpc.procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { id } = input;
        console.log('getUser id', id);
        const user = await ctx.userService.user({ id });
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      }),

    listUsers: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.userService.users({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
    updateUserName: trpc.procedure
      .input(z.object({ id: z.string(), name: z.string() }))
      .mutation(async ({ input }) => {
        const { id, name } = input;
        //return early if over max character limit
        if (name.length > USER_NAME_MAX_LENGTH) {
          throw new TRPCError({
            code: `INTERNAL_SERVER_ERROR`,
            message: `Name must be less than or equal to ${USER_NAME_MAX_LENGTH} characters.`,
          });
        }
        try {
          return ctx.userService.updateUser({
            where: {
              id,
            },
            data: {
              name,
            },
          });
        } catch (error) {
          throw new TRPCError({
            code: `INTERNAL_SERVER_ERROR`,
            message: `An error occured while updating the user name: ${error}`,
          });
        }
      }),
    listUsersRestricted: trpc.procedure
      .input(
        z.object({
          skip: z.number().optional(),
          take: z.number().optional(),
          cursor: z.string().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      )
      .query(async ({ input }) => {
        const { skip, take, cursor, where, orderBy } = input;
        return ctx.userService.listUsersRestricted({
          skip,
          take,
          cursor: cursor ? { id: cursor } : undefined,
          where,
          orderBy,
        });
      }),
  });
