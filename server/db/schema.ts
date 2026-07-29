import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  
  // Custom fields for Streak App
  currentStreak: integer("currentStreak").default(0).notNull(),
  totalXp: integer("totalXp").default(0).notNull(),
  lastQuestCompletedAt: timestamp("lastQuestCompletedAt"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const account = pgTable("account", {
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
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// Streak App Specific Tables
export const quests = pgTable("quests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  category: text("category").default('coding').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questCompletions = pgTable("quest_completions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  questId: text("quest_id").notNull().references(() => quests.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => user.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const friends = pgTable("friends", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id),
  friendId: text("friend_id").notNull().references(() => user.id),
  status: text("status").default('pending').notNull(), // 'pending', 'accepted'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
