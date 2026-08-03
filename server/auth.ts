import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const getTrustedOrigins = (request?: Request): string[] => {
  const origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"];
  if (process.env.APP_URL) origins.push(process.env.APP_URL);
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);
  if (request) {
    const origin = request.headers.get("origin");
    if (origin) origins.push(origin);
  }
  return origins;
};

const baseURL = process.env.BETTER_AUTH_URL
  || (process.env.APP_URL ? `${process.env.APP_URL}/api/auth` : undefined)
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth` : undefined)
  || (process.env.NODE_ENV === "production" ? undefined : "http://localhost:5173/api/auth");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-streak-app-dev-only",
  baseURL,
  trustedOrigins: getTrustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg", // Use PostgreSQL
    schema: schema
  }),
  emailAndPassword: {
    enabled: true,
  },
});
