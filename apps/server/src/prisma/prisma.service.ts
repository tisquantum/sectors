import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // TODO: Probably remove this, the logging we're looking for is clientside so we don't really want this approach, it needs to be more discrete and only show messages the user will understand and not expose "hidden" data.
    // Add middleware for logging CRUD operations
    // this.$extends({
    //   query: {
    //     $allModels: {
    //       async create({ model, operation, args, query }) {
    //         // Execute the query
    //         const result = await query(args);
    //         const gameId = args.data?.gameId || args.where?.gameId;
    //         if (gameId) {
    //           await this.gameLog.create({
    //             data: {
    //               gameId,
    //               content: `${model} - ${operation}`,
    //             },
    //           });
    //         }
    //         return result;
    //       },
    //       async update({ model, operation, args, query }) {
    //         // Execute the query
    //         const result = await query(args);
    //         const gameId = args.data?.gameId || args.where?.gameId;
    //         if (gameId) {
    //           await this.gameLog.create({
    //             data: {
    //               gameId,
    //               content: `${model} - ${operation}`,
    //             },
    //           });
    //         }

    //         return result;
    //       },
    //       async delete({ model, operation, args, query }) {
    //         // Execute the query
    //         const result = await query(args);
    //         const gameId = args.data?.gameId || args.where?.gameId;
    //         if (gameId) {
    //           await this.gameLog.create({
    //             data: {
    //               gameId,
    //               content: `${model} - ${operation}`,
    //             },
    //           });
    //         }

    //         return result;
    //       },
    //     },
    //   },
    // });
  }

  //TODO: Add a middleware here inside prisma query for all crud operations
}
