import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';
import { db } from '../db';
import { isOriginAllowed } from '../auth';

// Mock DB
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// Mock Better Auth session
vi.mock('../auth', async () => {
  const actual = await vi.importActual<any>('../auth');
  return {
    ...actual,
    auth: {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
        signInEmail: vi.fn(),
        signUpEmail: vi.fn(),
        signOut: vi.fn(),
      },
      handler: vi.fn(),
    },
  };
});

describe('Security hardening tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CORS Origin Whitelist', () => {
    it('should allow trusted origins', () => {
      expect(isOriginAllowed('http://localhost:5173')).toBe(true);
      expect(isOriginAllowed('https://web-streak.vercel.app')).toBe(true);
    });

    it('should reject untrusted origins', () => {
      expect(isOriginAllowed('https://malicious-site.com')).toBe(false);
      expect(isOriginAllowed('http://localhost:8080')).toBe(false);
      expect(isOriginAllowed(undefined)).toBe(false);
    });
  });

  describe('Route Authentication Guards', () => {
    it('should reject unauthenticated requests to /api/me with 401', async () => {
      const res = await app.request('/api/me');
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject unauthenticated requests to /api/quests with 401', async () => {
      const res = await app.request('/api/quests');
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should reject invalid username formats', async () => {
      const res = await app.request('/api/check-username/123invalid');
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.available).toBe(false);
    });

    it('should accept valid username format', async () => {
      (db as any).limit.mockResolvedValue([]);
      const res = await app.request('/api/check-username/valid_user');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.available).toBe(true);
    });
  });

  describe('Cron Endpoint Protection', () => {
    it('should reject /api/cron/daily without valid secret', async () => {
      const prevSecret = process.env.CRON_SECRET;
      process.env.CRON_SECRET = 'test-secret-12345';
      
      const res = await app.request('/api/cron/daily', {
        method: 'POST',
      });
      expect(res.status).toBe(401);

      process.env.CRON_SECRET = prevSecret;
    });

    it('should allow /api/cron/daily with valid Bearer token', async () => {
      const prevSecret = process.env.CRON_SECRET;
      process.env.CRON_SECRET = 'test-secret-12345';
      (db as any).where.mockResolvedValue([]);

      const res = await app.request('/api/cron/daily', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-secret-12345',
        },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      process.env.CRON_SECRET = prevSecret;
    });
  });
});
