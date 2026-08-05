import app from '../server/index';
import { isOriginAllowed } from '../server/auth';
import {
  usernameParamSchema,
  createQuestSchema,
  updateProfileSchema,
  friendRequestSchema,
  friendRespondSchema,
  escapeSqlLike,
} from '../server/validators';

async function runSecurityChecks() {
  console.log('🚀 Running Comprehensive Security Hardening Checks...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}`);
      failed++;
    }
  }

  // 1. Check Origin Whitelist
  console.log('[1] Testing CORS & Trusted Origins Whitelist:');
  assert(isOriginAllowed('http://localhost:5173') === true, 'Localhost 5173 is allowed');
  assert(isOriginAllowed('https://web-streak.vercel.app') === true, 'Production Vercel domain is allowed');
  assert(isOriginAllowed('http://localhost:8080') === false, 'Untrusted origin 8080 is blocked');
  assert(isOriginAllowed('https://malicious-attacker.com') === false, 'Malicious attacker domain is blocked');
  assert(isOriginAllowed(undefined) === false, 'Undefined origin is blocked');

  // 2. Check Zod Validators
  console.log('\n[2] Testing Zod Validation Schemas & SQL Sanitization:');
  assert(usernameParamSchema.safeParse('valid_user_123').success === true, 'Valid username accepted');
  assert(usernameParamSchema.safeParse('123starts_with_num').success === false, 'Username starting with number rejected');
  assert(usernameParamSchema.safeParse('sh').success === false, 'Short username (<3 chars) rejected');
  assert(usernameParamSchema.safeParse('way_too_long_username_exceeding_max_characters').success === false, 'Overlong username (>20 chars) rejected');

  assert(createQuestSchema.safeParse({ name: 'Belajar TypeScript', category: 'coding', estimatedMinutes: 45 }).success === true, 'Valid quest payload accepted');
  assert(createQuestSchema.safeParse({ category: 'coding' }).success === false, 'Quest without name/title rejected');
  assert(createQuestSchema.safeParse({ name: 'Test', estimatedMinutes: -5 }).success === false, 'Quest with negative minutes rejected');

  assert(friendRequestSchema.safeParse({ friendId: 'user_abc123' }).success === true, 'Valid friend ID accepted');
  assert(friendRequestSchema.safeParse({ friendId: '' }).success === false, 'Empty friend ID rejected');

  assert(friendRespondSchema.safeParse({ requestId: 'req_1', action: 'accept' }).success === true, 'Action accept accepted');
  assert(friendRespondSchema.safeParse({ requestId: 'req_1', action: 'invalid_action' }).success === false, 'Invalid action rejected');

  const unsafeInput = "test%user_name' OR 1=1\\";
  const sanitized = escapeSqlLike(unsafeInput);
  assert(sanitized.includes('\\%') && sanitized.includes('\\_') && sanitized.includes('\\\\'), 'escapeSqlLike properly escapes SQL wildcard characters');

  // 3. Test HTTP Endpoints via Hono App Request
  console.log('\n[3] Testing HTTP API Endpoints & Auth Guards:');

  // Health check
  const healthRes = await app.request('/api/health');
  assert(healthRes.status === 200, 'GET /api/health returns 200');

  // Protected Route without session -> 401
  const meRes = await app.request('/api/me');
  assert(meRes.status === 401, 'GET /api/me without auth returns 401 Unauthorized');
  const meBody = await meRes.json();
  assert(meBody.error === 'Unauthorized' && !meBody.stack, 'GET /api/me error response contains no stack trace');

  const questsRes = await app.request('/api/quests');
  assert(questsRes.status === 401, 'GET /api/quests without auth returns 401 Unauthorized');

  // Check username validation via API
  const invalidUserRes = await app.request('/api/check-username/123invalid');
  assert(invalidUserRes.status === 400, 'GET /api/check-username/123invalid returns 400 Bad Request');
  const invalidUserBody = await invalidUserRes.json();
  assert(invalidUserBody.available === false, 'Invalid username format returns available: false');

  // Cron endpoint protection
  process.env.CRON_SECRET = 'super-secret-cron-token-999';
  const cronUnauthorized = await app.request('/api/cron/daily', { method: 'POST' });
  assert(cronUnauthorized.status === 401, 'POST /api/cron/daily without secret returns 401 Unauthorized');

  const cronAuthorized = await app.request('/api/cron/daily', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer super-secret-cron-token-999',
    },
  });
  assert(cronAuthorized.status === 200, 'POST /api/cron/daily with valid Bearer token returns 200 OK');

  // Rate Limiting headers
  console.log('\n[4] Testing Rate Limiter Headers:');
  const checkRateLimit = await app.request('/api/check-username/validuser');
  assert(checkRateLimit.headers.has('x-ratelimit-limit'), 'API response includes X-RateLimit-Limit');
  assert(checkRateLimit.headers.has('x-ratelimit-remaining'), 'API response includes X-RateLimit-Remaining');

  console.log(`\n========================================`);
  console.log(`Security Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityChecks().catch((err) => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
