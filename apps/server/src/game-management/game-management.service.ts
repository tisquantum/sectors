import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { GamePlayerService } from '../game-player/game-player.service';
import { PlayersService } from '@server/players/players.service';
import { Game, GamePlayer, Prisma, Sector } from '@prisma/client';
import { GamesService } from '@server/games/games.service';
import { CompanyService } from '@server/company/company.service';
import { SectorService } from '@server/sector/sector.service';
import { gameDataJson } from '@server/data/gameData';
import { StartGameInput } from './game-management.interface';
import { GameCompanyService } from '@server/game-company/game-company.service';
import { GamePlayerWithStock } from '@server/prisma/prisma.types';

@Injectable()
export class GameManagementService {
  constructor(
    private prisma: PrismaService,
    private gamePlayerService: GamePlayerService,
    private playersService: PlayersService,
    private gamesService: GamesService,
    private companyService: CompanyService,
    private sectorService: SectorService,
    private gameCompanyService: GameCompanyService,
  ) {}

  async addPlayersToGame(
    gameId: string,
    roomId: number,
    startingCashOnHand: number,
  ): Promise<GamePlayer[]> {
    const users = await this.prisma.roomUser.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    const players = await this.playersService.createManyPlayers(
      users.map((user) => ({
        nickname: user.user.name,
        cashOnHand: startingCashOnHand,
        gameId,
      })),
    );

    return await this.gamePlayerService.createManyGamePlayers(
      players.map((player) => ({
        gameId,
        playerId: player.id,
      })),
    );
  }

  async startGame(input: StartGameInput): Promise<Game> {
    const {
      roomId,
      startingCashOnHand,
      consumerPoolNumber,
      bankPoolNumber,
    } = input;

    const gameData: Prisma.GameCreateInput = {
      name: `Game_Fantastic`,
      currentTurn: 0,
      currentOrSubRound: 0,
      currentRound: 'initial',
      bankPoolNumber,
      consumerPoolNumber,
      gameStatus: 'started',
    };

    const jsonData = gameDataJson;
    if (!jsonData || !jsonData.sectors || !Array.isArray(jsonData.sectors)) {
      throw new Error('Invalid JSON data for sectors');
    }

    try {
      // Create the game
      const game = await this.gamesService.createGame(gameData);

      // Add players to the game
      await this.addPlayersToGame(game.id, roomId, startingCashOnHand);

      // Randomly select 3 sectors
      const selectedSectors = this.getRandomElements(
        jsonData.sectors,
        3,
      ) as Sector[];

      // Prepare sectors and companies for batch creation
      const sectorData = selectedSectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        supply: sector.supply,
        demand: sector.demand,
        marketingPrice: sector.marketingPrice,
        basePrice: sector.basePrice,
        floatNumberMin: sector.floatNumberMin,
        floatNumberMax: sector.floatNumberMax,
        gameId: game.id,
      }));

      const companyData = selectedSectors.flatMap((sector) => {
        const companiesInSector = jsonData.companies.filter(
          (company) => company.sectorId === sector.id,
        );
        const selectedCompanies = this.getRandomElements(companiesInSector, 2);

        return selectedCompanies.map((company) => ({
          id: company.id,
          name: company.name,
          unitPrice: company.unitPrice,
          throughput: company.throughput,
          sectorId: sector.name, //map to name at first then match to supabase for id
          gameId: game.id,
          insolvent: company.insolvent,
        }));
      });

      try {
        // Create sectors and companies
        const sectors = await this.sectorService.createManySectors(sectorData);
        //map sector ids to names and update companyData
        const newCompanyData = companyData.map((company) => {
          const sector = sectors.find((s) => s.name === company.sectorId);
          if (!sector) {
            throw new Error('Sector not found');
          }
          return {
            ...company,
            sectorId: sector.id,
          };
        });
        const companies =
          await this.companyService.createManyCompanies(newCompanyData);
        await this.gameCompanyService.createManyGameCompanies(
          companies.map((company) => ({
            gameId: game.id,
            companyId: company.id,
          })),
        );
      } catch (error) {
        console.error('Error starting game:', error);
        throw new Error('Failed to start the game');
      }
      
      return game;
    } catch (error) {
      console.error('Error starting game:', error);
      throw new Error('Failed to start the game');
    }
  }

  public getRandomElements<T>(arr: T[], n: number): T[] {
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    if (n > len)
      throw new RangeError(
        'getRandomElements: more elements taken than available',
      );
    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  public getPlayersWithStocks(gameId: string): Promise<GamePlayerWithStock[]> {
    return this.gamePlayerService.gamePlayersWithStocks({
      where: {
        gameId,
      }
    });
  }
}
