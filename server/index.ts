import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';
import { db } from './db';
import { quests, questCompletions, user, friends, achievements } from './db/schema';
import { eq, desc, and, gte, ilike, or, inArray, gt, lt, isNull } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

type SessionData = Awaited<ReturnType<typeof auth.api.getSession>>;
type Variables = {
  session: NonNullable<SessionData>;
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

import { seedDatabase } from './seed';

// Authentication Routes (Better Auth)
// Intercept sign-in/email to auto-provision test users if not registered yet
app.post('/api/auth/sign-in/email', async (c) => {
  try {
    const rawReq = c.req.raw.clone();
    const body = await c.req.json().catch(() => null);
    if (body && body.email && body.password) {
      const email = body.email.toLowerCase().trim();
      const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
      if (existing.length === 0) {
        try {
          const userName = email.split('@')[0] || 'User';
          const cleanUsername = email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
          await auth.api.signUpEmail({
            body: {
              email: body.email,
              password: body.password,
              name: userName,
            },
            headers: c.req.raw.headers,
          });

          await db.update(user).set({
            username: cleanUsername,
            currentStreak: 3,
            maxStreak: 5,
            totalXp: 120,
          }).where(eq(user.email, body.email)).catch(() => {});
        } catch (e) {
          console.error('Auto-provision user error:', e);
        }
      }
    }
    return auth.handler(rawReq);
  } catch (err) {
    return auth.handler(c.req.raw);
  }
});

app.all('/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});
app.all('/api/auth', (c) => {
  return auth.handler(c.req.raw);
});
app.all('/auth/*', (c) => {
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

// --- USER API ---
app.get('/api/me', requireAuth, async (c) => {
  const session = c.get('session');
  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
    
  if (!currentUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  const userObj = { ...currentUser };
  if (!userObj.username) {
    const fallback = currentUser.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || `user_${currentUser.id.slice(0, 6)}`;
    userObj.username = fallback;
    await db.update(user).set({ username: fallback }).where(eq(user.id, currentUser.id)).catch(() => {});
  }
    
  return c.json(userObj);
});

// --- ONBOARDING API ---

app.get('/api/check-username/:username', async (c) => {
  const username = c.req.param('username').toLowerCase();
  
  if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username)) {
    return c.json({ available: false, error: 'Invalid format' }, 400);
  }

  const existingUser = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  return c.json({ available: existingUser.length === 0 });
});

app.post('/api/onboarding', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  const username = body.username?.toLowerCase();
  
  if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username)) {
    return c.json({ error: 'Format username tidak valid' }, 400);
  }

  try {
    await db
      .update(user)
      .set({ 
        username,
        favoriteCategories: body.favoriteCategories ? JSON.stringify(body.favoriteCategories) : null
      })
      .where(eq(user.id, session.user.id));
      
    return c.json({ success: true });
  } catch (e: any) {
    if (e.code === '23505') { // unique violation
      return c.json({ error: 'Username sudah digunakan' }, 400);
    }
    return c.json({ error: 'Gagal menyimpan data' }, 500);
  }
});

// --- QUOTES / QUESTS API ---

// Update current user profile
app.put('/api/me', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  
  const [existingUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!existingUser) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const newName = body.name !== undefined ? body.name : existingUser.name;
  let newUsername = body.username !== undefined ? body.username : existingUser.username;
  
  // Check if username is taken by someone else
  if (body.username && body.username !== existingUser.username) {
    const conflict = await db.select().from(user).where(eq(user.username, body.username));
    if (conflict.length > 0 && conflict[0].id !== session.user.id) {
      return c.json({ error: 'Username is already taken' }, 400);
    }
  }
  
  const favoriteCategories = body.favoriteCategories !== undefined
    ? (Array.isArray(body.favoriteCategories) ? JSON.stringify(body.favoriteCategories) : body.favoriteCategories)
    : existingUser.favoriteCategories;

  const [updatedUser] = await db
    .update(user)
    .set({
      name: newName,
      username: newUsername,
      favoriteCategories: favoriteCategories
    })
    .where(eq(user.id, session.user.id))
    .returning();
    
  return c.json({
    success: true,
    ...updatedUser,
    user: updatedUser
  });
});

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
  
  const name = body.name || body.title;
  if (!name) {
    return c.json({ error: 'Name is required' }, 400);
  }
  
  const minutes = body.estimatedMinutes ?? body.timeGoalMinutes ?? body.duration;
  const estimatedMinutes = minutes !== undefined && minutes !== null ? parseInt(String(minutes), 10) : null;
  
  const [newQuest] = await db
    .insert(quests)
    .values({
      userId: session.user.id,
      name: name,
      category: body.category || 'coding',
      estimatedMinutes: estimatedMinutes,
    })
    .returning();
    
  return c.json({
    ...newQuest,
    title: newQuest.name,
    timeGoalMinutes: newQuest.estimatedMinutes,
  }, 201);
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

// Edit a quest
app.put('/api/quests/:id', requireAuth, async (c) => {
  const session = c.get('session');
  const id = c.req.param('id') as string;
  const body = await c.req.json();
  
  const name = body.name || body.title;
  if (!name) {
    return c.json({ error: 'Name is required' }, 400);
  }
  
  const minutes = body.estimatedMinutes ?? body.timeGoalMinutes ?? body.duration;
  const estimatedMinutes = minutes !== undefined && minutes !== null ? parseInt(String(minutes), 10) : null;
  
  const [updatedQuest] = await db
    .update(quests)
    .set({
      name: name,
      category: body.category || 'coding',
      estimatedMinutes: estimatedMinutes,
    })
    .where(and(eq(quests.id, id), eq(quests.userId, session.user.id)))
    .returning();
    
  if (!updatedQuest) {
    return c.json({ error: 'Quest not found' }, 404);
  }

  return c.json({
    ...updatedQuest,
    title: updatedQuest.name,
    timeGoalMinutes: updatedQuest.estimatedMinutes,
  });
});

// Get quest completion history
app.get('/api/quests/:id/history', requireAuth, async (c) => {
  const session = c.get('session');
  const id = c.req.param('id') as string;
  
  const history = await db
    .select({
      id: questCompletions.id,
      completedAt: questCompletions.completedAt
    })
    .from(questCompletions)
    .where(
      and(
        eq(questCompletions.questId, id),
        eq(questCompletions.userId, session.user.id)
      )
    )
    .orderBy(desc(questCompletions.completedAt))
    .limit(30);
    
  return c.json(history);
});

// Check/Complete a quest
app.post('/api/quests/:id/check', requireAuth, async (c) => {
  const session = c.get('session');
  const id = c.req.param('id') as string;
  
  // 2. Insert completion log
  await db.insert(questCompletions).values({
    questId: id,
    userId: session.user.id,
  });
  
  // 3. Fetch User Data to update progress
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id));
  
  // 4. Update User XP and Streak
  let xpGained = 10;
  let streakBonus = false;
  let gracePeriodRestored = false;
  let newXp = (userData.totalXp || 0) + 10;
  let newStreak = userData.currentStreak || 0;
  let maxStreak = userData.maxStreak || 0;
  let streakAtRisk = userData.streakAtRisk;
  let gracePeriodUntil = userData.gracePeriodUntil;
  let message = 'Quest completed! +10 XP';
  
  const now = new Date();
  
  if (streakAtRisk && gracePeriodUntil) {
    if (now < gracePeriodUntil) {
      // Restore streak!
      newXp += 20; // +10 base + 20 restore = 30 total added
      xpGained = 30;
      streakAtRisk = false;
      gracePeriodUntil = null;
      gracePeriodRestored = true;
      message = 'Bara dipulihkan! +30 XP';
      // We do not increment newStreak on restore day.
    } else {
      // Grace period expired. Start over.
      newStreak = 1;
      streakAtRisk = false;
      gracePeriodUntil = null;
      message = 'Bara telah padam. Memulai streak baru! +10 XP';
    }
  } else {
    // Normal day
    // Check if this is the first quest of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
        xpGained += 50;
        streakBonus = true;
        message += ' 🎉 7-Day Milestone! +50 XP';
      }
    }
  }
  
  const [updatedUser] = await db
    .update(user)
    .set({
      totalXp: newXp,
      currentStreak: newStreak,
      maxStreak: maxStreak,
      streakAtRisk,
      gracePeriodUntil,
      lastQuestCompletedAt: new Date(),
    })
    .where(eq(user.id, session.user.id))
    .returning();
    
  // 5. Achievement Logic
  const allUserCompletions = await db
    .select({ id: questCompletions.id })
    .from(questCompletions)
    .where(eq(questCompletions.userId, session.user.id));
    
  const totalCompletions = allUserCompletions.length;
  
  const earnedAchievements: string[] = [];
  if (newStreak >= 7) earnedAchievements.push('Week Warrior');
  if (newStreak >= 14) earnedAchievements.push('Fortnight Fighter');
  if (newStreak >= 30) earnedAchievements.push('Monthly Master');
  if (totalCompletions >= 100) earnedAchievements.push('Century Quester');
  if (totalCompletions >= 200) earnedAchievements.push('Quest Legend');
  
  const newAchievements: string[] = [];
  
  if (earnedAchievements.length > 0) {
    // Get existing achievements
    const existingAchs = await db
      .select({ type: achievements.achievementType })
      .from(achievements)
      .where(eq(achievements.userId, session.user.id));
      
    const existingTypes = new Set(existingAchs.map(a => a.type));
    
    // Find new ones
    for (const ach of earnedAchievements) {
      if (!existingTypes.has(ach)) {
        await db.insert(achievements).values({
          userId: session.user.id,
          achievementType: ach
        });
        newAchievements.push(ach);
      }
    }
  }

  if (newAchievements.length > 0) {
    message += ` 🏆 Unlocked: ${newAchievements.join(', ')}`;
  }

  return c.json({
    success: true,
    completed: true,
    xpGained: xpGained,
    streakBonus: streakBonus,
    gracePeriodRestored: gracePeriodRestored,
    newStreak: newStreak,
    totalXp: newXp,
    user: updatedUser,
    message,
    newAchievements
  });
});

app.get('/api/achievements', requireAuth, async (c) => {
  const session = c.get('session');
  
  const userAchievements = await db
    .select()
    .from(achievements)
    .where(eq(achievements.userId, session.user.id))
    .orderBy(desc(achievements.unlockedAt));
    
  return c.json(userAchievements);
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
    
    if (friendIds.length === 0) {
      return c.json({ tab, leaderboard: [], data: [] });
    }
    
    const topUsers = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        currentStreak: user.currentStreak,
        totalXp: user.totalXp,
      })
      .from(user)
      .where(inArray(user.id, friendIds))
      .orderBy(desc(user.currentStreak), desc(user.totalXp))
      .limit(10);
      
    return c.json({
      tab,
      leaderboard: topUsers,
      data: topUsers
    });
  }

  // Global Leaderboard
  const topUsers = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      currentStreak: user.currentStreak,
      totalXp: user.totalXp,
    })
    .from(user)
    .orderBy(desc(user.currentStreak), desc(user.totalXp))
    .limit(10);
    
  return c.json({
    tab,
    leaderboard: topUsers,
    data: topUsers
  });
});

// --- FRIENDS API ---

// Search users by username
app.get('/api/friends/search', requireAuth, async (c) => {
  const q = c.req.query('q');
  const session = c.get('session');
  
  if (!q || q.length < 3) return c.json([]);
  
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      totalXp: user.totalXp
    })
    .from(user)
    .where(
      or(
        ilike(user.username, `%${q}%`),
        ilike(user.name, `%${q}%`)
      )
    )
    .limit(10);
    
  // Filter out current user and existing friends
  const myFriends = await db
    .select()
    .from(friends)
    .where(
      or(
        eq(friends.userId, session.user.id),
        eq(friends.friendId, session.user.id)
      )
    );
    
  const excludeIds = new Set<string>();
  excludeIds.add(session.user.id);
  myFriends.forEach(f => {
    excludeIds.add(f.userId);
    excludeIds.add(f.friendId);
  });
  
  const filtered = users.filter(u => !excludeIds.has(u.id));
  
  if (filtered.length === 0) {
    return c.json({ error: 'Username tidak ditemukan', results: [] });
  }
  
  return c.json(filtered);
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
      
    // Insert reciprocal relationship
    await db.insert(friends).values({
      userId: session.user.id,
      friendId: request.userId, // User who sent the request
      status: 'accepted'
    });
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

  // 1. Users who haven't completed a quest yesterday or earlier -> streak at risk
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

  // 2. Reset streak for users whose grace period has expired
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

  return c.json({
    success: true,
    message: 'Daily reset complete',
    streaksUpdated: 0,
    processed: 0
  });
});

app.get('/api', (c) => c.json({ status: 'ok', message: 'Streak API is running!' }));
app.get('/api/', (c) => c.json({ status: 'ok', message: 'Streak API is running!' }));
app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.get('/', (c) => c.text('Streak API is running!'));

export default app;

import { fileURLToPath } from 'node:url';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (!process.env.VERCEL && isMainModule && process.env.NODE_ENV !== 'test') {
  const port = 3000;
  console.log(`Server is running on port ${port}`);

  const server = serve({
    fetch: app.fetch,
    port
  });

  seedDatabase().catch((e) => console.error('Initial seed error:', e));

  const shutdown = () => {
    try {
      server.close();
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
