import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Prisma, OptionContract } from '@prisma/client';
import { OptionContractWithRelations } from '@server/prisma/prisma.types';

@Injectable()
export class OptionContractService {
  constructor(private prisma: PrismaService) {}

  async getOptionContract(
    optionContractWhereUniqueInput: Prisma.OptionContractWhereUniqueInput,
  ): Promise<OptionContractWithRelations | null> {
    return this.prisma.optionContract.findUnique({
      where: optionContractWhereUniqueInput,
      include: {
        PlayerOrders: true,
        Company: true,
      },
    });
  }

  async listOptionContracts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OptionContractWhereUniqueInput;
    where?: Prisma.OptionContractWhereInput;
    orderBy?: Prisma.OptionContractOrderByWithRelationInput;
  }): Promise<OptionContractWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.optionContract.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        Company: true,
        PlayerOrders: true,
      },
    });
  }

  async createOptionContract(
    data: Prisma.OptionContractCreateInput,
  ): Promise<OptionContract> {
    return this.prisma.optionContract.create({
      data,
    });
  }

  async createManyOptionContracts(
    data: Prisma.OptionContractCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.optionContract.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateOptionContract(params: {
    where: Prisma.OptionContractWhereUniqueInput;
    data: Prisma.OptionContractUpdateInput;
  }): Promise<OptionContract> {
    const { where, data } = params;
    return this.prisma.optionContract.update({
      data,
      where,
    });
  }

  async updateManyOptionContracts(params: {
    where: Prisma.OptionContractWhereInput;
    data: Prisma.OptionContractUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return this.prisma.optionContract.updateMany({
      data,
      where,
    });
  }

  async deleteOptionContract(
    where: Prisma.OptionContractWhereUniqueInput,
  ): Promise<OptionContract> {
    return this.prisma.optionContract.delete({
      where,
    });
  }
}
