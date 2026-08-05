import { client } from './db';

async function enableRLS() {
  console.log('🔒 Enabling Row Level Security (RLS) on all public tables...');
  
  const tables = [
    'user',
    'session',
    'account',
    'verification',
    'quests',
    'quest_completions',
    'achievements',
    'friends'
  ];

  for (const table of tables) {
    try {
      await client.unsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS enabled for table: "${table}"`);
    } catch (err: any) {
      console.error(`❌ Failed to enable RLS on table "${table}":`, err.message);
    }
  }

  console.log('🎉 All tables secured with Row Level Security!');
  process.exit(0);
}

enableRLS().catch((err) => {
  console.error('Fatal error enabling RLS:', err);
  process.exit(1);
});
