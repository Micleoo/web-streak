import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth, isOriginAllowed } from './auth';
import { db } from './db';
import { quests, questCompletions, user, friends, achievements } from './db/schema';
import { eq, desc, and, gte, ilike, or, inArray, gt, lt, isNull, sql, isNotNull } from 'drizzle-orm';
import dotenv from 'dotenv';
import { sendPushNotification } from './services/reminder.service';
import {
  usernameParamSchema,
  onboardingSchema,
  updateProfileSchema,
  createQuestSchema,
  updateQuestSchema,
  friendRequestSchema,
  friendRespondSchema,
  escapeSqlLike,
} from './validators';
import { createRateLimiter } from './rate-limiter';
import { seedDatabase } from './seed';

dotenv.config();

type SessionData = Awaited<ReturnType<typeof auth.api.getSession>>;
type Variables = {
  session: NonNullable<SessionData>;
};

const app = new Hono<{ Variables: Variables }>();

// 1. Structured HTTP Request Logging
app.use('*', logger());

// 2. Strict CORS Configuration (Only allowed origins)
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return 'http://localhost:5173';
    return isOriginAllowed(origin) ? origin : null;
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));

// 3. Rate Limiters
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Terlalu banyak permintaan API. Silakan coba lagi nanti.',
});

const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Terlalu banyak percobaan autentikasi. Silakan tunggu 1 menit.',
});

app.use('/api/*', apiLimiter);
app.use('/api/auth/sign-in/*', authLimiter);
app.use('/api/auth/sign-up/*', authLimiter);

// --- Authentication Routes (Better Auth) ---

app.post('/api/auth/sign-in/email', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    if (!body?.email || !body?.password) {
      return c.json({ error: 'Email dan password wajib diisi' }, 400);
    }

    const response = await auth.api.signInEmail({
      body: {
        email: body.email.toLowerCase().trim(),
        password: body.password,
      },
      headers: c.req.raw.headers,
      asResponse: true,
    });
    return response;
  } catch (err: any) {
    console.error('Sign-in error:', err?.message || err);
    return c.json({
      error: 'Email atau password salah',
    }, 401);
  }
});

app.post('/api/auth/sign-up/email', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    if (!body?.email || !body?.password) {
      return c.json({ error: 'Email dan password wajib diisi' }, 400);
    }

    if (typeof body.password !== 'string' || body.password.length < 6) {
      return c.json({ error: 'Password minimal 6 karakter' }, 400);
    }

    const name = (body.name || body.email.split('@')[0] || 'User').trim().slice(0, 100);
    const cleanUsername = (body.username || body.email.split('@')[0] || `user_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 20);

    const response = await auth.api.signUpEmail({
      body: {
        email: body.email.toLowerCase().trim(),
        password: body.password,
        name,
      },
      headers: c.req.raw.headers,
      asResponse: true,
    });

    await db.update(user).set({
      username: cleanUsername,
      currentStreak: 0,
      maxStreak: 0,
      totalXp: 0,
    }).where(eq(user.email, body.email.toLowerCase().trim())).catch(() => {});

    return response;
  } catch (err: any) {
    console.error('Sign-up error:', err?.message || err);
    return c.json({ error: err?.message || 'Pendaftaran gagal' }, 400);
  }
});

app.post('/api/auth/sign-out', async (c) => {
  try {
    const response = await auth.api.signOut({
      headers: c.req.raw.headers,
      asResponse: true,
    });
    return response;
  } catch (err: any) {
    console.error('Sign-out error:', err?.message || err);
    return c.json({ success: true });
  }
});

app.get('/api/auth/get-session', async (c) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    return c.json(session || null);
  } catch (err: any) {
    return c.json(null);
  }
});

app.get('/api/auth/session', async (c) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    return c.json(session || null);
  } catch (err: any) {
    return c.json(null);
  }
});

app.post('/api/auth/sign-in/social', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const response = await auth.api.signInSocial({
      body: {
        provider: body.provider,
        callbackURL: body.callbackURL || '/dashboard',
        errorCallbackURL: body.errorCallbackURL,
        newUserCallbackURL: body.newUserCallbackURL,
      },
      headers: c.req.raw.headers,
      asResponse: true,
    });
    return response;
  } catch (err: any) {
    console.error('Sign-in social error:', err?.message || err);
    return c.json({ error: 'Social sign-in failed' }, 500);
  }
});

app.get('/api/auth/callback/:provider', async (c) => {
  try {
    const response = await auth.api.callbackOAuth({
      params: {
        id: c.req.param('provider'),
      },
      query: c.req.query(),
      headers: c.req.raw.headers,
      asResponse: true,
    });
    return response;
  } catch (err: any) {
    console.error('OAuth callback error:', err?.message || err);
    return c.redirect('/login?error=' + encodeURIComponent('OAuth callback failed'));
  }
});

app.all('/api/auth/*', (c) => auth.handler(c.req.raw));
app.all('/api/auth', (c) => auth.handler(c.req.raw));
app.all('/auth/*', (c) => auth.handler(c.req.raw));

import type { Context, Next } from 'hono';

// Middleware to get and verify user session
const requireAuth = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session || !session.user?.id) {
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

// Update current user profile
app.put('/api/me', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  
  const parseResult = updateProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || 'Input tidak valid' }, 400);
  }

  const data = parseResult.data;
  const [existingUser] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!existingUser) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const newName = data.name !== undefined ? data.name : existingUser.name;
  const newUsername = data.username !== undefined ? data.username.toLowerCase() : existingUser.username;
  
  // Check if username is taken by someone else
  if (data.username && data.username.toLowerCase() !== existingUser.username) {
    const targetUsername = data.username.toLowerCase();
    const conflict = await db.select().from(user).where(eq(user.username, targetUsername));
    if (conflict.length > 0 && conflict[0].id !== session.user.id) {
      return c.json({ error: 'Username is already taken' }, 400);
    }
  }
  
  const favoriteCategories = data.favoriteCategories !== undefined
    ? (Array.isArray(data.favoriteCategories) ? JSON.stringify(data.favoriteCategories) : data.favoriteCategories)
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

// --- ONBOARDING API ---

app.get('/api/check-username/:username', async (c) => {
  const rawUsername = c.req.param('username');
  const parseResult = usernameParamSchema.safeParse(rawUsername);
  
  if (!parseResult.success) {
    return c.json({ available: false, error: 'Invalid format' }, 400);
  }

  const username = parseResult.data.toLowerCase();
  const existingUser = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  return c.json({ available: existingUser.length === 0 });
});

app.post('/api/onboarding', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  
  const parseResult = onboardingSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || 'Input tidak valid' }, 400);
  }

  const { username, favoriteCategories } = parseResult.data;
  const cleanUsername = username.toLowerCase();

  try {
    await db
      .update(user)
      .set({ 
        username: cleanUsername,
        favoriteCategories: favoriteCategories ? JSON.stringify(favoriteCategories) : null,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date()
      })
      .where(eq(user.id, session.user.id));
      
    return c.json({ success: true });
  } catch (e: any) {
    if (e?.code === '23505') {
      return c.json({ error: 'Username sudah digunakan' }, 400);
    }
    console.error('Onboarding update error:', e?.message || e);
    return c.json({ error: 'Gagal menyimpan data' }, 500);
  }
});

// --- QUESTS API ---

// Get all quests for current user
app.get('/api/quests', requireAuth, async (c) => {
  const session = c.get('session');
  
  const userQuests = await db
    .select()
    .from(quests)
    .where(eq(quests.userId, session.user.id))
    .orderBy(quests.createdAt);
    
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
  const body = await c.req.json().catch(() => ({}));
  
  const parseResult = createQuestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || 'Input quest tidak valid' }, 400);
  }

  const { name, title, category, estimatedMinutes, timeGoalMinutes, duration } = parseResult.data;
  const questName = (name || title) as string;
  const minutes = estimatedMinutes ?? timeGoalMinutes ?? duration ?? null;
  
  const [newQuest] = await db
    .insert(quests)
    .values({
      userId: session.user.id,
      name: questName,
      category: category || 'coding',
      estimatedMinutes: minutes,
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
  const body = await c.req.json().catch(() => ({}));
  
  const parseResult = updateQuestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || 'Input quest tidak valid' }, 400);
  }

  const { name, title, category, estimatedMinutes, timeGoalMinutes, duration } = parseResult.data;
  const questName = (name || title) as string;
  const minutes = estimatedMinutes ?? timeGoalMinutes ?? duration ?? null;
  
  const [updatedQuest] = await db
    .update(quests)
    .set({
      name: questName,
      category: category || 'coding',
      estimatedMinutes: minutes,
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
  
  // Verify quest exists and belongs to user
  const [targetQuest] = await db
    .select()
    .from(quests)
    .where(and(eq(quests.id, id), eq(quests.userId, session.user.id)))
    .limit(1);

  if (!targetQuest) {
    return c.json({ error: 'Quest not found' }, 404);
  }

  // Insert completion log
  await db.insert(questCompletions).values({
    questId: id,
    userId: session.user.id,
  });
  
  // Fetch User Data to update progress
  const [userData] = await db.select().from(user).where(eq(user.id, session.user.id));
  
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
      newXp += 20;
      xpGained = 30;
      streakAtRisk = false;
      gracePeriodUntil = null;
      gracePeriodRestored = true;
      message = 'Bara dipulihkan! +30 XP';
    } else {
      newStreak = 1;
      streakAtRisk = false;
      gracePeriodUntil = null;
      message = 'Bara telah padam. Memulai streak baru! +10 XP';
    }
  } else {
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
      
    if (completionsToday.length === 1) {
      newStreak += 1;
      if (newStreak > maxStreak) {
        maxStreak = newStreak;
      }
      
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
    
  // Achievement Logic
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
    const existingAchs = await db
      .select({ type: achievements.achievementType })
      .from(achievements)
      .where(eq(achievements.userId, session.user.id));
      
    const existingTypes = new Set(existingAchs.map(a => a.type));
    
    for (const ach of earnedAchievements) {
      if (!existingTypes.has(ach)) {
        await db.insert(achievements).values({
          userId: session.user.id,
          achievementType: ach
        });
        newAchievements.push(ach);
        
        // Push notification for achievement
        await sendPushNotification(session.user.id, {
          title: '🏆 Achievement Unlocked!',
          body: `Selamat! Kamu mendapatkan achievement: ${ach}`,
          tag: `ach-${ach}`
        });
      }
    }
  }

  if (newAchievements.length > 0) {
    message += ` 🏆 Unlocked: ${newAchievements.join(', ')}`;
  }

  return c.json({
    success: true,
    completed: true,
    xpGained,
    streakBonus,
    gracePeriodRestored,
    newStreak,
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
    const userFriends = await db
      .select()
      .from(friends)
      .where(
        and(
          or(eq(friends.userId, session.user.id), eq(friends.friendId, session.user.id)),
          eq(friends.status, 'accepted')
        )
      );
      
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
  const rawQ = c.req.query('q');
  const session = c.get('session');
  
  if (!rawQ || typeof rawQ !== 'string' || rawQ.trim().length < 3) {
    return c.json([]);
  }

  const q = rawQ.trim().slice(0, 50);
  const safeQ = escapeSqlLike(q);
  
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
        ilike(user.username, `%${safeQ}%`),
        ilike(user.name, `%${safeQ}%`)
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
  const body = await c.req.json().catch(() => ({}));
  
  const parseResult = friendRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || 'Invalid friend ID' }, 400);
  }

  const { friendId } = parseResult.data;
  
  if (friendId === session.user.id) {
    return c.json({ error: 'Cannot send friend request to yourself' }, 400);
  }
  
  // Check if target friend user exists
  const [targetUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, friendId)).limit(1);
  if (!targetUser) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  // Check if relationship already exists
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

// Respond to a friend request
app.post('/api/friends/respond', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  
  const parseResult = friendRespondSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || 'Invalid payload' }, 400);
  }

  const { requestId, action } = parseResult.data;
  
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
      
    await db.insert(friends).values({
      userId: session.user.id,
      friendId: request.userId,
      status: 'accepted'
    });
  } else if (action === 'reject') {
    await db.delete(friends)
      .where(eq(friends.id, requestId));
  }
  
  return c.json({ success: true });
});

// --- NOTIFICATIONS API ---
app.post('/api/notifications/subscribe', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  
  if (!body.subscription) {
    return c.json({ error: 'Subscription missing' }, 400);
  }

  await db
    .update(user)
    .set({ 
      pushSubscription: body.subscription,
      notificationEnabled: true
    })
    .where(eq(user.id, session.user.id));
    
  return c.json({ success: true });
});

app.patch('/api/users/notification-enabled', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  
  await db
    .update(user)
    .set({ 
      notificationEnabled: body.notificationEnabled
    })
    .where(eq(user.id, session.user.id));
    
  return c.json({ success: true });
});

// --- CRON JOBS (Secured with CRON_SECRET) ---
app.post('/api/cron/daily', async (c) => {
  const authHeader = c.req.header('authorization');
  const vercelCronHeader = c.req.header('x-vercel-cron');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = 
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && vercelCronHeader === cronSecret) ||
    (!cronSecret && process.env.NODE_ENV === 'development');

  if (!isAuthorized) {
    return c.json({ error: 'Unauthorized: Missing or invalid CRON_SECRET' }, 401);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Users who haven't completed a quest yesterday or earlier -> streak at risk
  await db.update(user).set({
    streakAtRisk: true,
    gracePeriodUntil: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
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
  });
});

app.get('/api/cron/daily-reminder', async (c) => {
  const authHeader = c.req.header('authorization');
  const vercelCronHeader = c.req.header('x-vercel-cron');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = 
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && vercelCronHeader === cronSecret) ||
    (!cronSecret && process.env.NODE_ENV === 'development');

  if (!isAuthorized) {
    return c.json({ error: 'Unauthorized: Missing or invalid CRON_SECRET' }, 401);
  }

  try {
    console.log('[daily-reminder] Starting reminder cron...');

    const activeUsers = await db
      .select()
      .from(user)
      .where(and(eq(user.notificationEnabled, true), isNotNull(user.pushSubscription)));

    let successCount = 0;
    
    for (const u of activeUsers) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const allUserQuests = await db
        .select()
        .from(quests)
        .where(eq(quests.userId, u.id));
        
      if (allUserQuests.length === 0) continue;
      
      const completionsToday = await db
        .select()
        .from(questCompletions)
        .where(
          and(
            eq(questCompletions.userId, u.id),
            gte(questCompletions.completedAt, today)
          )
        );
        
      const pendingCount = allUserQuests.length - completionsToday.length;
      
      if (pendingCount > 0) {
        const messageBody = pendingCount === 1
          ? `Ada 1 quest yang belum selesai! Selesaikan sebelum jam 23:59 untuk menjaga Bara tetap menyala 🔥`
          : `Masih ada ${pendingCount} quest hari ini! Jangan biarkan Bara-mu padam 🔥`;

        await sendPushNotification(u.id, {
          title: 'Waktunya Quest!',
          body: messageBody,
          tag: 'daily-reminder',
          data: {
            url: '/dashboard',
            pendingCount
          }
        });
        
        successCount++;
        
        await db
          .update(user)
          .set({ lastReminderSentAt: new Date() })
          .where(eq(user.id, u.id));
      }
    }

    return c.json({ success: true, sent: successCount });
  } catch (err: any) {
    console.error('Cron error:', err);
    return c.json({ error: 'Internal error' }, 500);
  }
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

  // Only run automatic database seed if explicitly requested in development
  if (process.env.NODE_ENV === 'development' && process.env.AUTO_SEED === 'true') {
    seedDatabase().catch((e) => console.error('Initial seed error:', e));
  }

  const shutdown = () => {
    try {
      server.close();
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
