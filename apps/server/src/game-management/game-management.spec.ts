import { Test, TestingModule } from '@nestjs/testing';
import { GameManagementService } from './game-management.service';
import { PrismaService } from '@server/prisma/prisma.service';
import { GamePlayerService } from '@server/game-player/game-player.service';
import { PlayersService } from '@server/players/players.service';
import { GamesService } from '@server/games/games.service';
import { SectorService } from '@server/sector/sector.service';
import { CompanyService } from '@server/company/company.service';
import { Prisma, Game, GamePlayer, Sector, Company } from '@prisma/client';
import jsonData from '@server/data/gameData';

jest.mock('fs');

describe('GameManagementService', () => {
  let service: GameManagementService;
  let prismaService: PrismaService;
  let gamePlayerService: GamePlayerService;
  let playersService: PlayersService;
  let gamesService: GamesService;
  let sectorService: SectorService;
  let companyService: CompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameManagementService,
        {
          provide: PrismaService,
          useValue: {
            roomUser: {
              findMany: jest.fn().mockReturnValue([]),
            },
          },
        },
        {
          provide: GamePlayerService,
          useValue: {
            createGamePlayer: jest.fn(),
          },
        },
        {
          provide: PlayersService,
          useValue: {
            createPlayer: jest.fn(),
          },
        },
        {
          provide: GamesService,
          useValue: {
            createGame: jest.fn(),
          },
        },
        {
          provide: SectorService,
          useValue: {
            createManySectors: jest.fn(),
          },
        },
        {
          provide: CompanyService,
          useValue: {
            createManyCompanies: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameManagementService>(GameManagementService);
    prismaService = module.get<PrismaService>(PrismaService);
    gamePlayerService = module.get<GamePlayerService>(GamePlayerService);
    playersService = module.get<PlayersService>(PlayersService);
    gamesService = module.get<GamesService>(GamesService);
    sectorService = module.get<SectorService>(SectorService);
    companyService = module.get<CompanyService>(CompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startGame', () => {
    it('should start a game and create sectors and companies', async () => {
      const gameId = 'test-game-id';
      const roomId = 1;
      const startingCashOnHand = 1000;
      const consumerPoolNumber = 10;
      const bankPoolNumber = 10;

      const gameData: Prisma.GameCreateInput = {
        id: gameId,
        name: `Game_${gameId}`,
        currentTurn: 0,
        currentOrSubRound: 0,
        currentRound: 'initial',
        bankPoolNumber,
        consumerPoolNumber,
        gameStatus: 'started',
      };

      const createdGame: Game = { ...gameData, players: [], sectors: [], companies: [] } as Game;

      jest.spyOn(gamesService, 'createGame').mockResolvedValue(createdGame);
      jest.spyOn(service, 'addPlayersToGame').mockResolvedValue([] as GamePlayer[]);
      jest.spyOn(service, 'getRandomElements').mockReturnValue(jsonData.sectors.slice(0, 3));

      const selectedSectors = jsonData.sectors.slice(0, 3) as Sector[];
      const sectorData = selectedSectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        supply: sector.supply,
        demand: sector.demand,
        marketingPrice: sector.marketingPrice,
        basePrice: sector.basePrice,
        ipoMin: sector.ipoMin,
        ipoMax: sector.ipoMax,
        gameId: createdGame.id,
      }));

      const companyData = selectedSectors.flatMap((sector) => {
        const companiesInSector = jsonData.companies.filter((company) => company.sectorId === sector.id);
        const selectedCompanies = companiesInSector.slice(0, 2);

        return selectedCompanies.map((company) => ({
          id: company.id,
          name: company.name,
          unitPrice: company.unitPrice,
          throughput: company.throughput,
          sectorId: sector.id,
          gameId: createdGame.id,
          insolvent: company.insolvent,
        }));
      });

      await service.startGame({
        gameId,
        roomId,
        startingCashOnHand,
        consumerPoolNumber,
        bankPoolNumber,
      });

      expect(gamesService.createGame).toHaveBeenCalledWith(gameData);
      expect(service.addPlayersToGame).toHaveBeenCalledWith(gameId, roomId, startingCashOnHand);
      expect(sectorService.createManySectors).toHaveBeenCalledWith(sectorData);
      expect(companyService.createManyCompanies).toHaveBeenCalledWith(companyData);
    });
  });
});
