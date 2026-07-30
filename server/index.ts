import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';
import { db } from './db';
import { quests, questCompletions, user, friends } from './db/schema';
import { eq, desc, and, gte, ilike, or, inArray, gt, lt, isNull } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

type SessionData = Awaited<ReturnType<typeof auth.api.getSession>>;
type Variables = {
  session: NonNullable<SessionData>;
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', cors());

// Authentication Routes (Better Auth)
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

import type { Context, Next } from 'hono';

// Middleware to get user session
const requireAuth = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('session', session);
  await next();
};

// --- QUOTES / QUESTS API ---

// Get all quests for current user
app.get('/api/quests', requireAuth, async (c) => {
  const session = c.get('session');
  
  const userQuests = await db
    .select()
    .from(quests)
    .where(eq(quests.userId, session.user.id))
    .orderBy(quests.createdAt);
    
  // Also get completions for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completions = await db
    .select()
    .from(questCompletions)
    .where(
      and(
        eq(questCompletions.userId, session.user.id),
        gte(questCompletions.completedAt, today)
      )
    );
    
  return c.json({ 
    quests: userQuests,
    completedIds: completions.map(c => c.questId)
  });
});

// Create a new quest
app.post('/api/quests', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  
  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400);
  }
  
  const [newQuest] = await db
    .insert(quests)
    .values({
      userId: session.user.id,
      name: body.name,
      category: body.category || 'coding',
    })
    .returning();
    
  return c.json(newQuest);
});

// Delete a quest
app.delete('/api/quests/:id', requireAuth, async (c) => {
  const session = c.get('session');
  const id = c.req.param('id') as string;
  
  await db
    .delete(quests)
    .where(and(eq(quests.id, id), eq(quests.userId, session.user.id)));
    
  return c.json({ success: true });
});

// Check/Complete a quest
app.post('/api/quests/:id/check', requireAuth, async (c) => {
  const session = c.get('session');
  const id = c.req.param('id') as string;
  
  // 1. Check if already completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existing = await db
    .select()
    .from(questCompletions)
    .where(
      and(
        eq(questCompletions.questId, id),
        eq(questCompletions.userId, session.user.id),
        gte(questCompletions.completedAt, today)
      )
    );
    
  if (existing.length > 0) {
    return c.json({ error: 'Already completed today' }, 400);
  }
  
  // 2. Fetch User Data to check API slots
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id));
  
  if (userData.regularApi <= 0 && userData.bonusApi <= 0) {
    return c.json({ error: 'No API slots remaining today' }, 400);
  }

  let regularApi = userData.regularApi;
  let bonusApi = userData.bonusApi;
  if (regularApi > 0) {
    regularApi -= 1;
  } else {
    bonusApi -= 1;
  }

  // 3. Insert completion log
  await db.insert(questCompletions).values({
    questId: id,
    userId: session.user.id,
  });
  
  // 4. Update User XP and Streak
  let newXp = (userData.totalXp || 0) + 10;
  let newStreak = userData.currentStreak || 0;
  let maxStreak = userData.maxStreak || 0;
  let streakAtRisk = userData.streakAtRisk;
  let gracePeriodUntil = userData.gracePeriodUntil;
  let message = 'Quest completed! +10 XP';

  if (streakAtRisk) {
    // Restore streak!
    newXp += 20; // +10 base + 20 restore = 30 total added
    streakAtRisk = false;
    gracePeriodUntil = null;
    message = 'Streak restored! +30 XP';
  }
  
  // Check if this is the first quest of the day
  const completionsToday = await db
    .select()
    .from(questCompletions)
    .where(
      and(
        eq(questCompletions.userId, session.user.id),
        gte(questCompletions.completedAt, today)
      )
    );
    
  if (completionsToday.length === 1) { // includes the one we just inserted
    newStreak += 1;
    if (newStreak > maxStreak) {
      maxStreak = newStreak;
    }
    
    // Check 7-day milestone
    if (newStreak > 0 && newStreak % 7 === 0) {
      newXp += 50;
      bonusApi += 3;
      message += ' 🎉 7-Day Milestone! +50 XP & +3 Bonus API';
    }
  }
  
  const [updatedUser] = await db
    .update(user)
    .set({
      totalXp: newXp,
      currentStreak: newStreak,
      maxStreak: maxStreak,
      regularApi,
      bonusApi,
      streakAtRisk,
      gracePeriodUntil,
      lastQuestCompletedAt: new Date(),
    })
    .where(eq(user.id, session.user.id))
    .returning();
    
  return c.json({ success: true, user: updatedUser, message });
});

// --- LEADERBOARD API ---
app.get('/api/leaderboard', requireAuth, async (c) => {
  const session = c.get('session');
  const tab = c.req.query('tab') || 'global';
  
  if (tab === 'friends') {
    // Get all accepted friends
    const userFriends = await db
      .select()
      .from(friends)
      .where(
        and(
          or(eq(friends.userId, session.user.id), eq(friends.friendId, session.user.id)),
          eq(friends.status, 'accepted')
        )
      );
      
    // Include the user themselves in their friends leaderboard
    const friendIds = userFriends.map(f => f.userId === session.user.id ? f.friendId : f.userId);
    friendIds.push(session.user.id);
    
    if (friendIds.length === 0) return c.json([]);
    
    const topUsers = await db
      .select({
        id: user.id,
        name: user.name,
        currentStreak: user.currentStreak,
        totalXp: user.totalXp,
      })
      .from(user)
      .where(inArray(user.id, friendIds))
      .orderBy(desc(user.currentStreak), desc(user.totalXp))
      .limit(10);
      
    return c.json(topUsers);
  }

  // Global Leaderboard
  const topUsers = await db
    .select({
      id: user.id,
      name: user.name,
      currentStreak: user.currentStreak,
      totalXp: user.totalXp,
    })
    .from(user)
    .orderBy(desc(user.currentStreak), desc(user.totalXp))
    .limit(10);
    
  return c.json(topUsers);
});

// --- FRIENDS API ---

// Search users by username (name)
app.get('/api/friends/search', requireAuth, async (c) => {
  const q = c.req.query('q');
  const session = c.get('session');
  
  if (!q || q.length < 3) return c.json([]);
  
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      totalXp: user.totalXp
    })
    .from(user)
    .where(
      and(
        ilike(user.name, `%${q}%`),
        // don't search yourself
        // wait, we can't use notEq easily without importing it, so let's just filter it out in memory or use sql
      )
    )
    .limit(5);
    
  // Filter out current user
  return c.json(users.filter(u => u.id !== session.user.id));
});

// Send a friend request
app.post('/api/friends/request', requireAuth, async (c) => {
  const session = c.get('session');
  const { friendId } = await c.req.json();
  
  if (!friendId || friendId === session.user.id) {
    return c.json({ error: 'Invalid friend ID' }, 400);
  }
  
  // Check if request already exists
  const existing = await db
    .select()
    .from(friends)
    .where(
      or(
        and(eq(friends.userId, session.user.id), eq(friends.friendId, friendId)),
        and(eq(friends.userId, friendId), eq(friends.friendId, session.user.id))
      )
    );
    
  if (existing.length > 0) {
    return c.json({ error: 'Relationship already exists' }, 400);
  }
  
  await db.insert(friends).values({
    userId: session.user.id,
    friendId: friendId,
    status: 'pending'
  });
  
  return c.json({ success: true });
});

// View pending requests
app.get('/api/friends/requests', requireAuth, async (c) => {
  const session = c.get('session');
  
  // Requests where friendId is ME and status is pending
  const incoming = await db
    .select({
      requestId: friends.id,
      userId: user.id,
      name: user.name,
      createdAt: friends.createdAt
    })
    .from(friends)
    .innerJoin(user, eq(user.id, friends.userId))
    .where(
      and(
        eq(friends.friendId, session.user.id),
        eq(friends.status, 'pending')
      )
    );
    
  return c.json(incoming);
});

// Respond to a request
app.post('/api/friends/respond', requireAuth, async (c) => {
  const session = c.get('session');
  const { requestId, action } = await c.req.json(); // action: 'accept' or 'reject'
  
  // Ensure the request belongs to me
  const [request] = await db
    .select()
    .from(friends)
    .where(
      and(
        eq(friends.id, requestId),
        eq(friends.friendId, session.user.id),
        eq(friends.status, 'pending')
      )
    );
    
  if (!request) return c.json({ error: 'Request not found' }, 404);
  
  if (action === 'accept') {
    await db.update(friends)
      .set({ status: 'accepted' })
      .where(eq(friends.id, requestId));
  } else if (action === 'reject') {
    await db.delete(friends)
      .where(eq(friends.id, requestId));
  }
  
  return c.json({ success: true });
});

// --- CRON JOBS ---
app.post('/api/cron/daily', async (c) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Reset regular API for all users
  await db.update(user).set({ regularApi: 3, lastApiResetAt: new Date() });

  // 2. Users who haven't completed a quest yesterday or earlier -> streak at risk
  await db.update(user).set({
    streakAtRisk: true,
    gracePeriodUntil: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
  }).where(
    and(
      gt(user.currentStreak, 0),
      eq(user.streakAtRisk, false),
      or(
        isNull(user.lastQuestCompletedAt),
        lt(user.lastQuestCompletedAt, today)
      )
    )
  );

  // 3. Reset streak for users whose grace period has expired
  await db.update(user).set({
    currentStreak: 0,
    streakAtRisk: false,
    gracePeriodUntil: null
  }).where(
    and(
      eq(user.streakAtRisk, true),
      lt(user.gracePeriodUntil, new Date())
    )
  );

  return c.json({ success: true, message: 'Daily reset complete' });
});

app.get('/', (c) => c.text('Streak API is running!'));

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
