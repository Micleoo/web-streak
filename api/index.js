var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/api-entry.ts
import { getRequestListener } from "@hono/node-server";

// server/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

// server/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// server/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  account: () => account,
  achievements: () => achievements,
  friends: () => friends,
  questCompletions: () => questCompletions,
  quests: () => quests,
  session: () => session,
  user: () => user,
  verification: () => verification
});
import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
var user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  // Custom fields for Streak App
  username: text("username").unique(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  maxStreak: integer("maxStreak").default(0).notNull(),
  totalXp: integer("totalXp").default(0).notNull(),
  favoriteCategories: text("favoriteCategories"),
  // store as JSON string
  lastQuestCompletedAt: timestamp("lastQuestCompletedAt"),
  // Gamification fields
  streakAtRisk: boolean("streakAtRisk").default(false).notNull(),
  gracePeriodUntil: timestamp("gracePeriodUntil")
});
var session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull()
});
var account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull()
});
var verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt")
});
var quests = pgTable("quests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  category: text("category").default("coding").notNull(),
  estimatedMinutes: integer("estimatedMinutes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var questCompletions = pgTable("quest_completions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  questId: text("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id),
  completedAt: timestamp("completed_at").defaultNow().notNull()
});
var friends = pgTable("friends", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  friendId: text("friend_id").notNull().references(() => user.id),
  status: text("status").default("pending").notNull(),
  // 'pending', 'accepted'
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var achievements = pgTable("achievements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  achievementType: text("achievementType").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull()
});

// server/db/index.ts
import dotenv from "dotenv";
dotenv.config();
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env file");
}
var client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: process.env.VERCEL ? 1 : 10
});
var db = drizzle(client, { schema: schema_exports });

// server/auth.ts
var getTrustedOrigins = (request) => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://web-streak.vercel.app"
  ];
  if (process.env.APP_URL) {
    origins.push(process.env.APP_URL.replace(/\/+$/, ""));
  }
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`);
  }
  if (process.env.BETTER_AUTH_URL) {
    try {
      const url = process.env.BETTER_AUTH_URL.startsWith("http") ? process.env.BETTER_AUTH_URL : `https://${process.env.BETTER_AUTH_URL}`;
      origins.push(new URL(url).origin);
    } catch {
    }
  }
  if (request) {
    const origin = request.headers.get("origin");
    if (origin) origins.push(origin);
  }
  return [...new Set(origins)];
};
var getBaseURL = () => {
  let url = process.env.BETTER_AUTH_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : void 0);
  if (!url) {
    return process.env.NODE_ENV === "production" ? void 0 : "http://localhost:5173/api/auth";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  if (!url.endsWith("/api/auth")) {
    url = `${url.replace(/\/+$/, "")}/api/auth`;
  }
  return url;
};
var baseURL = getBaseURL();
var auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-streak-app-dev-only",
  baseURL,
  trustedOrigins: getTrustedOrigins,
  rateLimit: {
    enabled: false
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    // Use PostgreSQL
    schema: schema_exports
  }),
  emailAndPassword: {
    enabled: true
  }
});

// server/index.ts
import { eq as eq2, desc, and as and2, gte, ilike, or, inArray, gt, lt, isNull } from "drizzle-orm";
import dotenv2 from "dotenv";

// server/seed.ts
import { eq, and } from "drizzle-orm";
async function seedDatabase() {
  try {
    console.log("\u{1F331} Checking / Seeding demo and test users...");
    const demoEmail = "example@gmail.com";
    const demoPass = "password123";
    let demoUserRecord = (await db.select().from(user).where(eq(user.email, demoEmail)))[0];
    if (!demoUserRecord) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: demoEmail,
            password: demoPass,
            name: "Demo User"
          }
        });
        demoUserRecord = (await db.select().from(user).where(eq(user.email, demoEmail)))[0];
      } catch (err) {
        console.log("SignUp error for demo user:", err);
      }
    }
    if (demoUserRecord) {
      await db.update(user).set({
        name: "Demo User",
        username: "demouser",
        currentStreak: 5,
        maxStreak: 10,
        totalXp: 250,
        favoriteCategories: JSON.stringify(["coding", "learning", "fitness"]),
        streakAtRisk: false
      }).where(eq(user.id, demoUserRecord.id));
      const existingQuests = await db.select().from(quests).where(eq(quests.userId, demoUserRecord.id));
      if (existingQuests.length === 0) {
        await db.insert(quests).values([
          {
            userId: demoUserRecord.id,
            name: "Review TypeScript code",
            category: "coding",
            estimatedMinutes: 20
          },
          {
            userId: demoUserRecord.id,
            name: "Read documentation",
            category: "learning",
            estimatedMinutes: 15
          },
          {
            userId: demoUserRecord.id,
            name: "Daily Workout & Stretch",
            category: "fitness",
            estimatedMinutes: 30
          }
        ]);
      }
    }
    const testEmail = "testuser@example.com";
    const testPass = "Password123!";
    let testUserRecord = (await db.select().from(user).where(eq(user.email, testEmail)))[0];
    if (!testUserRecord) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: testEmail,
            password: testPass,
            name: "Test User"
          }
        });
        testUserRecord = (await db.select().from(user).where(eq(user.email, testEmail)))[0];
      } catch (err) {
        console.log("SignUp error for test user:", err);
      }
    }
    if (testUserRecord) {
      await db.update(user).set({
        name: "Test User",
        username: "testuser",
        currentStreak: 3,
        maxStreak: 7,
        totalXp: 150,
        favoriteCategories: JSON.stringify(["coding", "health"]),
        streakAtRisk: false
      }).where(eq(user.id, testUserRecord.id));
      const existingTestQuests = await db.select().from(quests).where(eq(quests.userId, testUserRecord.id));
      if (existingTestQuests.length === 0) {
        await db.insert(quests).values([
          {
            userId: testUserRecord.id,
            name: "Morning Routine & Quests",
            category: "health",
            estimatedMinutes: 15
          },
          {
            userId: testUserRecord.id,
            name: "Solve Streak challenge",
            category: "coding",
            estimatedMinutes: 25
          }
        ]);
      }
    }
    const sampleUsers = [
      { name: "Alex Coder", email: "alex@example.com", username: "alex_coder", streak: 15, xp: 980 },
      { name: "Sarah Flame", email: "sarah@example.com", username: "sarah_flame", streak: 12, xp: 750 },
      { name: "Michael SF", email: "michael@example.com", username: "michael_sf", streak: 8, xp: 520 }
    ];
    for (const sample of sampleUsers) {
      let [rec] = await db.select().from(user).where(eq(user.email, sample.email)).limit(1);
      if (!rec) {
        try {
          await auth.api.signUpEmail({
            body: {
              email: sample.email,
              password: "Password123!",
              name: sample.name
            }
          });
          const [created] = await db.select().from(user).where(eq(user.email, sample.email)).limit(1);
          rec = created;
        } catch (e) {
          const [found] = await db.select().from(user).where(eq(user.email, sample.email)).limit(1);
          rec = found;
        }
      }
      if (rec) {
        await db.update(user).set({
          name: sample.name,
          username: sample.username,
          currentStreak: sample.streak,
          maxStreak: sample.streak + 5,
          totalXp: sample.xp
        }).where(eq(user.id, rec.id));
        if (demoUserRecord && demoUserRecord.id !== rec.id) {
          const friendExists = await db.select().from(friends).where(
            and(eq(friends.userId, demoUserRecord.id), eq(friends.friendId, rec.id))
          );
          if (friendExists.length === 0) {
            await db.insert(friends).values({
              userId: demoUserRecord.id,
              friendId: rec.id,
              status: "accepted"
            });
          }
        }
      }
    }
    console.log("\u2705 Seed completed successfully!");
  } catch (error) {
    console.error("Error during database seed:", error);
  }
}

// server/index.ts
import { fileURLToPath } from "node:url";
dotenv2.config();
var app = new Hono();
app.use("*", cors({
  origin: (origin) => origin || "*",
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
}));
app.post("/api/auth/sign-in/email", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    const reqUrl = c.req.header("x-forwarded-proto") === "https" || process.env.VERCEL ? c.req.raw.url.replace(/^http:/, "https:") : c.req.raw.url;
    if (body && body.email && body.password) {
      const email = body.email.toLowerCase().trim();
      const existing = await db.select().from(user).where(eq2(user.email, email)).limit(1);
      if (existing.length === 0) {
        try {
          const userName = email.split("@")[0] || "User";
          const cleanUsername = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "") || `user_${Date.now().toString().slice(-4)}`;
          await auth.api.signUpEmail({
            body: {
              email: body.email,
              password: body.password,
              name: userName
            },
            headers: c.req.raw.headers
          });
          await db.update(user).set({
            username: cleanUsername,
            currentStreak: 3,
            maxStreak: 5,
            totalXp: 120
          }).where(eq2(user.email, body.email)).catch(() => {
          });
        } catch (e) {
          console.error("Auto-provision user error:", e);
        }
      }
      const freshReq2 = new Request(reqUrl, {
        method: c.req.raw.method,
        headers: c.req.raw.headers,
        body: JSON.stringify(body)
      });
      return auth.handler(freshReq2);
    }
    const freshReq = reqUrl !== c.req.raw.url ? new Request(reqUrl, c.req.raw) : c.req.raw;
    return auth.handler(freshReq);
  } catch (err) {
    return auth.handler(c.req.raw);
  }
});
app.all("/api/auth/*", (c) => {
  const reqUrl = c.req.header("x-forwarded-proto") === "https" || process.env.VERCEL ? c.req.raw.url.replace(/^http:/, "https:") : c.req.raw.url;
  const targetReq = reqUrl !== c.req.raw.url ? new Request(reqUrl, c.req.raw) : c.req.raw;
  return auth.handler(targetReq);
});
app.all("/api/auth", (c) => {
  const reqUrl = c.req.header("x-forwarded-proto") === "https" || process.env.VERCEL ? c.req.raw.url.replace(/^http:/, "https:") : c.req.raw.url;
  const targetReq = reqUrl !== c.req.raw.url ? new Request(reqUrl, c.req.raw) : c.req.raw;
  return auth.handler(targetReq);
});
app.all("/auth/*", (c) => {
  const reqUrl = c.req.header("x-forwarded-proto") === "https" || process.env.VERCEL ? c.req.raw.url.replace(/^http:/, "https:") : c.req.raw.url;
  const targetReq = reqUrl !== c.req.raw.url ? new Request(reqUrl, c.req.raw) : c.req.raw;
  return auth.handler(targetReq);
});
var requireAuth = async (c, next) => {
  const session2 = await auth.api.getSession({
    headers: c.req.raw.headers
  });
  if (!session2) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("session", session2);
  await next();
};
app.get("/api/me", requireAuth, async (c) => {
  const session2 = c.get("session");
  const [currentUser] = await db.select().from(user).where(eq2(user.id, session2.user.id)).limit(1);
  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }
  const userObj = { ...currentUser };
  if (!userObj.username) {
    const fallback = currentUser.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "") || `user_${currentUser.id.slice(0, 6)}`;
    userObj.username = fallback;
    await db.update(user).set({ username: fallback }).where(eq2(user.id, currentUser.id)).catch(() => {
    });
  }
  return c.json(userObj);
});
app.get("/api/check-username/:username", async (c) => {
  const username = c.req.param("username").toLowerCase();
  if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username)) {
    return c.json({ available: false, error: "Invalid format" }, 400);
  }
  const existingUser = await db.select({ id: user.id }).from(user).where(eq2(user.username, username)).limit(1);
  return c.json({ available: existingUser.length === 0 });
});
app.post("/api/onboarding", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json();
  const username = body.username?.toLowerCase();
  if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username)) {
    return c.json({ error: "Format username tidak valid" }, 400);
  }
  try {
    await db.update(user).set({
      username,
      favoriteCategories: body.favoriteCategories ? JSON.stringify(body.favoriteCategories) : null
    }).where(eq2(user.id, session2.user.id));
    return c.json({ success: true });
  } catch (e) {
    if (e.code === "23505") {
      return c.json({ error: "Username sudah digunakan" }, 400);
    }
    return c.json({ error: "Gagal menyimpan data" }, 500);
  }
});
app.put("/api/me", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json();
  const [existingUser] = await db.select().from(user).where(eq2(user.id, session2.user.id)).limit(1);
  if (!existingUser) {
    return c.json({ error: "User not found" }, 404);
  }
  const newName = body.name !== void 0 ? body.name : existingUser.name;
  let newUsername = body.username !== void 0 ? body.username : existingUser.username;
  if (body.username && body.username !== existingUser.username) {
    const conflict = await db.select().from(user).where(eq2(user.username, body.username));
    if (conflict.length > 0 && conflict[0].id !== session2.user.id) {
      return c.json({ error: "Username is already taken" }, 400);
    }
  }
  const favoriteCategories = body.favoriteCategories !== void 0 ? Array.isArray(body.favoriteCategories) ? JSON.stringify(body.favoriteCategories) : body.favoriteCategories : existingUser.favoriteCategories;
  const [updatedUser] = await db.update(user).set({
    name: newName,
    username: newUsername,
    favoriteCategories
  }).where(eq2(user.id, session2.user.id)).returning();
  return c.json({
    success: true,
    ...updatedUser,
    user: updatedUser
  });
});
app.get("/api/quests", requireAuth, async (c) => {
  const session2 = c.get("session");
  const userQuests = await db.select().from(quests).where(eq2(quests.userId, session2.user.id)).orderBy(quests.createdAt);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const completions = await db.select().from(questCompletions).where(
    and2(
      eq2(questCompletions.userId, session2.user.id),
      gte(questCompletions.completedAt, today)
    )
  );
  return c.json({
    quests: userQuests,
    completedIds: completions.map((c2) => c2.questId)
  });
});
app.post("/api/quests", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json();
  const name = body.name || body.title;
  if (!name) {
    return c.json({ error: "Name is required" }, 400);
  }
  const minutes = body.estimatedMinutes ?? body.timeGoalMinutes ?? body.duration;
  const estimatedMinutes = minutes !== void 0 && minutes !== null ? parseInt(String(minutes), 10) : null;
  const [newQuest] = await db.insert(quests).values({
    userId: session2.user.id,
    name,
    category: body.category || "coding",
    estimatedMinutes
  }).returning();
  return c.json({
    ...newQuest,
    title: newQuest.name,
    timeGoalMinutes: newQuest.estimatedMinutes
  }, 201);
});
app.delete("/api/quests/:id", requireAuth, async (c) => {
  const session2 = c.get("session");
  const id = c.req.param("id");
  await db.delete(quests).where(and2(eq2(quests.id, id), eq2(quests.userId, session2.user.id)));
  return c.json({ success: true });
});
app.put("/api/quests/:id", requireAuth, async (c) => {
  const session2 = c.get("session");
  const id = c.req.param("id");
  const body = await c.req.json();
  const name = body.name || body.title;
  if (!name) {
    return c.json({ error: "Name is required" }, 400);
  }
  const minutes = body.estimatedMinutes ?? body.timeGoalMinutes ?? body.duration;
  const estimatedMinutes = minutes !== void 0 && minutes !== null ? parseInt(String(minutes), 10) : null;
  const [updatedQuest] = await db.update(quests).set({
    name,
    category: body.category || "coding",
    estimatedMinutes
  }).where(and2(eq2(quests.id, id), eq2(quests.userId, session2.user.id))).returning();
  if (!updatedQuest) {
    return c.json({ error: "Quest not found" }, 404);
  }
  return c.json({
    ...updatedQuest,
    title: updatedQuest.name,
    timeGoalMinutes: updatedQuest.estimatedMinutes
  });
});
app.get("/api/quests/:id/history", requireAuth, async (c) => {
  const session2 = c.get("session");
  const id = c.req.param("id");
  const history = await db.select({
    id: questCompletions.id,
    completedAt: questCompletions.completedAt
  }).from(questCompletions).where(
    and2(
      eq2(questCompletions.questId, id),
      eq2(questCompletions.userId, session2.user.id)
    )
  ).orderBy(desc(questCompletions.completedAt)).limit(30);
  return c.json(history);
});
app.post("/api/quests/:id/check", requireAuth, async (c) => {
  const session2 = c.get("session");
  const id = c.req.param("id");
  await db.insert(questCompletions).values({
    questId: id,
    userId: session2.user.id
  });
  const [userData] = await db.select().from(user).where(eq2(user.id, session2.user.id));
  let xpGained = 10;
  let streakBonus = false;
  let gracePeriodRestored = false;
  let newXp = (userData.totalXp || 0) + 10;
  let newStreak = userData.currentStreak || 0;
  let maxStreak = userData.maxStreak || 0;
  let streakAtRisk = userData.streakAtRisk;
  let gracePeriodUntil = userData.gracePeriodUntil;
  let message = "Quest completed! +10 XP";
  const now = /* @__PURE__ */ new Date();
  if (streakAtRisk && gracePeriodUntil) {
    if (now < gracePeriodUntil) {
      newXp += 20;
      xpGained = 30;
      streakAtRisk = false;
      gracePeriodUntil = null;
      gracePeriodRestored = true;
      message = "Bara dipulihkan! +30 XP";
    } else {
      newStreak = 1;
      streakAtRisk = false;
      gracePeriodUntil = null;
      message = "Bara telah padam. Memulai streak baru! +10 XP";
    }
  } else {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const completionsToday = await db.select().from(questCompletions).where(
      and2(
        eq2(questCompletions.userId, session2.user.id),
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
        message += " \u{1F389} 7-Day Milestone! +50 XP";
      }
    }
  }
  const [updatedUser] = await db.update(user).set({
    totalXp: newXp,
    currentStreak: newStreak,
    maxStreak,
    streakAtRisk,
    gracePeriodUntil,
    lastQuestCompletedAt: /* @__PURE__ */ new Date()
  }).where(eq2(user.id, session2.user.id)).returning();
  const allUserCompletions = await db.select({ id: questCompletions.id }).from(questCompletions).where(eq2(questCompletions.userId, session2.user.id));
  const totalCompletions = allUserCompletions.length;
  const earnedAchievements = [];
  if (newStreak >= 7) earnedAchievements.push("Week Warrior");
  if (newStreak >= 14) earnedAchievements.push("Fortnight Fighter");
  if (newStreak >= 30) earnedAchievements.push("Monthly Master");
  if (totalCompletions >= 100) earnedAchievements.push("Century Quester");
  if (totalCompletions >= 200) earnedAchievements.push("Quest Legend");
  const newAchievements = [];
  if (earnedAchievements.length > 0) {
    const existingAchs = await db.select({ type: achievements.achievementType }).from(achievements).where(eq2(achievements.userId, session2.user.id));
    const existingTypes = new Set(existingAchs.map((a) => a.type));
    for (const ach of earnedAchievements) {
      if (!existingTypes.has(ach)) {
        await db.insert(achievements).values({
          userId: session2.user.id,
          achievementType: ach
        });
        newAchievements.push(ach);
      }
    }
  }
  if (newAchievements.length > 0) {
    message += ` \u{1F3C6} Unlocked: ${newAchievements.join(", ")}`;
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
app.get("/api/achievements", requireAuth, async (c) => {
  const session2 = c.get("session");
  const userAchievements = await db.select().from(achievements).where(eq2(achievements.userId, session2.user.id)).orderBy(desc(achievements.unlockedAt));
  return c.json(userAchievements);
});
app.get("/api/leaderboard", requireAuth, async (c) => {
  const session2 = c.get("session");
  const tab = c.req.query("tab") || "global";
  if (tab === "friends") {
    const userFriends = await db.select().from(friends).where(
      and2(
        or(eq2(friends.userId, session2.user.id), eq2(friends.friendId, session2.user.id)),
        eq2(friends.status, "accepted")
      )
    );
    const friendIds = userFriends.map((f) => f.userId === session2.user.id ? f.friendId : f.userId);
    friendIds.push(session2.user.id);
    if (friendIds.length === 0) {
      return c.json({ tab, leaderboard: [], data: [] });
    }
    const topUsers2 = await db.select({
      id: user.id,
      name: user.name,
      username: user.username,
      currentStreak: user.currentStreak,
      totalXp: user.totalXp
    }).from(user).where(inArray(user.id, friendIds)).orderBy(desc(user.currentStreak), desc(user.totalXp)).limit(10);
    return c.json({
      tab,
      leaderboard: topUsers2,
      data: topUsers2
    });
  }
  const topUsers = await db.select({
    id: user.id,
    name: user.name,
    username: user.username,
    currentStreak: user.currentStreak,
    totalXp: user.totalXp
  }).from(user).orderBy(desc(user.currentStreak), desc(user.totalXp)).limit(10);
  return c.json({
    tab,
    leaderboard: topUsers,
    data: topUsers
  });
});
app.get("/api/friends/search", requireAuth, async (c) => {
  const q = c.req.query("q");
  const session2 = c.get("session");
  if (!q || q.length < 3) return c.json([]);
  const users = await db.select({
    id: user.id,
    name: user.name,
    username: user.username,
    totalXp: user.totalXp
  }).from(user).where(
    or(
      ilike(user.username, `%${q}%`),
      ilike(user.name, `%${q}%`)
    )
  ).limit(10);
  const myFriends = await db.select().from(friends).where(
    or(
      eq2(friends.userId, session2.user.id),
      eq2(friends.friendId, session2.user.id)
    )
  );
  const excludeIds = /* @__PURE__ */ new Set();
  excludeIds.add(session2.user.id);
  myFriends.forEach((f) => {
    excludeIds.add(f.userId);
    excludeIds.add(f.friendId);
  });
  const filtered = users.filter((u) => !excludeIds.has(u.id));
  if (filtered.length === 0) {
    return c.json({ error: "Username tidak ditemukan", results: [] });
  }
  return c.json(filtered);
});
app.post("/api/friends/request", requireAuth, async (c) => {
  const session2 = c.get("session");
  const { friendId } = await c.req.json();
  if (!friendId || friendId === session2.user.id) {
    return c.json({ error: "Invalid friend ID" }, 400);
  }
  const existing = await db.select().from(friends).where(
    or(
      and2(eq2(friends.userId, session2.user.id), eq2(friends.friendId, friendId)),
      and2(eq2(friends.userId, friendId), eq2(friends.friendId, session2.user.id))
    )
  );
  if (existing.length > 0) {
    return c.json({ error: "Relationship already exists" }, 400);
  }
  await db.insert(friends).values({
    userId: session2.user.id,
    friendId,
    status: "pending"
  });
  return c.json({ success: true });
});
app.get("/api/friends/requests", requireAuth, async (c) => {
  const session2 = c.get("session");
  const incoming = await db.select({
    requestId: friends.id,
    userId: user.id,
    name: user.name,
    createdAt: friends.createdAt
  }).from(friends).innerJoin(user, eq2(user.id, friends.userId)).where(
    and2(
      eq2(friends.friendId, session2.user.id),
      eq2(friends.status, "pending")
    )
  );
  return c.json(incoming);
});
app.post("/api/friends/respond", requireAuth, async (c) => {
  const session2 = c.get("session");
  const { requestId, action } = await c.req.json();
  const [request] = await db.select().from(friends).where(
    and2(
      eq2(friends.id, requestId),
      eq2(friends.friendId, session2.user.id),
      eq2(friends.status, "pending")
    )
  );
  if (!request) return c.json({ error: "Request not found" }, 404);
  if (action === "accept") {
    await db.update(friends).set({ status: "accepted" }).where(eq2(friends.id, requestId));
    await db.insert(friends).values({
      userId: session2.user.id,
      friendId: request.userId,
      // User who sent the request
      status: "accepted"
    });
  } else if (action === "reject") {
    await db.delete(friends).where(eq2(friends.id, requestId));
  }
  return c.json({ success: true });
});
app.post("/api/cron/daily", async (c) => {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  await db.update(user).set({
    streakAtRisk: true,
    gracePeriodUntil: new Date(Date.now() + 48 * 60 * 60 * 1e3)
    // 48 hours from now
  }).where(
    and2(
      gt(user.currentStreak, 0),
      eq2(user.streakAtRisk, false),
      or(
        isNull(user.lastQuestCompletedAt),
        lt(user.lastQuestCompletedAt, today)
      )
    )
  );
  await db.update(user).set({
    currentStreak: 0,
    streakAtRisk: false,
    gracePeriodUntil: null
  }).where(
    and2(
      eq2(user.streakAtRisk, true),
      lt(user.gracePeriodUntil, /* @__PURE__ */ new Date())
    )
  );
  return c.json({
    success: true,
    message: "Daily reset complete",
    streaksUpdated: 0,
    processed: 0
  });
});
app.get("/api", (c) => c.json({ status: "ok", message: "Streak API is running!" }));
app.get("/api/", (c) => c.json({ status: "ok", message: "Streak API is running!" }));
app.get("/api/health", (c) => c.json({ status: "ok" }));
app.get("/", (c) => c.text("Streak API is running!"));
var index_default = app;
var isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (!process.env.VERCEL && isMainModule && process.env.NODE_ENV !== "test") {
  const port = 3e3;
  console.log(`Server is running on port ${port}`);
  const server = serve({
    fetch: app.fetch,
    port
  });
  seedDatabase().catch((e) => console.error("Initial seed error:", e));
  const shutdown = () => {
    try {
      server.close();
    } catch {
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// server/api-entry.ts
var listener = getRequestListener(index_default.fetch);
async function handler(req, res) {
  try {
    const host = req.headers["x-forwarded-host"] || req.headers["host"] || "web-streak.vercel.app";
    const proto = req.headers["x-forwarded-proto"] || "https";
    try {
      const parsed = new URL(req.url, `${proto}://${host}`);
      const pathParam = parsed.searchParams.get("path");
      if (pathParam) {
        parsed.searchParams.delete("path");
        const qs = parsed.searchParams.toString();
        req.url = `/api/${pathParam}${qs ? `?${qs}` : ""}`;
      }
    } catch {
    }
    req.headers["x-forwarded-proto"] = proto;
    req.headers["x-forwarded-host"] = host;
    return await listener(req, res);
  } catch (error) {
    console.error("Vercel API error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: error?.message || "Internal Server Error",
        stack: error?.stack
      }));
    }
  }
}
export {
  handler as default
};
