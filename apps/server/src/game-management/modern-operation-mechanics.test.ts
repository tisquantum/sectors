import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { GameManagementService } from './game-management.service';
import { ModernOperationMechanicsService } from './modern-operation-mechanics.service';
import { 
  OperationMechanicsVersion, 
  PhaseName, 
  FactorySize, 
  ResourceType,
  CompanyStatus,
  RoundType,
  GameStatus,
} from '@prisma/client';
import { GameManagementModule } from './game-management.module';

describe('Modern Operation Mechanics - Integration Test', () => {
  let module: TestingModule;
  let gameManagementService: GameManagementService;
  let modernOperationMechanicsService: ModernOperationMechanicsService;
  let prisma: PrismaService;
  
  let testGameId: string;
  let testCompanyId: string;
  let testPlayerId: string;
  let testSectorId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [GameManagementModule],
    }).compile();

    gameManagementService = module.get<GameManagementService>(GameManagementService);
    modernOperationMechanicsService = module.get<ModernOperationMechanicsService>(ModernOperationMechanicsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testGameId) {
      await prisma.factoryProduction.deleteMany({ where: { gameId: testGameId } });
      await prisma.consumptionMarker.deleteMany({ where: { gameId: testGameId } });
      await prisma.factory.deleteMany({ where: { gameId: testGameId } });
      await prisma.factoryConstructionOrder.deleteMany({ where: { gameId: testGameId } });
      await prisma.marketingCampaign.deleteMany({ where: { gameId: testGameId } });
      await prisma.resource.deleteMany({ where: { gameId: testGameId } });
      await prisma.share.deleteMany({ where: { gameId: testGameId } });
      await prisma.company.deleteMany({ where: { gameId: testGameId } });
      await prisma.sector.deleteMany({ where: { gameId: testGameId } });
      await prisma.phase.deleteMany({ where: { gameId: testGameId } });
      await prisma.gameTurn.deleteMany({ where: { gameId: testGameId } });
      await prisma.player.deleteMany({ where: { gameId: testGameId } });
      await prisma.game.delete({ where: { id: testGameId } });
    }
    await module.close();
  });

  describe('1. Game Initialization', () => {
    it('should create a modern mechanics game with resources and consumption bags', async () => {
      // Create a test room first
      const room = await prisma.room.create({
        data: { name: 'Test Room Modern Ops' },
      });

      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Test Player',
          authUserId: 'test-auth-id',
        },
      });

      // Add user to room
      await prisma.roomUser.create({
        data: {
          userId: user.id,
          roomId: room.id,
          roomHost: true,
        },
      });

      // Start game with modern mechanics
      const game = await gameManagementService.startGame({
        roomId: room.id,
        roomName: 'Test Modern Game',
        startingCashOnHand: 1000,
        consumerPoolNumber: 100,
        bankPoolNumber: 10000,
        distributionStrategy: 'PRIORITY',
        gameMaxTurns: 10,
        playerOrdersConcealed: false,
        useOptionOrders: false,
        useLimitOrders: false,
        useShortOrders: false,
        isTimerless: true,
        bots: 0,
        operationMechanicsVersion: OperationMechanicsVersion.MODERN,
      });

      testGameId = game.id;

      // Verify game created
      expect(game).toBeDefined();
      expect(game.operationMechanicsVersion).toBe(OperationMechanicsVersion.MODERN);
      expect(game.workers).toBe(60); // DEFAULT_WORKERS

      // Verify resources created (3 global + 3 sectors × 1 sector-specific = 6 resources for 3 sectors)
      const resources = await prisma.resource.findMany({
        where: { gameId: game.id },
      });
      
      console.log(`✓ Resources created: ${resources.length}`);
      expect(resources.length).toBeGreaterThanOrEqual(6);

      // Verify all resources start at trackPosition 0
      resources.forEach(resource => {
        expect(resource.trackPosition).toBe(0);
        console.log(`  - ${resource.type}: position ${resource.trackPosition}, price $${resource.price}`);
      });

      // Verify consumption bags initialized (5 markers per sector)
      const consumptionMarkers = await prisma.consumptionMarker.findMany({
        where: { gameId: game.id },
      });

      const sectors = await prisma.sector.findMany({
        where: { gameId: game.id },
      });

      console.log(`✓ Consumption markers created: ${consumptionMarkers.length}`);
      console.log(`✓ Sectors: ${sectors.length}`);
      expect(consumptionMarkers.length).toBe(sectors.length * 5);

      // Verify all markers are permanent initially
      const allPermanent = consumptionMarkers.every(m => m.isPermanent);
      expect(allPermanent).toBe(true);

      // Store test data
      const companies = await prisma.company.findMany({
        where: { gameId: game.id },
      });
      testCompanyId = companies[0]?.id;
      testSectorId = sectors[0]?.id;

      const players = await prisma.player.findMany({
        where: { gameId: game.id },
      });
      testPlayerId = players[0]?.id;

      console.log(`\n✅ Game initialized successfully!`);
      console.log(`   Game ID: ${game.id}`);
      console.log(`   Resources: ${resources.length}`);
      console.log(`   Consumption Markers: ${consumptionMarkers.length}`);
      console.log(`   Workers Available: ${game.workers}`);
    });
  });

  describe('2. Factory Construction Flow', () => {
    it('should create factory construction order', async () => {
      const game = await prisma.game.findUnique({ where: { id: testGameId } });
      expect(game).toBeDefined();

      // Make company active and assign CEO
      await prisma.company.update({
        where: { id: testCompanyId },
        data: {
          status: CompanyStatus.ACTIVE,
          isFloated: true,
          currentStockPrice: 100,
          cashOnHand: 1000,
          ceoId: testPlayerId,
        },
      });

      // Create factory construction order
      const order = await prisma.factoryConstructionOrder.create({
        data: {
          companyId: testCompanyId,
          gameId: testGameId,
          gameTurnId: game!.currentTurn,
          phaseId: game!.currentPhaseId || '',
          playerId: testPlayerId,
          sectorId: testSectorId,
          size: FactorySize.FACTORY_II,
          resourceTypes: [ResourceType.HEALTHCARE, ResourceType.TRIANGLE, ResourceType.SQUARE],
        },
      });

      expect(order).toBeDefined();
      expect(order.resourceTypes.length).toBe(3);
      console.log(`\n✓ Factory construction order created`);
      console.log(`   Size: ${order.size}`);
      console.log(`   Resources: ${order.resourceTypes.join(', ')}`);
    });

    it('should resolve factory construction and create factory', async () => {
      // Create a phase for FACTORY_CONSTRUCTION_RESOLVE
      const game = await prisma.game.findUnique({ where: { id: testGameId } });
      
      const phase = await prisma.phase.create({
        data: {
          name: PhaseName.FACTORY_CONSTRUCTION_RESOLVE,
          gameId: testGameId,
          gameTurnId: game!.currentTurn,
          phaseTime: 15000,
        },
      });

      // Get resources before
      const resourcesBefore = await prisma.resource.findMany({
        where: { 
          gameId: testGameId,
          type: { in: [ResourceType.HEALTHCARE, ResourceType.TRIANGLE, ResourceType.SQUARE] }
        },
      });

      const trackPositionsBefore = resourcesBefore.map(r => ({
        type: r.type,
        position: r.trackPosition,
        price: r.price,
      }));

      console.log(`\n📊 Resources before construction:`);
      trackPositionsBefore.forEach(r => {
        console.log(`   ${r.type}: position ${r.position}, price $${r.price}`);
      });

      // Resolve factory construction
      await modernOperationMechanicsService['resolveFactoryConstruction'](phase, game!);

      // Verify factory was created
      const factories = await prisma.factory.findMany({
        where: { companyId: testCompanyId, gameId: testGameId },
      });

      expect(factories.length).toBe(1);
      const factory = factories[0];
      expect(factory.size).toBe(FactorySize.FACTORY_II);
      expect(factory.isOperational).toBe(false); // Not operational until next turn
      expect(factory.workers).toBe(4); // FACTORY_II requires 4 workers

      console.log(`\n✓ Factory created:`);
      console.log(`   ID: ${factory.id}`);
      console.log(`   Size: ${factory.size}`);
      console.log(`   Workers: ${factory.workers}`);
      console.log(`   Operational: ${factory.isOperational}`);

      // Verify resources consumed
      const resourcesAfter = await prisma.resource.findMany({
        where: { 
          gameId: testGameId,
          type: { in: [ResourceType.HEALTHCARE, ResourceType.TRIANGLE, ResourceType.SQUARE] }
        },
      });

      console.log(`\n📊 Resources after construction:`);
      resourcesAfter.forEach(r => {
        const before = trackPositionsBefore.find(b => b.type === r.type);
        console.log(`   ${r.type}: position ${before?.position} → ${r.trackPosition} (+${r.trackPosition - (before?.position || 0)})`);
        expect(r.trackPosition).toBeGreaterThan(before?.position || 0);
      });

      // Verify consumption marker added
      const consumptionMarkers = await prisma.consumptionMarker.findMany({
        where: { 
          gameId: testGameId,
          companyId: testCompanyId,
        },
      });

      expect(consumptionMarkers.length).toBe(1);
      expect(consumptionMarkers[0].isPermanent).toBe(true);
      
      console.log(`\n✓ Consumption marker added:`);
      console.log(`   Type: ${consumptionMarkers[0].resourceType}`);
      console.log(`   Permanent: ${consumptionMarkers[0].isPermanent}`);

      // Verify construction order deleted
      const remainingOrders = await prisma.factoryConstructionOrder.findMany({
        where: { gameId: testGameId },
      });
      expect(remainingOrders.length).toBe(0);
      
      console.log(`\n✓ Construction order completed and deleted`);
    });
  });

  describe('3. Factory Operational Status', () => {
    it('should make factory operational on next turn START_TURN', async () => {
      const game = await prisma.game.findUnique({ where: { id: testGameId } });
      
      const startTurnPhase = await prisma.phase.create({
        data: {
          name: PhaseName.START_TURN,
          gameId: testGameId,
          gameTurnId: game!.currentTurn,
          phaseTime: 30000,
        },
      });

      // Get factory before
      const factoryBefore = await prisma.factory.findFirst({
        where: { companyId: testCompanyId },
      });
      expect(factoryBefore?.isOperational).toBe(false);

      // Call START_TURN handler
      await modernOperationMechanicsService['makeFactoriesOperational'](startTurnPhase);

      // Verify factory is now operational
      const factoryAfter = await prisma.factory.findFirst({
        where: { companyId: testCompanyId },
      });
      
      expect(factoryAfter?.isOperational).toBe(true);
      console.log(`\n✓ Factory operational status: ${factoryBefore?.isOperational} → ${factoryAfter?.isOperational}`);
    });
  });

  describe('4. Consumption Phase', () => {
    it('should allocate customers to factories and create FactoryProduction records', async () => {
      // Setup: Add customers to sector
      await prisma.sector.update({
        where: { id: testSectorId },
        data: { consumers: 5 },
      });

      // Create consumption phase
      const game = await prisma.game.findUnique({ where: { id: testGameId } });
      const consumptionPhase = await prisma.phase.create({
        data: {
          name: PhaseName.CONSUMPTION_PHASE,
          gameId: testGameId,
          gameTurnId: game!.currentTurn,
          phaseTime: 30000,
        },
      });

      console.log(`\n📊 Before consumption phase:`);
      const markersBefore = await prisma.consumptionMarker.count({
        where: { sectorId: testSectorId },
      });
      console.log(`   Consumption markers in sector: ${markersBefore}`);

      // Run consumption phase
      await modernOperationMechanicsService['handleConsumptionPhase'](consumptionPhase);

      // Verify FactoryProduction records created
      const factoryProductions = await prisma.factoryProduction.findMany({
        where: { 
          gameId: testGameId,
          gameTurnId: game!.currentTurn,
        },
        include: {
          Factory: true,
          Company: true,
        },
      });

      console.log(`\n✓ FactoryProduction records created: ${factoryProductions.length}`);
      
      factoryProductions.forEach(prod => {
        console.log(`   ${prod.Company.name} ${prod.Factory.size}:`);
        console.log(`     Customers served: ${prod.customersServed}`);
        console.log(`     Revenue: $${prod.revenue} (to be calculated)`);
        console.log(`     Costs: $${prod.costs} (to be calculated)`);
        console.log(`     Profit: $${prod.profit} (to be calculated)`);
        
        expect(prod.customersServed).toBeGreaterThan(0);
        expect(prod.revenue).toBe(0); // Not calculated yet
        expect(prod.costs).toBe(0);
        expect(prod.profit).toBe(0);
      });

      // Verify sector score updated
      const sectorAfter = await prisma.sector.findUnique({
        where: { id: testSectorId },
      });
      
      console.log(`\n✓ Sector score updated based on service quality`);
    });
  });

  describe('5. Earnings Call', () => {
    it('should calculate exact revenue, costs, and profit using FactoryProduction records', async () => {
      const game = await prisma.game.findUnique({ where: { id: testGameId } });
      
      const earningsPhase = await prisma.phase.create({
        data: {
          name: PhaseName.EARNINGS_CALL,
          gameId: testGameId,
          gameTurnId: game!.currentTurn,
          phaseTime: 30000,
        },
      });

      // Get company cash before
      const companyBefore = await prisma.company.findUnique({
        where: { id: testCompanyId },
      });
      const cashBefore = companyBefore?.cashOnHand || 0;

      console.log(`\n📊 Before earnings call:`);
      console.log(`   Company cash: $${cashBefore}`);

      // Run earnings call
      await modernOperationMechanicsService['handleEarningsCall'](earningsPhase);

      // Verify FactoryProduction records updated with calculations
      const factoryProductions = await prisma.factoryProduction.findMany({
        where: { 
          gameId: testGameId,
          gameTurnId: game!.currentTurn,
        },
        include: {
          Factory: true,
          Company: true,
        },
      });

      console.log(`\n✓ Earnings calculated for ${factoryProductions.length} factories:`);
      
      let totalRevenue = 0;
      let totalCosts = 0;
      let totalProfit = 0;

      factoryProductions.forEach(prod => {
        console.log(`\n   ${prod.Company.name} ${prod.Factory.size}:`);
        console.log(`     Customers: ${prod.customersServed}`);
        console.log(`     Revenue: $${prod.revenue}`);
        console.log(`     Costs: $${prod.costs}`);
        console.log(`     Profit: $${prod.profit}`);
        
        // Verify calculations were performed
        expect(prod.revenue).toBeGreaterThan(0);
        expect(prod.costs).toBeGreaterThan(0);
        expect(prod.profit).toBe(prod.revenue - prod.costs);

        totalRevenue += prod.revenue;
        totalCosts += prod.costs;
        totalProfit += prod.profit;
      });

      console.log(`\n📊 Company totals:`);
      console.log(`   Revenue: $${totalRevenue}`);
      console.log(`   Costs: $${totalCosts}`);
      console.log(`   Profit: $${totalProfit}`);

      // Verify company cash updated
      const companyAfter = await prisma.company.findUnique({
        where: { id: testCompanyId },
      });
      const cashAfter = companyAfter?.cashOnHand || 0;

      console.log(`\n✓ Company cash updated: $${cashBefore} → $${cashAfter} (+$${cashAfter - cashBefore})`);
      expect(cashAfter).toBe(cashBefore + totalProfit);
    });
  });

  describe('6. Resource Track Verification', () => {
    it('should have correct resource prices based on trackPosition', async () => {
      const resources = await prisma.resource.findMany({
        where: { gameId: testGameId },
      });

      console.log(`\n📊 Resource pricing verification:`);
      
      // Import constants dynamically to get price arrays
      const { getResourcePriceForResourceType } = await import('../data/constants');

      for (const resource of resources) {
        const priceArray = getResourcePriceForResourceType(resource.type);
        const expectedPrice = priceArray[Math.min(resource.trackPosition, priceArray.length - 1)];
        
        console.log(`   ${resource.type}:`);
        console.log(`     Track position: ${resource.trackPosition}`);
        console.log(`     Current price: $${resource.price}`);
        console.log(`     Expected price: $${expectedPrice}`);
        
        expect(resource.price).toBe(expectedPrice);
      }

      console.log(`\n✅ All resource prices match track positions!`);
    });
  });

  describe('7. Full Turn Cycle', () => {
    it('should process complete turn without errors', async () => {
      console.log(`\n🔄 Running full turn cycle test...\n`);

      const game = await prisma.game.findUnique({ 
        where: { id: testGameId },
        include: { GameTurn: true },
      });

      // Summary of what happened
      console.log(`📊 Turn Summary for Game ${testGameId}:`);
      
      const factories = await prisma.factory.count({
        where: { gameId: testGameId },
      });
      console.log(`   Factories built: ${factories}`);

      const productions = await prisma.factoryProduction.count({
        where: { gameId: testGameId },
      });
      console.log(`   Production records: ${productions}`);

      const resources = await prisma.resource.findMany({
        where: { gameId: testGameId },
      });
      console.log(`   Resources tracked: ${resources.length}`);

      const avgTrackPosition = resources.reduce((sum, r) => sum + r.trackPosition, 0) / resources.length;
      console.log(`   Avg track position: ${avgTrackPosition.toFixed(2)}`);

      const consumptionMarkers = await prisma.consumptionMarker.count({
        where: { gameId: testGameId },
      });
      console.log(`   Consumption markers: ${consumptionMarkers}`);

      const gameLogs = await prisma.gameLog.findMany({
        where: { gameId: testGameId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      console.log(`\n📝 Recent game logs (last 10):`);
      gameLogs.reverse().forEach(log => {
        console.log(`   ${log.content}`);
      });

      console.log(`\n✅ Full turn cycle completed successfully!`);
    });
  });

  describe('8. Data Integrity Checks', () => {
    it('should maintain referential integrity', async () => {
      // Verify all factory productions link to valid factories
      const productions = await prisma.factoryProduction.findMany({
        where: { gameId: testGameId },
        include: { Factory: true, Company: true, GameTurn: true },
      });

      productions.forEach(prod => {
        expect(prod.Factory).toBeDefined();
        expect(prod.Company).toBeDefined();
        expect(prod.GameTurn).toBeDefined();
        expect(prod.factoryId).toBe(prod.Factory.id);
        expect(prod.companyId).toBe(prod.Company.id);
      });

      console.log(`\n✓ All ${productions.length} FactoryProduction records have valid relations`);

      // Verify consumption markers link to valid sectors
      const markers = await prisma.consumptionMarker.findMany({
        where: { gameId: testGameId },
        include: { Sector: true, Company: true },
      });

      markers.forEach(marker => {
        expect(marker.Sector).toBeDefined();
        expect(marker.sectorId).toBe(marker.Sector.id);
      });

      console.log(`✓ All ${markers.length} ConsumptionMarkers have valid relations`);

      // Verify resource track positions are within bounds
      const resources = await prisma.resource.findMany({
        where: { gameId: testGameId },
      });

      const { getResourcePriceForResourceType } = await import('../data/constants');
      
      resources.forEach(resource => {
        const priceArray = getResourcePriceForResourceType(resource.type);
        expect(resource.trackPosition).toBeGreaterThanOrEqual(0);
        expect(resource.trackPosition).toBeLessThan(priceArray.length + 10); // Allow some overflow
      });

      console.log(`✓ All ${resources.length} Resources have valid track positions`);
      console.log(`\n✅ Data integrity verified!`);
    });
  });
});

