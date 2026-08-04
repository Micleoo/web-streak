import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env file');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  max: process.env.VERCEL ? 1 : 10,
});
export const db = drizzle(client, { schema });
