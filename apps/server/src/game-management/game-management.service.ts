import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { PlayersService } from '@server/players/players.service';
import {
  Game,
  PhaseName,
  Player,
  Prisma,
  RoundType,
  Sector,
  StockRound,
} from '@prisma/client';
import { GamesService } from '@server/games/games.service';
import { CompanyService } from '@server/company/company.service';
import { SectorService } from '@server/sector/sector.service';
import { gameDataJson } from '@server/data/gameData';
import { StartGameInput } from './game-management.interface';
import { GameState, PlayerWithStocks } from '@server/prisma/prisma.types';
import { StockRoundService } from '@server/stock-round/stock-round.service';
import { PhaseService } from '@server/phase/phase.service';
import { phaseTimes } from '@server/data/constants';
import { TimerService } from '@server/timer/timer.service';
import { determineNextGamePhase } from '@server/data/helpers';
import { PusherService } from 'nestjs-pusher';
import { EVENT_NEW_PHASE, getGameChannelId } from '@server/pusher/pusher.types';
import { OperatingRoundService } from '@server/operating-round/operating-round.service';

@Injectable()
export class GameManagementService {
  constructor(
    private prisma: PrismaService,
    private playersService: PlayersService,
    private gamesService: GamesService,
    private companyService: CompanyService,
    private sectorService: SectorService,
    private stockRoundService: StockRoundService,
    private operatingRoundService: OperatingRoundService,
    private phaseService: PhaseService,
    private timerService: TimerService,
    private pusherService: PusherService,
  ) {}

  async addPlayersToGame(
    gameId: string,
    roomId: number,
    startingCashOnHand: number,
  ): Promise<Player[]> {
    const users = await this.prisma.roomUser.findMany({
      where: {
        roomId,
      },
      include: {
        user: true,
      },
    });

    return await this.playersService.createManyPlayers(
      users.map((user) => ({
        nickname: user.user.name,
        cashOnHand: startingCashOnHand,
        gameId,
        userId: user.userId,
      })),
    );
  }

  async startGame(input: StartGameInput): Promise<Game> {
    const { roomId, startingCashOnHand, consumerPoolNumber, bankPoolNumber } =
      input;

    const gameData: Prisma.GameCreateInput = {
      name: `Game_Fantastic`,
      currentTurn: 0,
      currentOrSubRound: 0,
      currentRound: 'STOCK',
      bankPoolNumber,
      consumerPoolNumber,
      gameStatus: 'started',
      gameStep: 0,
      currentPhaseId: 'initial',
      Room: { connect: { id: roomId } },
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
            gameId: game.id,
            sectorId: sector.id,
          };
        });
        await this.companyService.createManyCompanies(newCompanyData);
      } catch (error) {
        console.error('Error starting game:', error);
        throw new Error('Failed to start the game');
      }
      try {
        await this.startStockRound(game.id);
      } catch (error) {
        console.error('Error starting game:', error);
        throw new Error('Failed to start the stock round.');
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

  public getPlayersWithStocks(
    gameId: string,
  ): Promise<PlayerWithStocks[] | null> {
    return this.playersService.playersWithStocks({
      gameId,
    });
  }

  public getCurrentGameState(gameId: string): Promise<GameState | null> {
    return this.gamesService.getGameState(gameId);
  }

  public async startStockRound(gameId: string): Promise<StockRound | null> {
    const stockRound = await this.stockRoundService.createStockRound({
      Game: { connect: { id: gameId } },
    });
    await this.startPhase({
      gameId,
      stockRoundId: stockRound.id,
      phaseName: PhaseName.STOCK_MEET,
      roundType: RoundType.STOCK,
    });
    return stockRound;
  }

  /**
   * This is the main recurring game-loop.
   * The entire game operates on timers so
   * we can assume a recursive loop to invoke
   * each game phase.
   * 
   * TODO: Considerations for retrying failed phase transitions and the ability
   * for the game to start from any point should the server restart.
   *
   * @param gameId
   * @param phaseName
   * @param roundType
   * @param stockRoundId
   * @param operatingRoundId
   */
  private async startPhase({
    gameId,
    phaseName,
    roundType,
    stockRoundId,
    operatingRoundId,
  }: {
    gameId: string;
    phaseName: PhaseName;
    roundType: RoundType;
    stockRoundId?: number;
    operatingRoundId?: number;
  }) {
    console.log('Starting phase:', phaseName);
    this.pusherService.trigger(getGameChannelId(gameId), 'phase-started', {
      phaseName,
    });
    const phase = await this.phaseService.createPhase({
      name: phaseName,
      phaseTime: phaseTimes[phaseName],
      Game: { connect: { id: gameId } },
      StockRound: stockRoundId ? { connect: { id: stockRoundId } } : undefined,
      OperatingRound: operatingRoundId
        ? { connect: { id: operatingRoundId } }
        : undefined,
    });
    if (roundType === RoundType.STOCK) {
      const stockRound = await this.stockRoundService.createStockRound({
        Game: { connect: { id: gameId } },
      });
    } else {
      const operatingRound =
        await this.operatingRoundService.createOperatingRound({
          Game: { connect: { id: gameId } },
        });
    }

    const game = await this.gamesService.updateGameState({
      where: { id: gameId },
      data: {
        currentPhaseId: phase.id,
        currentStockRoundId: stockRoundId,
        currentOperatingRoundId: operatingRoundId,
      },
    });

    this.pusherService.trigger(getGameChannelId(gameId), EVENT_NEW_PHASE, {
      game,
      phase
    });

    await this.timerService.setTimer(phase.id, phase.phaseTime, async () => {
      try {
        const nextPhase = determineNextGamePhase(phase.name);
        await this.startPhase({
          gameId,
          phaseName: nextPhase.phaseName,
          roundType: nextPhase.roundType,
          stockRoundId,
          operatingRoundId,
        });
      } catch (error) {
        console.error('Error during phase transition:', error);
        // Optionally handle retries or fallback logic here
      }
    });
  }
}
