import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  Entity,
  EntityType,
  Prisma,
  Transaction,
  TransactionType,
} from '@prisma/client';
import { TransactionWithEntities } from '@server/prisma/prisma.types';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async getTransaction(
    transactionWhereUniqueInput: Prisma.TransactionWhereUniqueInput,
  ): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: transactionWhereUniqueInput,
    });
  }

  async listTransactions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TransactionWhereUniqueInput;
    where?: Prisma.TransactionWhereInput;
    orderBy?: Prisma.TransactionOrderByWithRelationInput;
  }): Promise<TransactionWithEntities[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.transaction.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        fromEntity: {
          include: {
            Player: true,
            Company: true,
          },
        },
        toEntity: {
          include: {
            Player: true,
            Company: true,
          },
        },
      },
    });
  }

  async createTransaction(
    data: Prisma.TransactionCreateInput,
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data,
    });
  }

  async getEntityOrCreate(
    gameId: string,
    entityType: EntityType,
    entityId?: string,
  ): Promise<Entity> {
    let entity = await this.prisma.entity.findFirst({
      where: { entityType, gameId: gameId },
    });

    if (!entity) {
      switch (entityType) {
        case EntityType.BANK:
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
            },
          });
          break;
        case EntityType.PLAYER:
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
              Player: {
                connect: { id: entityId },
              },
            },
          });
          break;
        case EntityType.PLAYER_MARGIN_ACCOUNT:
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
              marginAccountId: entityId,
            },
          });
          break;
        case EntityType.COMPANY:
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
              Company: {
                connect: { id: entityId },
              },
            },
          });
          break;
        case EntityType.DERIVATIVE_MARKET:
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
            },
          });
          break;
        case EntityType.IPO:
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
            },
          });
          break;
        case EntityType.OPEN_MARKET:
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
            },
          });
          break;
        default:
          throw new Error('Invalid entity type');
      }
    }
    return entity;
  }

  async createTransactionEntityToEntity({
    gameId,
    fromEntityType,
    toEntityType,
    amount,
    transactionType,
    fromEntityId,
    toEntityId,
  }: {
    gameId: string;
    fromEntityType: EntityType;
    toEntityType: EntityType;
    amount: number;
    transactionType: TransactionType;
    fromEntityId?: string;
    toEntityId?: string;
  }): Promise<Transaction> {
    const fromEntity = await this.getEntityOrCreate(
      gameId,
      fromEntityType,
      fromEntityId,
    );

    if (!fromEntity) {
      throw new Error('Invalid from entity');
    }

    const toEntity = await this.getEntityOrCreate(
      gameId,
      toEntityType,
      toEntityId,
    );

    if (!toEntity) {
      throw new Error('Invalid to entity');
    }

    // Create the transaction
    return this.prisma.transaction.create({
      data: {
        gameId,
        fromEntityId: fromEntity.id,
        toEntityId: toEntity.id,
        transactionType,
        amount,
        timestamp: new Date(),
      },
    });
  }

  async createManyTransactions(
    data: Prisma.TransactionCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.transaction.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateTransaction(params: {
    where: Prisma.TransactionWhereUniqueInput;
    data: Prisma.TransactionUpdateInput;
  }): Promise<Transaction> {
    const { where, data } = params;
    return this.prisma.transaction.update({
      data,
      where,
    });
  }

  async deleteTransaction(
    where: Prisma.TransactionWhereUniqueInput,
  ): Promise<Transaction> {
    return this.prisma.transaction.delete({
      where,
    });
  }
}
