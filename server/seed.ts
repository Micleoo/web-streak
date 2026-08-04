import { auth } from './auth';
import { db } from './db';
import { user, quests, friends, achievements, account } from './db/schema';
import { eq, and } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    console.log('🌱 Checking / Seeding demo and test users...');

    // 1. Seed demo user: example@gmail.com / password123
    const demoEmail = 'example@gmail.com';
    const demoPass = 'password123';
    let demoUserRecord = (await db.select().from(user).where(eq(user.email, demoEmail)))[0];

    if (!demoUserRecord) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: demoEmail,
            password: demoPass,
            name: 'Demo User',
          }
        });
        demoUserRecord = (await db.select().from(user).where(eq(user.email, demoEmail)))[0];
      } catch (err) {
        console.log('SignUp error for demo user:', err);
      }
    }

    if (demoUserRecord) {
      await db.update(user).set({
        name: 'Demo User',
        username: 'demouser',
        currentStreak: 5,
        maxStreak: 10,
        totalXp: 250,
        favoriteCategories: JSON.stringify(['coding', 'learning', 'fitness']),
        streakAtRisk: false,
      }).where(eq(user.id, demoUserRecord.id));

      // Check quests for demo user
      const existingQuests = await db.select().from(quests).where(eq(quests.userId, demoUserRecord.id));
      if (existingQuests.length === 0) {
        await db.insert(quests).values([
          {
            userId: demoUserRecord.id,
            name: 'Review TypeScript code',
            category: 'coding',
            estimatedMinutes: 20,
          },
          {
            userId: demoUserRecord.id,
            name: 'Read documentation',
            category: 'learning',
            estimatedMinutes: 15,
          },
          {
            userId: demoUserRecord.id,
            name: 'Daily Workout & Stretch',
            category: 'fitness',
            estimatedMinutes: 30,
          }
        ]);
      }
    }

    // 2. Seed testuser: testuser@example.com / Password123!
    const testEmail = 'testuser@example.com';
    const testPass = 'Password123!';
    let testUserRecord = (await db.select().from(user).where(eq(user.email, testEmail)))[0];

    if (!testUserRecord) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: testEmail,
            password: testPass,
            name: 'Test User',
          }
        });
        testUserRecord = (await db.select().from(user).where(eq(user.email, testEmail)))[0];
      } catch (err) {
        console.log('SignUp error for test user:', err);
      }
    }

    if (testUserRecord) {
      await db.update(user).set({
        name: 'Test User',
        username: 'testuser',
        currentStreak: 3,
        maxStreak: 7,
        totalXp: 150,
        favoriteCategories: JSON.stringify(['coding', 'health']),
        streakAtRisk: false,
      }).where(eq(user.id, testUserRecord.id));

      const existingTestQuests = await db.select().from(quests).where(eq(quests.userId, testUserRecord.id));
      if (existingTestQuests.length === 0) {
        await db.insert(quests).values([
          {
            userId: testUserRecord.id,
            name: 'Morning Routine & Quests',
            category: 'health',
            estimatedMinutes: 15,
          },
          {
            userId: testUserRecord.id,
            name: 'Solve Streak challenge',
            category: 'coding',
            estimatedMinutes: 25,
          }
        ]);
      }
    }

    // 3. Seed additional leaderboard users
    const sampleUsers = [
      { name: 'Alex Coder', email: 'alex@example.com', username: 'alex_coder', streak: 15, xp: 980 },
      { name: 'Sarah Flame', email: 'sarah@example.com', username: 'sarah_flame', streak: 12, xp: 750 },
      { name: 'Michael SF', email: 'michael@example.com', username: 'michael_sf', streak: 8, xp: 520 },
    ];

    for (const sample of sampleUsers) {
      let [rec] = await db.select().from(user).where(eq(user.email, sample.email)).limit(1);
      if (!rec) {
        try {
          await auth.api.signUpEmail({
            body: {
              email: sample.email,
              password: 'Password123!',
              name: sample.name,
            }
          });
          const [created] = await db.select().from(user).where(eq(user.email, sample.email)).limit(1);
          rec = created;
        } catch (e) {
          const [found] = await db.select().from(user).where(eq(user.email, sample.email)).limit(1);
          rec = found;
        }
      }

      if (rec) {
        await db.update(user).set({
          name: sample.name,
          username: sample.username,
          currentStreak: sample.streak,
          maxStreak: sample.streak + 5,
          totalXp: sample.xp,
        }).where(eq(user.id, rec.id));

        // Make friends with demoUser if demoUser exists
        if (demoUserRecord && demoUserRecord.id !== rec.id) {
          const friendExists = await db.select().from(friends).where(
            and(eq(friends.userId, demoUserRecord.id), eq(friends.friendId, rec.id))
          );
          if (friendExists.length === 0) {
            await db.insert(friends).values({
              userId: demoUserRecord.id,
              friendId: rec.id,
              status: 'accepted',
            });
          }
        }
      }
    }

    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('Error during database seed:', error);
  }
}
