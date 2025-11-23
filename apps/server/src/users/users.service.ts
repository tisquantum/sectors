import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { UserRestricted } from '@server/prisma/prisma.types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async listUsersRestricted(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<UserRestricted[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const users = await this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
    }));
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    let newName: string | undefined;

    // Extract the new name value from data.name
    if (typeof data.name === 'string') {
      newName = data.name;
    } else if (
      data.name &&
      typeof data.name === 'object' &&
      'set' in data.name &&
      typeof data.name.set === 'string'
    ) {
      newName = data.name.set;
    }

    // Check if newName is defined (i.e., name is being updated)
    if (newName) {
      // Check if another user with the same name exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          name: newName,
          id: {
            not: where.id, // Exclude the current user
          },
        },
      });

      if (existingUser) {
        // Throw an error if the username already exists
        throw new Error('Username already exists.');
      }
    }

    // Proceed with the update if the username is unique
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
