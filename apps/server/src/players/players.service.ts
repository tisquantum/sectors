import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Player, Prisma } from '@prisma/client';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async player(
    playerWhereUniqueInput: Prisma.PlayerWhereUniqueInput,
  ): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: playerWhereUniqueInput,
      include: {
        Game: true,
      },
    });
  }

  async players(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PlayerWhereUniqueInput;
    where?: Prisma.PlayerWhereInput;
    orderBy?: Prisma.PlayerOrderByWithRelationInput;
  }): Promise<Player[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.player.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPlayer(data: Prisma.PlayerCreateInput): Promise<Player> {
    return this.prisma.player.create({
      data,
    });
  }

  async updatePlayer(params: {
    where: Prisma.PlayerWhereUniqueInput;
    data: Prisma.PlayerUpdateInput;
  }): Promise<Player> {
    const { where, data } = params;
    return this.prisma.player.update({
      data,
      where,
    });
  }

  async deletePlayer(where: Prisma.PlayerWhereUniqueInput): Promise<Player> {
    return this.prisma.player.delete({
      where,
    });
  }
}
