import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const trustedOrigins = ["http://localhost:5173", "http://localhost:3000"];
if (process.env.APP_URL) trustedOrigins.push(process.env.APP_URL);
if (process.env.VERCEL_URL) trustedOrigins.push(`https://${process.env.VERCEL_URL}`);

const baseURL = process.env.BETTER_AUTH_URL
  || (process.env.APP_URL ? `${process.env.APP_URL}/api/auth` : null)
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth` : "http://localhost:5173/api/auth");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-streak-app-dev-only",
  baseURL,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg", // Use PostgreSQL
    schema: schema
  }),
  emailAndPassword: {
    enabled: true,
  },
});
