import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  Entity,
  EntityType,
  Prisma,
  Transaction,
  TransactionSubType,
  TransactionType,
} from '@prisma/client';
import { TransactionWithEntities } from '@server/prisma/prisma.types';
import { from } from 'rxjs';

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
        Shares: true,
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

  async getTransactionsForEntity(
    entityId: string,
    transactionType: TransactionType,
  ): Promise<TransactionWithEntities[]> {
    return this.prisma.transaction.findMany({
      where: {
        OR: [{ fromEntityId: entityId }, { toEntityId: entityId }],
        transactionType,
      },
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
        Shares: true,
      },
    });
  }

  async getTransactionsByEntityType(
    entityType: EntityType,
    gameId: string,
  ): Promise<TransactionWithEntities[]> {
    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { fromEntity: { entityType, gameId } },
          { toEntity: { entityType, gameId } },
        ],
      },
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
        Shares: {
          include: {
            Share: true,
          },
        },
      },
    });
  }

  async getEntityOrCreate(
    gameId: string,
    entityType: EntityType,
    entityId?: string,
    playerId?: string,
    companyId?: string,
  ): Promise<Entity> {
    console.log(
      'getEntityOrCreate',
      gameId,
      entityId,
      entityType,
      playerId,
      companyId,
    );
    let entity;
    if (
      (entityId && entityType === EntityType.PLAYER) ||
      (entityId && entityType === EntityType.COMPANY) ||
      (entityId && entityType === EntityType.PLAYER_MARGIN_ACCOUNT)
    ) {
      entity = await this.prisma.entity.findUnique({
        where: { id: entityId },
      });
    } else if (
      entityType == EntityType.BANK ||
      entityType == EntityType.DERIVATIVE_MARKET ||
      entityType == EntityType.IPO ||
      entityType == EntityType.OPEN_MARKET
    ) {
      entity = await this.prisma.entity.findFirst({
        where: { entityType, gameId: gameId },
      });
    }
    console.log('getEntityOrCreate', entity);
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
                connect: { id: playerId },
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
          console.log('creating company entity', companyId);
          entity = await this.prisma.entity.create({
            data: {
              entityType,
              gameId,
              Company: {
                connect: { id: companyId },
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
    gameTurnId,
    phaseId,
    fromEntityType,
    toEntityType,
    amount,
    fromEntityId,
    toEntityId,
    description,
    shares,
    transactionType,
    transactionSubType,
    companyInvolvedId,
    fromPlayerId,
    toPlayerId,
    fromCompanyId,
    toCompanyId,
  }: {
    gameId: string;
    gameTurnId: string;
    phaseId: string;
    fromEntityType: EntityType;
    toEntityType: EntityType;
    transactionType: TransactionType;
    transactionSubType?: TransactionSubType;
    amount: number;
    fromEntityId?: string;
    toEntityId?: string;
    description?: string;
    shares?: string[];
    companyInvolvedId?: string;
    fromPlayerId?: string;
    toPlayerId?: string;
    fromCompanyId?: string;
    toCompanyId?: string;
  }): Promise<Transaction> {
    const fromEntity = await this.getEntityOrCreate(
      gameId,
      fromEntityType,
      fromEntityId,
      fromPlayerId,
      fromCompanyId,
    );

    if (!fromEntity) {
      throw new Error('Invalid from entity');
    }

    const toEntity = await this.getEntityOrCreate(
      gameId,
      toEntityType,
      toEntityId,
      toPlayerId,
      toCompanyId,
    );

    if (!toEntity) {
      throw new Error('Invalid to entity');
    }
    // Create the transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        gameId,
        phaseId,
        gameTurnId,
        fromEntityId: fromEntity.id,
        toEntityId: toEntity.id,
        transactionType,
        transactionSubType: transactionSubType || TransactionSubType.DEFAULT,
        amount,
        timestamp: new Date(),
        description,
        companyInvolvedId: companyInvolvedId || null,
      },
    });
    // If the transaction is a share transfer, create the share transfers
    if (shares) {
      await this.prisma.transactionsOnShares.createMany({
        data: shares.map((share) => ({
          transactionId: transaction.id,
          shareId: share,
        })),
      });
    }
    return transaction;
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
  async collectTransactionData({
    gameId,
    gameTurnId,
    phaseId,
    fromEntityType,
    toEntityType,
    amount,
    fromEntityId,
    toEntityId,
    description,
    shares,
    transactionType,
    transactionSubType,
    fromPlayerId,
    toPlayerId,
    fromCompanyId,
    toCompanyId,
  }: {
    gameId: string;
    gameTurnId: string;
    phaseId: string;
    fromEntityType: EntityType;
    toEntityType: EntityType;
    transactionType: TransactionType;
    transactionSubType?: TransactionSubType;
    amount: number;
    fromEntityId?: string;
    toEntityId?: string;
    description?: string;
    shares?: string[];
    fromPlayerId?: string;
    toPlayerId?: string;
    fromCompanyId?: string;
    toCompanyId?: string;
  }): Promise<{
    gameId: string;
    phaseId: string;
    gameTurnId: string;
    fromEntityId: string;
    toEntityId: string;
    transactionType: TransactionType;
    transactionSubType: TransactionSubType;
    amount: number;
    description?: string;
    shares?: string[];
  }> {
    const fromEntity = await this.getEntityOrCreate(
      gameId,
      fromEntityType,
      fromEntityId,
      fromPlayerId,
      fromCompanyId,
    );

    if (!fromEntity) {
      throw new Error('Invalid from entity');
    }

    const toEntity = await this.getEntityOrCreate(
      gameId,
      toEntityType,
      toEntityId,
      toPlayerId,
      toCompanyId,
    );

    if (!toEntity) {
      throw new Error('Invalid to entity');
    }

    // Return the collected transaction data instead of creating it immediately
    return {
      gameId,
      phaseId,
      gameTurnId,
      fromEntityId: fromEntity.id,
      toEntityId: toEntity.id,
      transactionType,
      transactionSubType: transactionSubType || TransactionSubType.DEFAULT,
      amount,
      description,
      shares,
    };
  }
  async createManyTransactionsFromCollectedData(
    transactionsData: {
      gameId: string;
      phaseId: string;
      gameTurnId: string;
      fromEntityId: string;
      toEntityId: string;
      transactionType: TransactionType;
      transactionSubType: TransactionSubType;
      amount: number;
      description?: string;
      shares?: string[];
    }[],
  ) {
    // First, create all transactions in bulk
    const transactions = await this.prisma.transaction.createManyAndReturn({
      data: transactionsData.map((tx) => ({
        gameId: tx.gameId,
        phaseId: tx.phaseId,
        gameTurnId: tx.gameTurnId,
        fromEntityId: tx.fromEntityId,
        toEntityId: tx.toEntityId,
        transactionType: tx.transactionType,
        transactionSubType: tx.transactionSubType,
        amount: tx.amount,
        timestamp: new Date(),
        description: tx.description,
      })),
      skipDuplicates: true,
    });

    // Then, handle any associated share transfers in bulk
    const shareTransferData = transactionsData
      .filter((tx) => tx.shares && tx.shares.length > 0)
      .flatMap((tx, index) =>
        tx.shares!.map((shareId) => ({
          transactionId: transactions[index].id,
          shareId,
        })),
      );

    if (shareTransferData.length > 0) {
      await this.prisma.transactionsOnShares.createMany({
        data: shareTransferData,
      });
    }

    return transactions;
  }
}
