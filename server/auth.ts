import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const getTrustedOrigins = (request?: Request): string[] => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://web-streak.vercel.app",
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
    } catch {}
  }
  if (request) {
    const origin = request.headers.get("origin");
    if (origin) origins.push(origin);
  }
  return [...new Set(origins)];
};

const getBaseURL = (): string | undefined => {
  let url = process.env.BETTER_AUTH_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!url) {
    return process.env.NODE_ENV === "production" ? undefined : "http://localhost:5173/api/auth";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  if (!url.endsWith("/api/auth")) {
    url = `${url.replace(/\/+$/, "")}/api/auth`;
  }
  return url;
};

const socialProviders: Record<string, any> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

const baseURL = getBaseURL();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-streak-app-dev-only",
  baseURL,
  trustedOrigins: getTrustedOrigins,
  rateLimit: {
    enabled: false,
  },
  database: drizzleAdapter(db, {
    provider: "pg", // Use PostgreSQL
    schema: schema
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
});

