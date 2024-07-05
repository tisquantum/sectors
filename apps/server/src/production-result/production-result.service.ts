import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, ProductionResult } from '@prisma/client';

@Injectable()
export class ProductionResultService {
  constructor(private prisma: PrismaService) {}

  async productionResult(
    productionResultWhereUniqueInput: Prisma.ProductionResultWhereUniqueInput,
  ): Promise<ProductionResult | null> {
    return this.prisma.productionResult.findUnique({
      where: productionResultWhereUniqueInput,
    });
  }

  async productionResults(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProductionResultWhereUniqueInput;
    where?: Prisma.ProductionResultWhereInput;
    orderBy?: Prisma.ProductionResultOrderByWithRelationInput;
  }): Promise<ProductionResult[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.productionResult.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createProductionResult(data: Prisma.ProductionResultCreateInput): Promise<ProductionResult> {
    return this.prisma.productionResult.create({
      data,
    });
  }

  async createManyProductionResults(data: Prisma.ProductionResultCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.productionResult.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateProductionResult(params: {
    where: Prisma.ProductionResultWhereUniqueInput;
    data: Prisma.ProductionResultUpdateInput;
  }): Promise<ProductionResult> {
    const { where, data } = params;
    return this.prisma.productionResult.update({
      data,
      where,
    });
  }

  async updateManyProductionResults(params: {
    where: Prisma.ProductionResultWhereInput;
    data: Prisma.ProductionResultUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return this.prisma.productionResult.updateMany({
      data,
      where,
    });
  }

  async deleteProductionResult(where: Prisma.ProductionResultWhereUniqueInput): Promise<ProductionResult> {
    return this.prisma.productionResult.delete({
      where,
    });
  }
}
