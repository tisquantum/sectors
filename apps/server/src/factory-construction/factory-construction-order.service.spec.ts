import { Test, TestingModule } from '@nestjs/testing';
import { FactoryConstructionOrderService } from './factory-construction-order.service';
import { PrismaService } from '../prisma/prisma.service';
import { FactorySize, ResourceType } from '@prisma/client';

describe('FactoryConstructionOrderService', () => {
  let service: FactoryConstructionOrderService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    factoryConstructionOrder: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactoryConstructionOrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FactoryConstructionOrderService>(FactoryConstructionOrderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('factoryConstructionOrder', () => {
    it('should return a factory construction order', async () => {
      const mockOrder = {
        id: '1',
        companyId: 'company-1',
        gameId: 'game-1',
        phaseId: 'phase-1',
        playerId: 'player-1',
        size: FactorySize.FACTORY_I,
        resourceTypes: [ResourceType.TRIANGLE],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.factoryConstructionOrder.findUnique.mockResolvedValue(mockOrder);

      const result = await service.factoryConstructionOrder({ id: '1' });
      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.factoryConstructionOrder.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('factoryConstructionOrderWithRelations', () => {
    it('should return a factory construction order with relations', async () => {
      const mockOrderWithRelations = {
        id: '1',
        companyId: 'company-1',
        gameId: 'game-1',
        phaseId: 'phase-1',
        playerId: 'player-1',
        size: FactorySize.FACTORY_I,
        resourceTypes: [ResourceType.TRIANGLE],
        createdAt: new Date(),
        updatedAt: new Date(),
        player: { id: 'player-1', nickname: 'Test Player' },
        company: { id: 'company-1', name: 'Test Company' },
        game: { id: 'game-1', name: 'Test Game' },
        phase: { id: 'phase-1', name: 'FACTORY_CONSTRUCTION' },
      };

      mockPrismaService.factoryConstructionOrder.findUnique.mockResolvedValue(mockOrderWithRelations);

      const result = await service.factoryConstructionOrderWithRelations({ id: '1' });
      expect(result).toEqual(mockOrderWithRelations);
      expect(mockPrismaService.factoryConstructionOrder.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          player: true,
          company: true,
          game: true,
          phase: true,
        },
      });
    });
  });

  describe('factoryConstructionOrders', () => {
    it('should return factory construction orders', async () => {
      const mockOrders = [
        {
          id: '1',
          companyId: 'company-1',
          gameId: 'game-1',
          phaseId: 'phase-1',
          playerId: 'player-1',
          size: FactorySize.FACTORY_I,
          resourceTypes: [ResourceType.TRIANGLE],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.factoryConstructionOrder.findMany.mockResolvedValue(mockOrders);

      const result = await service.factoryConstructionOrders({
        where: { gameId: 'game-1' },
        take: 10,
      });
      expect(result).toEqual(mockOrders);
      expect(mockPrismaService.factoryConstructionOrder.findMany).toHaveBeenCalledWith({
        where: { gameId: 'game-1' },
        take: 10,
      });
    });
  });

  describe('createFactoryConstructionOrder', () => {
    it('should create a factory construction order', async () => {
      const createData = {
        company: { connect: { id: 'company-1' } },
        game: { connect: { id: 'game-1' } },
        phase: { connect: { id: 'phase-1' } },
        player: { connect: { id: 'player-1' } },
        size: FactorySize.FACTORY_I,
        resourceTypes: [ResourceType.TRIANGLE],
      };

      const mockCreatedOrder = {
        id: '1',
        companyId: 'company-1',
        gameId: 'game-1',
        phaseId: 'phase-1',
        playerId: 'player-1',
        size: FactorySize.FACTORY_I,
        resourceTypes: [ResourceType.TRIANGLE],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.factoryConstructionOrder.create.mockResolvedValue(mockCreatedOrder);

      const result = await service.createFactoryConstructionOrder(createData);
      expect(result).toEqual(mockCreatedOrder);
      expect(mockPrismaService.factoryConstructionOrder.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('updateFactoryConstructionOrder', () => {
    it('should update a factory construction order', async () => {
      const updateData = {
        size: FactorySize.FACTORY_II,
        resourceTypes: [ResourceType.TRIANGLE, ResourceType.SQUARE],
      };

      const mockUpdatedOrder = {
        id: '1',
        companyId: 'company-1',
        gameId: 'game-1',
        phaseId: 'phase-1',
        playerId: 'player-1',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.factoryConstructionOrder.update.mockResolvedValue(mockUpdatedOrder);

      const result = await service.updateFactoryConstructionOrder({
        where: { id: '1' },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedOrder);
      expect(mockPrismaService.factoryConstructionOrder.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });
  });

  describe('deleteFactoryConstructionOrder', () => {
    it('should delete a factory construction order', async () => {
      const mockDeletedOrder = {
        id: '1',
        companyId: 'company-1',
        gameId: 'game-1',
        phaseId: 'phase-1',
        playerId: 'player-1',
        size: FactorySize.FACTORY_I,
        resourceTypes: [ResourceType.TRIANGLE],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.factoryConstructionOrder.delete.mockResolvedValue(mockDeletedOrder);

      const result = await service.deleteFactoryConstructionOrder({ id: '1' });
      expect(result).toEqual(mockDeletedOrder);
      expect(mockPrismaService.factoryConstructionOrder.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('countFactoryConstructionOrders', () => {
    it('should count factory construction orders', async () => {
      mockPrismaService.factoryConstructionOrder.count.mockResolvedValue(5);

      const result = await service.countFactoryConstructionOrders({ gameId: 'game-1' });
      expect(result).toBe(5);
      expect(mockPrismaService.factoryConstructionOrder.count).toHaveBeenCalledWith({
        where: { gameId: 'game-1' },
      });
    });
  });
}); 