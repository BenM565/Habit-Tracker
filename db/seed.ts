import { db } from './client';
import { habitsTable, completionLogsTable, targetsTable, categoriesTable, usersTable } from './schema';
import * as Crypto from 'expo-crypto';

export async function seedDatabase() {
  try {
    // Skip if already seeded
    const existing = await db.select().from(categoriesTable).limit(1);
    if (existing.length > 0) return;

    // Seed categories
    const categoryData = [
      { name: 'Health', color: '#FF6B6B' },
      { name: 'Learning', color: '#4ECDC4' },
      { name: 'Fitness', color: '#45B7D1' },
      { name: 'Productivity', color: '#FFA502' },
      { name: 'Mindfulness', color: '#9C27B0' },
    ];
    const insertedCats = await Promise.all(
      categoryData.map(c =>
        db.insert(categoriesTable).values(c).returning({ id: categoriesTable.id, name: categoriesTable.name })
      )
    );
    const catMap: Record<string, number> = {};
    insertedCats.forEach(([c]) => { catMap[c.name] = c.id; });

    // Seed demo user
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'demo123');
    const [demoUser] = await db
      .insert(usersTable)
      .values({ name: 'Demo User', email: 'demo@habits.com', password: hashed })
      .returning({ id: usersTable.id });

    // Seed habits
    const habitsData = [
      { name: 'Morning Run',   category: 'Fitness',     streak: 7,  notes: 'Running in the park for 30 minutes' },
      { name: 'Read 30 mins',  category: 'Learning',    streak: 12, notes: 'Reading tech books and articles' },
      { name: 'Meditate',      category: 'Mindfulness', streak: 3,  notes: 'Morning meditation session' },
      { name: 'Drink Water',   category: 'Health',      streak: 25, notes: 'Drink 2 liters of water daily' },
      { name: 'Learn Spanish', category: 'Learning',    streak: 5,  notes: 'Duolingo daily practice' },
      { name: 'Yoga',          category: 'Fitness',     streak: 8,  notes: '30 minutes yoga' },
    ];

    const insertedHabits = await Promise.all(
      habitsData.map((h, i) =>
        db.insert(habitsTable).values({
          userId: demoUser.id,
          name: h.name,
          categoryId: catMap[h.category],
          streak: h.streak,
          completedToday: i % 2 === 1 ? 1 : 0,
          createdAt: new Date(Date.now() - h.streak * 86400000).toISOString(),
          notes: h.notes,
        }).returning({ id: habitsTable.id })
      )
    );

    // Seed targets
    await Promise.all(
      insertedHabits.map(([h]) =>
        db.insert(targetsTable).values({ habitId: h.id, weeklyTarget: 5, monthlyTarget: 20 })
      )
    );

    // Seed 30 days of completion logs (~70% completion rate)
    for (const [{ id: habitId }] of insertedHabits) {
      for (let day = 0; day < 30; day++) {
        const date = new Date(Date.now() - day * 86400000);
        await db.insert(completionLogsTable).values({
          habitId,
          completedDate: date.toISOString().split('T')[0],
          isCompleted: Math.random() > 0.3 ? 1 : 0,
          timestamp: date.toISOString(),
        });
      }
    }

    console.log('Database seeded. Demo login: demo@habits.com / demo123');
  } catch (error) {
    console.error('Seed error:', error);
  }
}
