/**
 * Simple verification script for Modern Operation Mechanics
 * Run with: npm run test:modern-ops (add to package.json)
 * Or directly via your NestJS app console
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyModernOperationMechanics() {
  console.log('\n🔍 VERIFYING MODERN OPERATION MECHANICS SETUP\n');
  console.log('='.repeat(70));

  try {
    // Check 1: Verify ConsumptionMarker table exists
    console.log('\n✓ Checking ConsumptionMarker table...');
    const markerCount = await prisma.consumptionMarker.count();
    console.log(`  Found ${markerCount} consumption markers in database`);

    // Check 2: Verify FactoryProduction table exists
    console.log('\n✓ Checking FactoryProduction table...');
    const productionCount = await prisma.factoryProduction.count();
    console.log(`  Found ${productionCount} factory production records in database`);

    // Check 3: Verify Resource table has trackPosition
    console.log('\n✓ Checking Resource table structure...');
    const sampleResource = await prisma.resource.findFirst();
    if (sampleResource) {
      console.log(`  Sample resource:`);
      console.log(`    Type: ${sampleResource.type}`);
      console.log(`    Track Position: ${sampleResource.trackPosition}`);
      console.log(`    Price: $${sampleResource.price}`);
    } else {
      console.log(`  No resources in database yet (expected for new installation)`);
    }

    // Check 4: Verify FactoryConstructionOrder has gameTurnId
    console.log('\n✓ Checking FactoryConstructionOrder table structure...');
    const sampleOrder = await prisma.factoryConstructionOrder.findFirst();
    if (sampleOrder) {
      console.log(`  Sample order has gameTurnId: ${!!sampleOrder.gameTurnId}`);
      console.log(`  Sample order has sectorId: ${!!sampleOrder.sectorId}`);
    } else {
      console.log(`  No construction orders in database yet (expected)`);
    }

    // Check 5: Find any modern games
    console.log('\n✓ Checking for modern mechanics games...');
    const modernGames = await prisma.game.findMany({
      where: {
        operationMechanicsVersion: 'MODERN',
      },
      select: {
        id: true,
        name: true,
        workers: true,
        _count: {
          select: {
            resources: true,
            consumptionMarkers: true,
            factories: true,
            factoryProductions: true,
          },
        },
      },
    });

    if (modernGames.length > 0) {
      console.log(`  Found ${modernGames.length} modern game(s):`);
      modernGames.forEach(game => {
        console.log(`\n  Game: ${game.name} (${game.id})`);
        console.log(`    Workers: ${game.workers}`);
        console.log(`    Resources: ${game._count.resources}`);
        console.log(`    Consumption Markers: ${game._count.consumptionMarkers}`);
        console.log(`    Factories: ${game._count.factories}`);
        console.log(`    Production Records: ${game._count.factoryProductions}`);
      });
    } else {
      console.log(`  No modern games found (create one to test!)`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ SCHEMA VERIFICATION COMPLETE!\n');
    console.log('All required tables and fields are present.');
    console.log('Ready to create a modern mechanics game!\n');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:');
    console.error(error);
    console.error('\nPossible causes:');
    console.error('  1. Prisma client not generated - run: npx prisma generate');
    console.error('  2. Database not migrated - run: npx prisma db push');
    console.error('  3. Database connection issues - check .env DATABASE_URL\n');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  verifyModernOperationMechanics()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { verifyModernOperationMechanics };

