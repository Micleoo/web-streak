import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  baseURL: "http://localhost:5173/api/auth",
  trustedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  database: drizzleAdapter(db, {
    provider: "pg", // Use PostgreSQL
    schema: schema
  }),
  emailAndPassword: {
    enabled: true,
  },
  // In a real app we might want session/JWT config here
});
