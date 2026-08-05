import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env file');
}

// Fix typo where database name in Vercel env was truncated to /postgr instead of /postgres
connectionString = connectionString.replace(/\/postgr(\?|$)/, '/postgres$1');

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  max: process.env.VERCEL ? 1 : (process.env.NODE_ENV === 'test' ? 1 : 10),
  idle_timeout: process.env.NODE_ENV === 'test' ? 1 : 10,
});
export const db = drizzle(client, { schema });
