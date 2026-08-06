import { getXpLevel, XP_TIERS } from '../src/lib/xpUtils';

function runXpTests() {
  console.log('⚡ Running XP Level & Tier Calculations Unit Tests...');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  };

  // Test 1: 0 XP should be Rookie Level 1
  const l1 = getXpLevel(0);
  assert(l1.level === 1 && l1.name === 'Rookie' && l1.progress === 0 && l1.xpNeeded === 200, '0 XP is Level 1 Rookie with 0% progress');

  // Test 2: 100 XP should be Rookie Level 1 with 50% progress
  const l1Mid = getXpLevel(100);
  assert(l1Mid.level === 1 && l1Mid.progress === 50 && l1Mid.xpNeeded === 100, '100 XP is Level 1 with 50% progress and 100 XP needed');

  // Test 3: 200 XP threshold should be Challenger Level 2
  const l2 = getXpLevel(200);
  assert(l2.level === 2 && l2.name === 'Challenger' && l2.progress === 0 && l2.xpNeeded === 300, '200 XP enters Level 2 Challenger at 0%');

  // Test 4: 350 XP should be Challenger Level 2 with 50% progress
  const l2Mid = getXpLevel(350);
  assert(l2Mid.level === 2 && l2Mid.progress === 50 && l2Mid.xpNeeded === 150, '350 XP is Level 2 at 50% progress');

  // Test 5: 500 XP is Warrior Level 3
  const l3 = getXpLevel(500);
  assert(l3.level === 3 && l3.name === 'Warrior' && l3.progress === 0, '500 XP is Level 3 Warrior');

  // Test 6: 1000 XP is Legend Level 4
  const l4 = getXpLevel(1000);
  assert(l4.level === 4 && l4.name === 'Legend' && l4.progress === 0, '1000 XP is Level 4 Legend');

  // Test 7: 2000+ XP is Grand Master Level 5 (Max tier)
  const l5 = getXpLevel(2500);
  assert(l5.level === 5 && l5.name === 'Grand Master' && l5.progress === 100 && l5.xpNeeded === null && l5.nextTier === null, '2500 XP is Level 5 Grand Master with max tier handled');

  console.log(`\n========================================`);
  console.log(`XP Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runXpTests();
