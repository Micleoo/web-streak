import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Running migrations...');
  const migrationClient = postgres(process.env.DATABASE_URL as string, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // This will run migrations on the database, skipping the ones already applied
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
    console.log('Migrations complete!');
  } catch (err) {
    console.error('Migration failed!', err);
  } finally {
    await migrationClient.end();
  }
}

main();
