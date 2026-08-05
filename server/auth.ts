import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const getTrustedOrigins = (): string[] => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://web-streak.vercel.app",
  ];
  if (process.env.APP_URL) {
    try {
      const url = process.env.APP_URL.startsWith("http") ? process.env.APP_URL : `https://${process.env.APP_URL}`;
      origins.push(new URL(url).origin);
    } catch {}
  }
  if (process.env.VERCEL_URL) {
    try {
      const url = process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`;
      origins.push(new URL(url).origin);
    } catch {}
  }
  if (process.env.BETTER_AUTH_URL) {
    try {
      const url = process.env.BETTER_AUTH_URL.startsWith("http") ? process.env.BETTER_AUTH_URL : `https://${process.env.BETTER_AUTH_URL}`;
      origins.push(new URL(url).origin);
    } catch {}
  }
  return [...new Set(origins.filter(Boolean))];
};

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;
  const trusted = getTrustedOrigins();
  return trusted.includes(origin);
};

const getBaseURL = (): string | undefined => {
  let url = process.env.BETTER_AUTH_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!url) {
    return process.env.NODE_ENV === "production" ? "https://web-streak.vercel.app" : "http://localhost:5173";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/api\/auth\/?$/, "").replace(/\/+$/, "");
};

const getAuthSecret = (): string => {
  if (process.env.BETTER_AUTH_SECRET) {
    return process.env.BETTER_AUTH_SECRET;
  }
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV) {
    console.error("⚠️ WARNING: BETTER_AUTH_SECRET is not set in production!");
  }
  return process.env.BETTER_AUTH_SECRET || "development-secret-key-streak-app-dev-only";
};

const socialProviders: Record<string, any> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const cleanClientId = process.env.GOOGLE_CLIENT_ID.replace(/^https?:\/\//, '').trim().replace(/^["']|["']$/g, '');
  const cleanClientSecret = process.env.GOOGLE_CLIENT_SECRET.trim().replace(/^["']|["']$/g, '');
  socialProviders.google = {
    clientId: cleanClientId,
    clientSecret: cleanClientSecret,
  };
}

const baseURL = getBaseURL();

export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL,
  trustedOrigins: getTrustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 50,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
});
