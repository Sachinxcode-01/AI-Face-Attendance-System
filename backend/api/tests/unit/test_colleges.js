const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const collegeDbService = require('../../src/services/collegeDbService');

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING COLLEGE DB SERVICE & CACHE INTEGRITY TESTS');
  console.log('=============================================================\n');

  // Test 1: Minimum characters requirement
  console.log('[TEST 1] Short query rejection (< 2 characters)...');
  const shortRes = await collegeDbService.searchColleges('a');
  assert.strictEqual(Array.isArray(shortRes.results), true);
  assert.strictEqual(shortRes.results.length, 0);
  console.log('  ✅ Query shorter than 2 chars gracefully returns empty array');

  // Test 2: Live search
  console.log('[TEST 2] Live CollegeDB query ("IIT")...');
  const searchRes = await collegeDbService.searchColleges('IIT', 5);
  assert.strictEqual(Array.isArray(searchRes.results), true);
  assert.strictEqual(searchRes.results.length > 0, true, 'Expected results for "IIT"');
  console.log(`  ✅ Live query returned ${searchRes.results.length} colleges`);
  const first = searchRes.results[0];
  console.log(`     Sample: "${first.name}" (${first.city}, ${first.state})`);
  assert.ok(first.name, 'College has name');
  assert.ok(first.id, 'College has id');

  // Test 3: Caching
  console.log('[TEST 3] Cache verification for repeated search...');
  const cachedRes = await collegeDbService.searchColleges('IIT', 5);
  assert.strictEqual(cachedRes.cached, true, 'Second search should be served from memory cache');
  console.log('  ✅ In-memory cache hit successfully verified');

  // Test 4: Get college by ID
  console.log('[TEST 4] Get college by specific ID...');
  const collegeId = first.id;
  const detailRes = await collegeDbService.getCollegeById(collegeId);
  assert.ok(detailRes, 'Detail response exists');
  assert.strictEqual(detailRes.id, collegeId);
  console.log(`  ✅ College details fetched for: "${detailRes.name}"`);

  console.log('\n=============================================================');
  console.log('🎉 ALL COLLEGE DB UNIT TESTS PASSED!');
  console.log('=============================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
