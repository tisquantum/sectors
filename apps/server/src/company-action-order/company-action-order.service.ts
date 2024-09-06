import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust the path as needed
import { Prisma, CompanyActionOrder } from '@prisma/client'; // Adjust the path as needed

@Injectable()
export class CompanyActionOrderService {
  constructor(private prisma: PrismaService) {}

  // Create a single CompanyActionOrder
  async createCompanyActionOrder(
    data: Prisma.CompanyActionOrderCreateInput,
  ): Promise<CompanyActionOrder> {
    return this.prisma.companyActionOrder.create({
      data,
    });
  }

  // Create multiple CompanyActionOrders and return them
  async createManyCompanyActionOrders(
    data: Prisma.CompanyActionOrderCreateManyInput[],
  ): Promise<CompanyActionOrder[]> {
    return this.prisma.companyActionOrder.createManyAndReturn({
      data,
    });
  }

  // Get a CompanyActionOrder by ID
  async getCompanyActionOrderById(id: string): Promise<CompanyActionOrder | null> {
    return this.prisma.companyActionOrder.findUnique({
      where: { id },
    });
  }

  // Get all CompanyActionOrders
  async getAllCompanyActionOrders(): Promise<CompanyActionOrder[]> {
    return this.prisma.companyActionOrder.findMany();
  }

  // List CompanyActionOrders with optional filtering, pagination, etc.
  async listCompanyActionOrders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CompanyActionOrderWhereUniqueInput;
    where?: Prisma.CompanyActionOrderWhereInput;
    orderBy?: Prisma.CompanyActionOrderOrderByWithRelationInput;
  }): Promise<CompanyActionOrder[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.companyActionOrder.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  // Update a CompanyActionOrder
  async updateCompanyActionOrder(
    id: string,
    data: Prisma.CompanyActionOrderUpdateInput,
  ): Promise<CompanyActionOrder> {
    return this.prisma.companyActionOrder.update({
      where: { id },
      data,
    });
  }

  // Delete a CompanyActionOrder
  async deleteCompanyActionOrder(id: string): Promise<CompanyActionOrder> {
    return this.prisma.companyActionOrder.delete({
      where: { id },
    });
  }
}
