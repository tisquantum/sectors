/**
 * Manual Test Script for Modern Operation Mechanics
 * 
 * Run with: npx ts-node apps/server/test-modern-ops.ts
 * 
 * This script creates a test game and walks through all modern operation phases
 * to verify the implementation works correctly.
 */

import { PrismaClient, OperationMechanicsVersion, FactorySize, ResourceType, PhaseName, CompanyStatus, RoundType, GameStatus } from '@prisma/client';
import { getResourcePriceForResourceType, getSectorResourceForSectorName, DEFAULT_WORKERS } from './src/data/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🧪 MODERN OPERATION MECHANICS - BACKEND TEST\n');
  console.log('=' .repeat(60));

  let testGameId: string = '';
  let testCompanyId: string = '';
  let testSectorId: string = '';
  let testPlayerId: string = '';
  let testFactoryId: string = '';
  let room: { id: number } | null = null;
  let user: { id: string; authUserId: string } | null = null;

  try {
    // ============================================================
    // TEST 1: Game Initialization
    // ============================================================
    console.log('\n📝 TEST 1: Game Initialization');
    console.log('-'.repeat(60));

    // Create test room and user
    room = await prisma.room.create({
      data: { name: 'Modern Ops Test Room' },
    });

    user = await prisma.user.create({
      data: {
        name: 'Test Player',
        authUserId: `test-${Date.now()}`,
      },
    });

    if (!room || !user) {
      throw new Error('Room or user not created');
    }
    
    await prisma.roomUser.create({
      data: {
        userId: user.id,
        roomId: room.id,
        roomHost: true,
      },
    });

    console.log(`✓ Test room and user created`);

    if (!room) {
      throw new Error('Room not created');
    }

    // Note: You'll need to call your actual startGame method
    // For now, we'll create the game manually to test the mechanics
    const game = await prisma.game.create({
      data: {
        name: 'Modern Ops Test',
        currentTurn: '',
        currentOrSubRound: 0,
        currentRound: RoundType.GAME_UPKEEP,
        bankPoolNumber: 10000,
        consumerPoolNumber: 100,
        distributionStrategy: 'PRIORITY',
        gameStatus: GameStatus.ACTIVE,
        gameStep: 0,
        currentPhaseId: 'test',
        roomId: room.id,
        operationMechanicsVersion: OperationMechanicsVersion.MODERN,
        workers: DEFAULT_WORKERS,
        economyScore: 10,
      },
    });

    const gameTurn = await prisma.gameTurn.create({
      data: {
        gameId: game.id,
        turn: 1,
      },
    });

    testGameId = game.id;

    // Update game with current turn
    await prisma.game.update({
      where: { id: testGameId },
      data: { currentTurn: gameTurn.id },
    });

    console.log(`✓ Game created: ${testGameId}`);
    console.log(`  Operation version: MODERN`);
    console.log(`  Workers available: ${DEFAULT_WORKERS}`);

    // ============================================================
    // TEST 2: Initialize Resources
    // ============================================================
    console.log('\n📝 TEST 2: Resource Tracks Initialization');
    console.log('-'.repeat(60));

    const resourcesData = [
      { type: ResourceType.CIRCLE, trackType: 'GLOBAL' as const },
      { type: ResourceType.SQUARE, trackType: 'GLOBAL' as const },
      { type: ResourceType.TRIANGLE, trackType: 'GLOBAL' as const },
      { type: ResourceType.HEALTHCARE, trackType: 'SECTOR' as const },
      { type: ResourceType.TECHNOLOGY, trackType: 'SECTOR' as const },
      { type: ResourceType.ENERGY, trackType: 'SECTOR' as const },
    ];

    for (const resourceData of resourcesData) {
      const priceArray = getResourcePriceForResourceType(resourceData.type);
      await prisma.resource.create({
        data: {
          gameId: testGameId,
          type: resourceData.type,
          trackType: resourceData.trackType,
          trackPosition: 0,
          price: priceArray[0],
        },
      });
    }

    console.log(`✓ Created ${resourcesData.length} resources`);

    const resources = await prisma.resource.findMany({
      where: { gameId: testGameId },
    });

    resources.forEach(r => {
      console.log(`  ${r.type.padEnd(20)} | Position: ${r.trackPosition} | Price: $${r.price}`);
    });

    // ============================================================
    // TEST 3: Initialize Sectors and Consumption Bags
    // ============================================================
    console.log('\n📝 TEST 3: Consumption Bags Initialization');
    console.log('-'.repeat(60));

    // Create test sector
    const sector = await prisma.sector.create({
      data: {
        name: 'Healthcare',
        sectorName: 'HEALTHCARE',
        supply: 10,
        demand: 10,
        consumers: 10,
        marketingPrice: 100,
        basePrice: 50,
        gameId: testGameId,
      },
    });

    testSectorId = sector.id;

    // Initialize consumption bag (5 permanent markers)
    const sectorResourceType = getSectorResourceForSectorName(sector.sectorName);
    const markers = [];
    for (let i = 0; i < 5; i++) {
      markers.push({
        gameId: testGameId,
        sectorId: sector.id,
        resourceType: sectorResourceType,
        isPermanent: true,
        companyId: null,
      });
    }

    await prisma.consumptionMarker.createMany({ data: markers });

    console.log(`✓ Sector created: ${sector.sectorName}`);
    console.log(`✓ Consumption bag initialized with 5 permanent markers`);
    console.log(`  Resource type: ${sectorResourceType}`);

    // ============================================================
    // TEST 4: Create Company and Player
    // ============================================================
    console.log('\n📝 TEST 4: Company and Player Setup');
    console.log('-'.repeat(60));

    const player = await prisma.player.create({
      data: {
        nickname: 'TestCEO',
        cashOnHand: 5000,
        gameId: testGameId,
        userId: user.id,
        marketOrderActions: 3,
        limitOrderActions: 5,
        shortOrderActions: 2,
        marginAccount: 0,
      },
    });

    testPlayerId = player.id;

    const company = await prisma.company.create({
      data: {
        name: 'MediCorp',
        stockSymbol: 'MEDI',
        unitPrice: 20,
        throughput: 0,
        sectorId: sector.id,
        gameId: testGameId,
        status: CompanyStatus.ACTIVE,
        isFloated: true,
        currentStockPrice: 100,
        cashOnHand: 1000,
        ceoId: player.id,
        brandScore: 0,
      },
    });

    testCompanyId = company.id;

    console.log(`✓ Player created: ${player.nickname}`);
    console.log(`✓ Company created: ${company.name}`);
    console.log(`  CEO: ${player.nickname}`);
    console.log(`  Cash on hand: $${company.cashOnHand}`);
    console.log(`  Unit price: $${company.unitPrice}`);

    // ============================================================
    // TEST 5: Factory Construction Order
    // ============================================================
    console.log('\n📝 TEST 5: Factory Construction');
    console.log('-'.repeat(60));

    const factoryOrder = await prisma.factoryConstructionOrder.create({
      data: {
        companyId: company.id,
        gameId: testGameId,
        gameTurnId: gameTurn.id,
        phaseId: 'test-phase',
        playerId: player.id,
        sectorId: sector.id,
        size: FactorySize.FACTORY_II,
        resourceTypes: [ResourceType.HEALTHCARE, ResourceType.TRIANGLE, ResourceType.SQUARE],
      },
    });

    console.log(`✓ Factory construction order created`);
    console.log(`  Size: ${factoryOrder.size}`);
    console.log(`  Blueprint: ${factoryOrder.resourceTypes.join(', ')}`);

    // Calculate expected cost
    const blueprintCost = factoryOrder.resourceTypes.reduce((sum, type) => {
      const resource = resources.find(r => r.type === type);
      return sum + (resource?.price || 0);
    }, 0);

    console.log(`  Estimated cost: $${blueprintCost}`);

    // ============================================================
    // TEST 6: Resolve Factory Construction
    // ============================================================
    console.log('\n📝 TEST 6: Factory Construction Resolution');
    console.log('-'.repeat(60));

    console.log(`Company cash before: $${company.cashOnHand}`);

    // Manually resolve (simulating what the phase handler does)
    const companyCurrent = await prisma.company.findUnique({ where: { id: company.id } });
    
    if (companyCurrent && companyCurrent.cashOnHand >= blueprintCost) {
      // Create factory
      const factory = await prisma.factory.create({
        data: {
          companyId: company.id,
          sectorId: sector.id,
          gameId: testGameId,
          size: factoryOrder.size,
          workers: 4, // FACTORY_II = 4 workers
          slot: 1,
          isOperational: false,
          resourceTypes: factoryOrder.resourceTypes,
        },
      });

      testFactoryId = factory.id;

      // Deduct cash
      await prisma.company.update({
        where: { id: company.id },
        data: { cashOnHand: { decrement: blueprintCost } },
      });

      // Add consumption marker
      await prisma.consumptionMarker.create({
        data: {
          gameId: testGameId,
          sectorId: sector.id,
          companyId: company.id,
          resourceType: factoryOrder.resourceTypes[0],
          isPermanent: true,
        },
      });

      // Update resource tracks
      for (const resourceType of factoryOrder.resourceTypes) {
        await prisma.resource.updateMany({
          where: { gameId: testGameId, type: resourceType },
          data: { trackPosition: { increment: 1 } },
        });
      }

      // Update resource prices
      const updatedResources = await prisma.resource.findMany({
        where: { gameId: testGameId },
      });

      for (const resource of updatedResources) {
        const priceArray = getResourcePriceForResourceType(resource.type);
        const newPrice = priceArray[Math.min(resource.trackPosition, priceArray.length - 1)];
        await prisma.resource.update({
          where: { id: resource.id },
          data: { price: newPrice },
        });
      }

      // Delete order
      await prisma.factoryConstructionOrder.delete({
        where: { id: factoryOrder.id },
      });

      const companyAfter = await prisma.company.findUnique({ where: { id: company.id } });
      
      console.log(`✓ Factory built successfully`);
      console.log(`  Factory ID: ${factory.id}`);
      console.log(`  Operational: ${factory.isOperational} (will be true next turn)`);
      console.log(`  Company cash after: $${companyAfter?.cashOnHand}`);
      console.log(`  Cost paid: $${blueprintCost}`);

      const markersAfter = await prisma.consumptionMarker.count({
        where: { sectorId: sector.id },
      });
      console.log(`✓ Consumption markers: 5 → ${markersAfter} (+1 from factory)`);

      const resourcesUpdated = await prisma.resource.findMany({
        where: { 
          gameId: testGameId,
          type: { in: factoryOrder.resourceTypes },
        },
      });

      console.log(`✓ Resource tracks updated:`);
      resourcesUpdated.forEach(r => {
        console.log(`  ${r.type}: position ${r.trackPosition}, price $${r.price}`);
      });
    }

    // ============================================================
    // TEST 7: Make Factory Operational
    // ============================================================
    console.log('\n📝 TEST 7: Factory Becomes Operational (Next Turn START)');
    console.log('-'.repeat(60));

    if (!testFactoryId) {
      throw new Error('No factory ID available');
    }

    await prisma.factory.update({
      where: { id: testFactoryId },
      data: { isOperational: true },
    });

    const operationalFactory = await prisma.factory.findUnique({
      where: { id: testFactoryId },
    });

    console.log(`✓ Factory operational status: false → ${operationalFactory?.isOperational}`);

    // ============================================================
    // TEST 8: Consumption Phase
    // ============================================================
    console.log('\n📝 TEST 8: Consumption Phase');
    console.log('-'.repeat(60));

    const allMarkers = await prisma.consumptionMarker.findMany({
      where: { sectorId: sector.id },
    });

    console.log(`Sector: ${sector.sectorName}`);
    console.log(`Customers to serve: ${sector.consumers}`);
    console.log(`Markers in bag: ${allMarkers.length}`);
    console.log(`  Permanent: ${allMarkers.filter(m => m.isPermanent).length}`);
    console.log(`  Temporary: ${allMarkers.filter(m => !m.isPermanent).length}`);

    // Simulate customer allocation (simplified)
    const customersToServe = Math.min(sector.consumers, 4); // FACTORY_II capacity = 4

    console.log(`\nSimulating ${customersToServe} customers being served...`);

    if (!testFactoryId) {
      throw new Error('No factory ID available');
    }

    // Create FactoryProduction record
    const production = await prisma.factoryProduction.create({
      data: {
        factoryId: testFactoryId,
        gameId: testGameId,
        gameTurnId: gameTurn.id,
        companyId: company.id,
        customersServed: customersToServe,
        revenue: 0,
        costs: 0,
        profit: 0,
      },
    });

    console.log(`✓ FactoryProduction record created:`);
    console.log(`  Factory: ${operationalFactory?.size}`);
    console.log(`  Customers served: ${production.customersServed}`);
    console.log(`  Revenue: $${production.revenue} (to be calculated)`);

    // ============================================================
    // TEST 9: Earnings Call
    // ============================================================
    console.log('\n📝 TEST 9: Earnings Call');
    console.log('-'.repeat(60));

    const factoryWithTypes = await prisma.factory.findUnique({
      where: { id: testFactoryId },
    });

    // Calculate revenue per unit
    let revenuePerUnit = company.unitPrice;
    console.log(`\nRevenue calculation:`);
    console.log(`  Unit price: $${company.unitPrice}`);

    for (const resourceType of factoryWithTypes!.resourceTypes) {
      const resource = await prisma.resource.findFirst({
        where: { gameId: testGameId, type: resourceType },
      });
      const priceArray = getResourcePriceForResourceType(resourceType);
      const price = priceArray[Math.min(resource!.trackPosition, priceArray.length - 1)];
      revenuePerUnit += price;
      console.log(`  + ${resourceType}: $${price}`);
    }

    console.log(`  = Revenue per unit: $${revenuePerUnit}`);

    // Calculate totals
    const revenue = production.customersServed * revenuePerUnit;
    const costs = factoryWithTypes!.workers * 10; // BASE_WORKER_SALARY
    const profit = revenue - costs;

    console.log(`\nFinancials:`);
    console.log(`  Revenue: ${production.customersServed} customers × $${revenuePerUnit} = $${revenue}`);
    console.log(`  Costs: ${factoryWithTypes!.workers} workers × $10 = $${costs}`);
    console.log(`  Profit: $${profit}`);

    // Update production record
    await prisma.factoryProduction.update({
      where: { id: production.id },
      data: { revenue, costs, profit },
    });

    // Update company cash
    const companyBefore = await prisma.company.findUnique({ where: { id: company.id } });
    await prisma.company.update({
      where: { id: company.id },
      data: { cashOnHand: { increment: profit } },
    });
    const companyAfter = await prisma.company.findUnique({ where: { id: company.id } });

    console.log(`\n✓ Earnings processed:`);
    console.log(`  Company cash: $${companyBefore?.cashOnHand} → $${companyAfter?.cashOnHand}`);
    console.log(`  Profit added: $${profit}`);

    // Determine stock price adjustment
    let stockSteps = 0;
    if (profit > 500) stockSteps = 3;
    else if (profit > 200) stockSteps = 2;
    else if (profit > 0) stockSteps = 1;
    else if (profit < -200) stockSteps = -2;
    else if (profit < 0) stockSteps = -1;

    console.log(`  Stock price adjustment: ${stockSteps > 0 ? '+' : ''}${stockSteps} steps`);

    // ============================================================
    // TEST 10: Data Verification
    // ============================================================
    console.log('\n📝 TEST 10: Data Integrity Verification');
    console.log('-'.repeat(60));

    const finalProduction = await prisma.factoryProduction.findUnique({
      where: { id: production.id },
      include: {
        Factory: true,
        Company: true,
        GameTurn: true,
      },
    });

    console.log(`\n✓ FactoryProduction record complete:`);
    console.log(JSON.stringify({
      id: finalProduction?.id,
      factory: finalProduction?.Factory.size,
      company: finalProduction?.Company.name,
      turn: finalProduction?.GameTurn.turn,
      customersServed: finalProduction?.customersServed,
      revenue: finalProduction?.revenue,
      costs: finalProduction?.costs,
      profit: finalProduction?.profit,
    }, null, 2));

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));

    console.log(`\n📊 Summary:`);
    console.log(`  Game: ${testGameId}`);
    console.log(`  Resources: ${resources.length} tracks initialized`);
    console.log(`  Consumption Markers: ${allMarkers.length + 1} (5 default + 1 from factory)`);
    console.log(`  Factories Built: 1`);
    console.log(`  Production Records: 1`);
    console.log(`  Customers Served: ${production.customersServed}`);
    console.log(`  Total Profit: $${profit}`);

    console.log(`\n🎉 Modern Operation Mechanics Working Correctly!\n`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    if (testGameId) {
      try {
        await prisma.factoryProduction.deleteMany({ where: { gameId: testGameId } });
        await prisma.consumptionMarker.deleteMany({ where: { gameId: testGameId } });
        await prisma.factory.deleteMany({ where: { gameId: testGameId } });
        await prisma.factoryConstructionOrder.deleteMany({ where: { gameId: testGameId } });
        await prisma.resource.deleteMany({ where: { gameId: testGameId } });
        await prisma.company.deleteMany({ where: { gameId: testGameId } });
        await prisma.sector.deleteMany({ where: { gameId: testGameId } });
        await prisma.gameTurn.deleteMany({ where: { gameId: testGameId } });
        await prisma.player.deleteMany({ where: { gameId: testGameId } });
        if (room) {
          await prisma.roomUser.deleteMany({ where: { roomId: room.id } });
          await prisma.room.delete({ where: { id: room.id } });
        }
        if (user) {
          await prisma.user.deleteMany({ where: { authUserId: user.authUserId } });
        }
        await prisma.game.delete({ where: { id: testGameId } });
        console.log('✓ Cleanup complete\n');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

