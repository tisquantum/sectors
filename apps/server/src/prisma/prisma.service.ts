import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Add middleware for logging CRUD operations
    this.$extends({
      query: {
        $allModels: {
          async create({ model, operation, args, query }) {
            // Execute the query
            const result = await query(args);
            const gameId = args.data?.gameId || args.where?.gameId;
            if (gameId) {
              await this.gameLog.create({
                data: {
                  gameId,
                  content: `${model} - ${operation}`,
                },
              });
            }
            return result;
          },
          async update({ model, operation, args, query }) {
            // Execute the query
            const result = await query(args);
            const gameId = args.data?.gameId || args.where?.gameId;
            if (gameId) {
              await this.gameLog.create({
                data: {
                  gameId,
                  content: `${model} - ${operation}`,
                },
              });
            }

            return result;
          },
          async delete({ model, operation, args, query }) {
            // Execute the query
            const result = await query(args);
            const gameId = args.data?.gameId || args.where?.gameId;
            if (gameId) {
              await this.gameLog.create({
                data: {
                  gameId,
                  content: `${model} - ${operation}`,
                },
              });
            }

            return result;
          },
        },
      },
    });
  }

  //TODO: Add a middleware here inside prisma query for all crud operations
}
