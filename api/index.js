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
import { logger } from "hono/logger";

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
import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
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
  // gamification fields
  streakAtRisk: boolean("streakAtRisk").default(false).notNull(),
  gracePeriodUntil: timestamp("gracePeriodUntil"),
  // onboarding
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
  // notifications
  notificationEnabled: boolean("notificationEnabled").default(true).notNull(),
  pushSubscription: jsonb("pushSubscription"),
  lastReminderSentAt: timestamp("lastReminderSentAt"),
  timezone: text("timezone").default("UTC")
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
connectionString = connectionString.replace(/\/postgr(\?|$)/, "/postgres$1");
var client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: process.env.VERCEL ? 1 : process.env.NODE_ENV === "test" ? 1 : 10,
  idle_timeout: process.env.NODE_ENV === "test" ? 1 : 10
});
var db = drizzle(client, { schema: schema_exports });

// server/auth.ts
var getTrustedOrigins = () => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://web-streak.vercel.app"
  ];
  if (process.env.APP_URL) {
    try {
      const url = process.env.APP_URL.startsWith("http") ? process.env.APP_URL : `https://${process.env.APP_URL}`;
      origins.push(new URL(url).origin);
    } catch {
    }
  }
  if (process.env.VERCEL_URL) {
    try {
      const url = process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`;
      origins.push(new URL(url).origin);
    } catch {
    }
  }
  if (process.env.BETTER_AUTH_URL) {
    try {
      const url = process.env.BETTER_AUTH_URL.startsWith("http") ? process.env.BETTER_AUTH_URL : `https://${process.env.BETTER_AUTH_URL}`;
      origins.push(new URL(url).origin);
    } catch {
    }
  }
  return [...new Set(origins.filter(Boolean))];
};
var isOriginAllowed = (origin) => {
  if (!origin) return false;
  const trusted = getTrustedOrigins();
  return trusted.includes(origin);
};
var getBaseURL = () => {
  let url = process.env.BETTER_AUTH_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : void 0);
  if (!url) {
    return process.env.NODE_ENV === "production" ? "https://web-streak.vercel.app" : "http://localhost:5173";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/api\/auth\/?$/, "").replace(/\/+$/, "");
};
var getAuthSecret = () => {
  if (process.env.BETTER_AUTH_SECRET) {
    return process.env.BETTER_AUTH_SECRET;
  }
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV) {
    console.error("\u26A0\uFE0F WARNING: BETTER_AUTH_SECRET is not set in production!");
  }
  return process.env.BETTER_AUTH_SECRET || "development-secret-key-streak-app-dev-only";
};
var socialProviders = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const cleanClientId = process.env.GOOGLE_CLIENT_ID.replace(/^https?:\/\//, "").trim().replace(/^["']|["']$/g, "");
  const cleanClientSecret = process.env.GOOGLE_CLIENT_SECRET.trim().replace(/^["']|["']$/g, "");
  socialProviders.google = {
    clientId: cleanClientId,
    clientSecret: cleanClientSecret
  };
}
var baseURL = getBaseURL();
var auth = betterAuth({
  secret: getAuthSecret(),
  baseURL,
  trustedOrigins: getTrustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 50
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema_exports
  }),
  emailAndPassword: {
    enabled: true
  },
  socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : void 0
});

// server/index.ts
import { eq as eq3, desc, and as and2, gte, ilike, or, inArray, gt, lt, isNull, isNotNull } from "drizzle-orm";
import dotenv2 from "dotenv";

// server/services/reminder.service.ts
import webpush from "web-push";
import { eq } from "drizzle-orm";
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID keys not configured in environment. Push notifications will not work.");
}
async function sendPushNotification(userId, payload) {
  try {
    const [targetUser] = await db.select({ pushSubscription: user.pushSubscription }).from(user).where(eq(user.id, userId)).limit(1);
    if (!targetUser || !targetUser.pushSubscription) {
      console.warn(`[sendPushNotification] No subscription for user ${userId}`);
      return;
    }
    const subscription = targetUser.pushSubscription;
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: payload.title,
        body: payload.body,
        tag: payload.tag || "default",
        url: payload.data?.url || "/dashboard"
      }));
    } catch (sendError) {
      if (sendError.statusCode === 410 || sendError.statusCode === 404) {
        console.log(`[sendPushNotification] Subscription expired for user ${userId}`);
        await clearUserPushSubscription(userId);
      }
      throw sendError;
    }
  } catch (error) {
    console.error(`[sendPushNotification] Error:`, error);
  }
}
async function clearUserPushSubscription(userId) {
  try {
    await db.update(user).set({ pushSubscription: null, notificationEnabled: false }).where(eq(user.id, userId));
  } catch (error) {
    console.error("[clearUserPushSubscription] Error:", error);
  }
}

// server/validators.ts
import { z } from "zod";
var USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
var usernameParamSchema = z.string().trim().regex(USERNAME_REGEX, {
  message: "Username harus 3-20 karakter alfanumerik (diawali huruf)"
});
var onboardingSchema = z.object({
  username: z.string().trim().regex(USERNAME_REGEX, {
    message: "Format username tidak valid (3-20 karakter alfanumerik, diawali huruf)"
  }),
  favoriteCategories: z.array(z.string().trim().max(50)).max(10).optional()
});
var updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama tidak boleh kosong").max(100, "Nama maksimal 100 karakter").optional(),
  username: z.string().trim().regex(USERNAME_REGEX, {
    message: "Username harus 3-20 karakter alfanumerik (diawali huruf)"
  }).optional(),
  favoriteCategories: z.union([
    z.array(z.string().trim().max(50)).max(10),
    z.string().max(500)
  ]).optional()
});
var sanitizeMinutes = z.preprocess((val) => {
  if (val === void 0 || val === null || val === "") return null;
  const num = typeof val === "string" ? parseInt(val, 10) : Number(val);
  return isNaN(num) ? null : num;
}, z.number().int().min(1, "Estimasi waktu minimal 1 menit").max(1440, "Estimasi waktu maksimal 1440 menit (24 jam)").nullable().optional());
var createQuestSchema = z.object({
  name: z.string().trim().min(1, "Nama quest wajib diisi").max(150, "Nama quest maksimal 150 karakter").optional(),
  title: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(50).default("coding"),
  estimatedMinutes: sanitizeMinutes,
  timeGoalMinutes: sanitizeMinutes,
  duration: sanitizeMinutes
}).refine((data) => Boolean(data.name || data.title), {
  message: "Nama quest wajib diisi",
  path: ["name"]
});
var updateQuestSchema = z.object({
  name: z.string().trim().min(1, "Nama quest wajib diisi").max(150, "Nama quest maksimal 150 karakter").optional(),
  title: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(50).default("coding"),
  estimatedMinutes: sanitizeMinutes,
  timeGoalMinutes: sanitizeMinutes,
  duration: sanitizeMinutes
}).refine((data) => Boolean(data.name || data.title), {
  message: "Nama quest wajib diisi",
  path: ["name"]
});
var friendRequestSchema = z.object({
  friendId: z.string().trim().min(1, "Invalid friend ID").max(100)
});
var friendRespondSchema = z.object({
  requestId: z.string().trim().min(1, "Invalid request ID").max(100),
  action: z.enum(["accept", "reject"], {
    message: "Aksi harus 'accept' atau 'reject'"
  })
});
function escapeSqlLike(input) {
  return input.replace(/[%_\\]/g, "\\$&");
}

// server/rate-limiter.ts
function createRateLimiter(options) {
  const { windowMs, max, message = "Terlalu banyak permintaan. Silakan coba beberapa saat lagi." } = options;
  const ipStore = /* @__PURE__ */ new Map();
  if (process.env.NODE_ENV !== "test") {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of ipStore.entries()) {
        if (now > data.resetTime) {
          ipStore.delete(ip);
        }
      }
    }, 12e4);
    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }
  return async function rateLimiter(c, next) {
    const forwardedFor = c.req.header("x-forwarded-for");
    const realIp = c.req.header("x-real-ip");
    const ip = (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) || "127.0.0.1";
    const now = Date.now();
    let clientRecord = ipStore.get(ip);
    if (!clientRecord || now > clientRecord.resetTime) {
      clientRecord = {
        count: 1,
        resetTime: now + windowMs
      };
      ipStore.set(ip, clientRecord);
    } else {
      clientRecord.count += 1;
    }
    const remaining = Math.max(0, max - clientRecord.count);
    const resetInSec = Math.ceil((clientRecord.resetTime - now) / 1e3);
    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", Math.ceil(clientRecord.resetTime / 1e3).toString());
    if (clientRecord.count > max) {
      c.header("Retry-After", resetInSec.toString());
      return c.json({
        error: message,
        retryAfterSeconds: resetInSec
      }, 429);
    }
    await next();
  };
}

// server/seed.ts
import { eq as eq2, and } from "drizzle-orm";
async function seedDatabase() {
  try {
    console.log("\u{1F331} Checking / Seeding demo and test users...");
    const demoEmail = "example@gmail.com";
    const demoPass = "password123";
    let demoUserRecord = (await db.select().from(user).where(eq2(user.email, demoEmail)))[0];
    if (!demoUserRecord) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: demoEmail,
            password: demoPass,
            name: "Demo User"
          }
        });
        demoUserRecord = (await db.select().from(user).where(eq2(user.email, demoEmail)))[0];
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
      }).where(eq2(user.id, demoUserRecord.id));
      const existingQuests = await db.select().from(quests).where(eq2(quests.userId, demoUserRecord.id));
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
    let testUserRecord = (await db.select().from(user).where(eq2(user.email, testEmail)))[0];
    if (!testUserRecord) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: testEmail,
            password: testPass,
            name: "Test User"
          }
        });
        testUserRecord = (await db.select().from(user).where(eq2(user.email, testEmail)))[0];
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
      }).where(eq2(user.id, testUserRecord.id));
      const existingTestQuests = await db.select().from(quests).where(eq2(quests.userId, testUserRecord.id));
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
      let [rec] = await db.select().from(user).where(eq2(user.email, sample.email)).limit(1);
      if (!rec) {
        try {
          await auth.api.signUpEmail({
            body: {
              email: sample.email,
              password: "Password123!",
              name: sample.name
            }
          });
          const [created] = await db.select().from(user).where(eq2(user.email, sample.email)).limit(1);
          rec = created;
        } catch (e) {
          const [found] = await db.select().from(user).where(eq2(user.email, sample.email)).limit(1);
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
        }).where(eq2(user.id, rec.id));
        if (demoUserRecord && demoUserRecord.id !== rec.id) {
          const friendExists = await db.select().from(friends).where(
            and(eq2(friends.userId, demoUserRecord.id), eq2(friends.friendId, rec.id))
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
app.use("*", logger());
app.use("*", cors({
  origin: (origin) => {
    if (!origin) return "http://localhost:5173";
    return isOriginAllowed(origin) ? origin : null;
  },
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
}));
var apiLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  max: 120,
  message: "Terlalu banyak permintaan API. Silakan coba lagi nanti."
});
var authLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  max: 15,
  message: "Terlalu banyak percobaan autentikasi. Silakan tunggu 1 menit."
});
app.use("/api/*", apiLimiter);
app.use("/api/auth/sign-in/*", authLimiter);
app.use("/api/auth/sign-up/*", authLimiter);
app.post("/api/auth/sign-in/email", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    if (!body?.email || !body?.password) {
      return c.json({ error: "Email dan password wajib diisi" }, 400);
    }
    const response = await auth.api.signInEmail({
      body: {
        email: body.email.toLowerCase().trim(),
        password: body.password
      },
      headers: c.req.raw.headers,
      asResponse: true
    });
    return response;
  } catch (err) {
    console.error("Sign-in error:", err?.message || err);
    return c.json({
      error: "Email atau password salah"
    }, 401);
  }
});
app.post("/api/auth/sign-up/email", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    if (!body?.email || !body?.password) {
      return c.json({ error: "Email dan password wajib diisi" }, 400);
    }
    if (typeof body.password !== "string" || body.password.length < 6) {
      return c.json({ error: "Password minimal 6 karakter" }, 400);
    }
    const name = (body.name || body.email.split("@")[0] || "User").trim().slice(0, 100);
    const cleanUsername = (body.username || body.email.split("@")[0] || `user_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    const response = await auth.api.signUpEmail({
      body: {
        email: body.email.toLowerCase().trim(),
        password: body.password,
        name
      },
      headers: c.req.raw.headers,
      asResponse: true
    });
    await db.update(user).set({
      username: cleanUsername,
      currentStreak: 0,
      maxStreak: 0,
      totalXp: 0
    }).where(eq3(user.email, body.email.toLowerCase().trim())).catch(() => {
    });
    return response;
  } catch (err) {
    console.error("Sign-up error:", err?.message || err);
    return c.json({ error: err?.message || "Pendaftaran gagal" }, 400);
  }
});
app.post("/api/auth/sign-out", async (c) => {
  try {
    const response = await auth.api.signOut({
      headers: c.req.raw.headers,
      asResponse: true
    });
    return response;
  } catch (err) {
    console.error("Sign-out error:", err?.message || err);
    return c.json({ success: true });
  }
});
app.get("/api/auth/get-session", async (c) => {
  try {
    const session2 = await auth.api.getSession({
      headers: c.req.raw.headers
    });
    return c.json(session2 || null);
  } catch (err) {
    return c.json(null);
  }
});
app.get("/api/auth/session", async (c) => {
  try {
    const session2 = await auth.api.getSession({
      headers: c.req.raw.headers
    });
    return c.json(session2 || null);
  } catch (err) {
    return c.json(null);
  }
});
app.post("/api/auth/sign-in/social", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const response = await auth.api.signInSocial({
      body: {
        provider: body.provider,
        callbackURL: body.callbackURL || "/dashboard",
        errorCallbackURL: body.errorCallbackURL,
        newUserCallbackURL: body.newUserCallbackURL
      },
      headers: c.req.raw.headers,
      asResponse: true
    });
    return response;
  } catch (err) {
    console.error("Sign-in social error:", err?.message || err);
    return c.json({ error: "Social sign-in failed" }, 500);
  }
});
app.get("/api/auth/callback/:provider", async (c) => {
  try {
    const response = await auth.api.callbackOAuth({
      params: {
        id: c.req.param("provider")
      },
      query: c.req.query(),
      headers: c.req.raw.headers,
      asResponse: true
    });
    return response;
  } catch (err) {
    console.error("OAuth callback error:", err?.message || err);
    return c.redirect("/login?error=" + encodeURIComponent("OAuth callback failed"));
  }
});
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
app.all("/api/auth", (c) => auth.handler(c.req.raw));
app.all("/auth/*", (c) => auth.handler(c.req.raw));
var requireAuth = async (c, next) => {
  const session2 = await auth.api.getSession({
    headers: c.req.raw.headers
  });
  if (!session2 || !session2.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("session", session2);
  await next();
};
app.get("/api/me", requireAuth, async (c) => {
  const session2 = c.get("session");
  const [currentUser] = await db.select().from(user).where(eq3(user.id, session2.user.id)).limit(1);
  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }
  const userObj = { ...currentUser };
  if (!userObj.username) {
    const fallback = currentUser.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "") || `user_${currentUser.id.slice(0, 6)}`;
    userObj.username = fallback;
    await db.update(user).set({ username: fallback }).where(eq3(user.id, currentUser.id)).catch(() => {
    });
  }
  return c.json(userObj);
});
app.put("/api/me", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = updateProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Input tidak valid" }, 400);
  }
  const data = parseResult.data;
  const [existingUser] = await db.select().from(user).where(eq3(user.id, session2.user.id)).limit(1);
  if (!existingUser) {
    return c.json({ error: "User not found" }, 404);
  }
  const newName = data.name !== void 0 ? data.name : existingUser.name;
  const newUsername = data.username !== void 0 ? data.username.toLowerCase() : existingUser.username;
  if (data.username && data.username.toLowerCase() !== existingUser.username) {
    const targetUsername = data.username.toLowerCase();
    const conflict = await db.select().from(user).where(eq3(user.username, targetUsername));
    if (conflict.length > 0 && conflict[0].id !== session2.user.id) {
      return c.json({ error: "Username is already taken" }, 400);
    }
  }
  const favoriteCategories = data.favoriteCategories !== void 0 ? Array.isArray(data.favoriteCategories) ? JSON.stringify(data.favoriteCategories) : data.favoriteCategories : existingUser.favoriteCategories;
  const [updatedUser] = await db.update(user).set({
    name: newName,
    username: newUsername,
    favoriteCategories
  }).where(eq3(user.id, session2.user.id)).returning();
  return c.json({
    success: true,
    ...updatedUser,
    user: updatedUser
  });
});
app.get("/api/check-username/:username", async (c) => {
  const rawUsername = c.req.param("username");
  const parseResult = usernameParamSchema.safeParse(rawUsername);
  if (!parseResult.success) {
    return c.json({ available: false, error: "Invalid format" }, 400);
  }
  const username = parseResult.data.toLowerCase();
  const existingUser = await db.select({ id: user.id }).from(user).where(eq3(user.username, username)).limit(1);
  return c.json({ available: existingUser.length === 0 });
});
app.post("/api/onboarding", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = onboardingSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Input tidak valid" }, 400);
  }
  const { username, favoriteCategories } = parseResult.data;
  const cleanUsername = username.toLowerCase();
  try {
    await db.update(user).set({
      username: cleanUsername,
      favoriteCategories: favoriteCategories ? JSON.stringify(favoriteCategories) : null,
      onboardingCompleted: true,
      onboardingCompletedAt: /* @__PURE__ */ new Date()
    }).where(eq3(user.id, session2.user.id));
    return c.json({ success: true });
  } catch (e) {
    if (e?.code === "23505") {
      return c.json({ error: "Username sudah digunakan" }, 400);
    }
    console.error("Onboarding update error:", e?.message || e);
    return c.json({ error: "Gagal menyimpan data" }, 500);
  }
});
app.get("/api/quests", requireAuth, async (c) => {
  const session2 = c.get("session");
  const userQuests = await db.select().from(quests).where(eq3(quests.userId, session2.user.id)).orderBy(quests.createdAt);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const completions = await db.select().from(questCompletions).where(
    and2(
      eq3(questCompletions.userId, session2.user.id),
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
  const body = await c.req.json().catch(() => ({}));
  const parseResult = createQuestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Input quest tidak valid" }, 400);
  }
  const { name, title, category, estimatedMinutes, timeGoalMinutes, duration } = parseResult.data;
  const questName = name || title;
  const minutes = estimatedMinutes ?? timeGoalMinutes ?? duration ?? null;
  const [newQuest] = await db.insert(quests).values({
    userId: session2.user.id,
    name: questName,
    category: category || "coding",
    estimatedMinutes: minutes
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
  await db.delete(quests).where(and2(eq3(quests.id, id), eq3(quests.userId, session2.user.id)));
  return c.json({ success: true });
});
app.put("/api/quests/:id", requireAuth, async (c) => {
  const session2 = c.get("session");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = updateQuestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Input quest tidak valid" }, 400);
  }
  const { name, title, category, estimatedMinutes, timeGoalMinutes, duration } = parseResult.data;
  const questName = name || title;
  const minutes = estimatedMinutes ?? timeGoalMinutes ?? duration ?? null;
  const [updatedQuest] = await db.update(quests).set({
    name: questName,
    category: category || "coding",
    estimatedMinutes: minutes
  }).where(and2(eq3(quests.id, id), eq3(quests.userId, session2.user.id))).returning();
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
      eq3(questCompletions.questId, id),
      eq3(questCompletions.userId, session2.user.id)
    )
  ).orderBy(desc(questCompletions.completedAt)).limit(30);
  return c.json(history);
});
app.post("/api/quests/:id/check", requireAuth, async (c) => {
  const session2 = c.get("session");
  const id = c.req.param("id");
  const [targetQuest] = await db.select().from(quests).where(and2(eq3(quests.id, id), eq3(quests.userId, session2.user.id))).limit(1);
  if (!targetQuest) {
    return c.json({ error: "Quest not found" }, 404);
  }
  await db.insert(questCompletions).values({
    questId: id,
    userId: session2.user.id
  });
  const [userData] = await db.select().from(user).where(eq3(user.id, session2.user.id));
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
        eq3(questCompletions.userId, session2.user.id),
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
  }).where(eq3(user.id, session2.user.id)).returning();
  const allUserCompletions = await db.select({ id: questCompletions.id }).from(questCompletions).where(eq3(questCompletions.userId, session2.user.id));
  const totalCompletions = allUserCompletions.length;
  const earnedAchievements = [];
  if (newStreak >= 7) earnedAchievements.push("Week Warrior");
  if (newStreak >= 14) earnedAchievements.push("Fortnight Fighter");
  if (newStreak >= 30) earnedAchievements.push("Monthly Master");
  if (totalCompletions >= 100) earnedAchievements.push("Century Quester");
  if (totalCompletions >= 200) earnedAchievements.push("Quest Legend");
  const newAchievements = [];
  if (earnedAchievements.length > 0) {
    const existingAchs = await db.select({ type: achievements.achievementType }).from(achievements).where(eq3(achievements.userId, session2.user.id));
    const existingTypes = new Set(existingAchs.map((a) => a.type));
    for (const ach of earnedAchievements) {
      if (!existingTypes.has(ach)) {
        await db.insert(achievements).values({
          userId: session2.user.id,
          achievementType: ach
        });
        newAchievements.push(ach);
        await sendPushNotification(session2.user.id, {
          title: "\u{1F3C6} Achievement Unlocked!",
          body: `Selamat! Kamu mendapatkan achievement: ${ach}`,
          tag: `ach-${ach}`
        });
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
  const userAchievements = await db.select().from(achievements).where(eq3(achievements.userId, session2.user.id)).orderBy(desc(achievements.unlockedAt));
  return c.json(userAchievements);
});
app.get("/api/leaderboard", requireAuth, async (c) => {
  const session2 = c.get("session");
  const tab = c.req.query("tab") || "global";
  if (tab === "friends") {
    const userFriends = await db.select().from(friends).where(
      and2(
        or(eq3(friends.userId, session2.user.id), eq3(friends.friendId, session2.user.id)),
        eq3(friends.status, "accepted")
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
  const rawQ = c.req.query("q");
  const session2 = c.get("session");
  if (!rawQ || typeof rawQ !== "string" || rawQ.trim().length < 3) {
    return c.json([]);
  }
  const q = rawQ.trim().slice(0, 50);
  const safeQ = escapeSqlLike(q);
  const users = await db.select({
    id: user.id,
    name: user.name,
    username: user.username,
    totalXp: user.totalXp
  }).from(user).where(
    or(
      ilike(user.username, `%${safeQ}%`),
      ilike(user.name, `%${safeQ}%`)
    )
  ).limit(10);
  const myFriends = await db.select().from(friends).where(
    or(
      eq3(friends.userId, session2.user.id),
      eq3(friends.friendId, session2.user.id)
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
  const body = await c.req.json().catch(() => ({}));
  const parseResult = friendRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Invalid friend ID" }, 400);
  }
  const { friendId } = parseResult.data;
  if (friendId === session2.user.id) {
    return c.json({ error: "Cannot send friend request to yourself" }, 400);
  }
  const [targetUser] = await db.select({ id: user.id }).from(user).where(eq3(user.id, friendId)).limit(1);
  if (!targetUser) {
    return c.json({ error: "User tidak ditemukan" }, 404);
  }
  const existing = await db.select().from(friends).where(
    or(
      and2(eq3(friends.userId, session2.user.id), eq3(friends.friendId, friendId)),
      and2(eq3(friends.userId, friendId), eq3(friends.friendId, session2.user.id))
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
  }).from(friends).innerJoin(user, eq3(user.id, friends.userId)).where(
    and2(
      eq3(friends.friendId, session2.user.id),
      eq3(friends.status, "pending")
    )
  );
  return c.json(incoming);
});
app.post("/api/friends/respond", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = friendRespondSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues[0]?.message || "Invalid payload" }, 400);
  }
  const { requestId, action } = parseResult.data;
  const [request] = await db.select().from(friends).where(
    and2(
      eq3(friends.id, requestId),
      eq3(friends.friendId, session2.user.id),
      eq3(friends.status, "pending")
    )
  );
  if (!request) return c.json({ error: "Request not found" }, 404);
  if (action === "accept") {
    await db.update(friends).set({ status: "accepted" }).where(eq3(friends.id, requestId));
    await db.insert(friends).values({
      userId: session2.user.id,
      friendId: request.userId,
      status: "accepted"
    });
  } else if (action === "reject") {
    await db.delete(friends).where(eq3(friends.id, requestId));
  }
  return c.json({ success: true });
});
app.post("/api/notifications/subscribe", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json().catch(() => ({}));
  if (!body.subscription) {
    return c.json({ error: "Subscription missing" }, 400);
  }
  await db.update(user).set({
    pushSubscription: body.subscription,
    notificationEnabled: true
  }).where(eq3(user.id, session2.user.id));
  return c.json({ success: true });
});
app.patch("/api/users/notification-enabled", requireAuth, async (c) => {
  const session2 = c.get("session");
  const body = await c.req.json().catch(() => ({}));
  await db.update(user).set({
    notificationEnabled: body.notificationEnabled
  }).where(eq3(user.id, session2.user.id));
  return c.json({ success: true });
});
app.post("/api/cron/daily", async (c) => {
  const authHeader = c.req.header("authorization");
  const vercelCronHeader = c.req.header("x-vercel-cron");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}` || cronSecret && vercelCronHeader === cronSecret || !cronSecret && process.env.NODE_ENV === "development";
  if (!isAuthorized) {
    return c.json({ error: "Unauthorized: Missing or invalid CRON_SECRET" }, 401);
  }
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  await db.update(user).set({
    streakAtRisk: true,
    gracePeriodUntil: new Date(Date.now() + 48 * 60 * 60 * 1e3)
    // 48 hours
  }).where(
    and2(
      gt(user.currentStreak, 0),
      eq3(user.streakAtRisk, false),
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
      eq3(user.streakAtRisk, true),
      lt(user.gracePeriodUntil, /* @__PURE__ */ new Date())
    )
  );
  return c.json({
    success: true,
    message: "Daily reset complete"
  });
});
app.get("/api/cron/daily-reminder", async (c) => {
  const authHeader = c.req.header("authorization");
  const vercelCronHeader = c.req.header("x-vercel-cron");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}` || cronSecret && vercelCronHeader === cronSecret || !cronSecret && process.env.NODE_ENV === "development";
  if (!isAuthorized) {
    return c.json({ error: "Unauthorized: Missing or invalid CRON_SECRET" }, 401);
  }
  try {
    console.log("[daily-reminder] Starting reminder cron...");
    const activeUsers = await db.select().from(user).where(and2(eq3(user.notificationEnabled, true), isNotNull(user.pushSubscription)));
    let successCount = 0;
    for (const u of activeUsers) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const allUserQuests = await db.select().from(quests).where(eq3(quests.userId, u.id));
      if (allUserQuests.length === 0) continue;
      const completionsToday = await db.select().from(questCompletions).where(
        and2(
          eq3(questCompletions.userId, u.id),
          gte(questCompletions.completedAt, today)
        )
      );
      const pendingCount = allUserQuests.length - completionsToday.length;
      if (pendingCount > 0) {
        const messageBody = pendingCount === 1 ? `Ada 1 quest yang belum selesai! Selesaikan sebelum jam 23:59 untuk menjaga Bara tetap menyala \u{1F525}` : `Masih ada ${pendingCount} quest hari ini! Jangan biarkan Bara-mu padam \u{1F525}`;
        await sendPushNotification(u.id, {
          title: "Waktunya Quest!",
          body: messageBody,
          tag: "daily-reminder",
          data: {
            url: "/dashboard",
            pendingCount
          }
        });
        successCount++;
        await db.update(user).set({ lastReminderSentAt: /* @__PURE__ */ new Date() }).where(eq3(user.id, u.id));
      }
    }
    return c.json({ success: true, sent: successCount });
  } catch (err) {
    console.error("Cron error:", err);
    return c.json({ error: "Internal error" }, 500);
  }
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
  if (process.env.NODE_ENV === "development" && process.env.AUTO_SEED === "true") {
    seedDatabase().catch((e) => console.error("Initial seed error:", e));
  }
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
        error: process.env.NODE_ENV === "development" ? error?.message || "Internal Server Error" : "Internal Server Error"
      }));
    }
  }
}
export {
  handler as default
};
