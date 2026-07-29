import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function dropTables() {
  const sql = postgres(process.env.DATABASE_URL as string);
  try {
    await sql`DROP TABLE IF EXISTS quest_completions CASCADE`;
    await sql`DROP TABLE IF EXISTS quests CASCADE`;
    await sql`DROP TABLE IF EXISTS "user" CASCADE`;
    await sql`DROP TABLE IF EXISTS "session" CASCADE`;
    await sql`DROP TABLE IF EXISTS "account" CASCADE`;
    await sql`DROP TABLE IF EXISTS "verification" CASCADE`;
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    console.log("Old tables dropped successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

dropTables();
