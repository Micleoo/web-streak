import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';
import { db } from '../db';
import { user } from '../db/schema';

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

// Mock the better-auth logic (e.g. requireAuth middleware)
// For check-username it doesn't require auth, so it's simple to test directly.

describe('GET /api/check-username/:username', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return available: false for invalid username format', async () => {
    const res = await app.request('/api/check-username/12');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.error).toBe('Invalid format');
  });

  it('should return available: true if username is not taken', async () => {
    // Mock DB to return empty array
    (db as any).limit.mockResolvedValue([]);

    const res = await app.request('/api/check-username/newuser');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
  });

  it('should return available: false if username is taken', async () => {
    // Mock DB to return an existing user
    (db as any).limit.mockResolvedValue([{ id: '1' }]);

    const res = await app.request('/api/check-username/existinguser');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(false);
  });
});
