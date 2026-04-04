import { db } from './client';
import { habitsTable, completionLogsTable, targetsTable, categoriesTable, usersTable } from './schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

// ---- Weekly Streak ----
// Returns the number of consecutive completed weeks (ending last week) where
// the habit met its weeklyTarget. The current (in-progress) week is included
// if the count already meets the target.
export async function getWeeklyStreakForHabit(habitId: number, weeklyTarget: number): Promise<number> {
  const logs = await db
    .select({ completedDate: completionLogsTable.completedDate })
    .from(completionLogsTable)
    .where(and(
      eq(completionLogsTable.habitId, habitId),
      eq(completionLogsTable.isCompleted, 1)
    ));

  // Group completions by the Monday of each week (ISO Monday = week key)
  const byWeek: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(log.completedDate);
    const dow = d.getDay(); // 0 = Sun
    const diff = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const key = monday.toISOString().split('T')[0];
    byWeek[key] = (byWeek[key] || 0) + 1;
  }

  // Find the Monday of the current week
  const now = new Date();
  const dow = now.getDay();
  const daysToMonday = dow === 0 ? -6 : 1 - dow;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  let streak = 0;

  // Include current week if target already met
  const thisKey = thisMonday.toISOString().split('T')[0];
  if ((byWeek[thisKey] || 0) >= weeklyTarget) streak++;

  // Walk backwards through previous weeks
  const cursor = new Date(thisMonday);
  cursor.setDate(cursor.getDate() - 7);
  while (true) {
    const key = cursor.toISOString().split('T')[0];
    if ((byWeek[key] || 0) >= weeklyTarget) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}

// ---- Users ----
export async function getUserByEmail(email: string) {
  return db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
}

export async function createUser(user: { name: string; email: string; password: string }) {
  return db.insert(usersTable).values(user).returning();
}

export async function deleteUser(id: number) {
  return db.delete(usersTable).where(eq(usersTable.id, id));
}

// ---- Categories ----
export async function getAllCategories() {
  return db.select().from(categoriesTable);
}

export async function createCategory(cat: { name: string; color: string }) {
  return db.insert(categoriesTable).values(cat).returning();
}

export async function updateCategory(id: number, updates: { name?: string; color?: string }) {
  return db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
}

export async function deleteCategory(id: number) {
  return db.delete(categoriesTable).where(eq(categoriesTable.id, id));
}

// ---- Habits (with category join) ----
export async function getHabitsByUserId(userId: number) {
  return db
    .select({
      id: habitsTable.id,
      userId: habitsTable.userId,
      name: habitsTable.name,
      categoryId: habitsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      streak: habitsTable.streak,
      completedToday: habitsTable.completedToday,
      createdAt: habitsTable.createdAt,
      notes: habitsTable.notes,
    })
    .from(habitsTable)
    .leftJoin(categoriesTable, eq(habitsTable.categoryId, categoriesTable.id))
    .where(eq(habitsTable.userId, userId));
}

export async function getHabitById(id: number) {
  const rows = await db
    .select({
      id: habitsTable.id,
      userId: habitsTable.userId,
      name: habitsTable.name,
      categoryId: habitsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      streak: habitsTable.streak,
      completedToday: habitsTable.completedToday,
      createdAt: habitsTable.createdAt,
      notes: habitsTable.notes,
    })
    .from(habitsTable)
    .leftJoin(categoriesTable, eq(habitsTable.categoryId, categoriesTable.id))
    .where(eq(habitsTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createHabit(habit: {
  userId: number;
  name: string;
  categoryId: number;
  notes?: string;
}) {
  return db
    .insert(habitsTable)
    .values({ ...habit, streak: 0, completedToday: 0, createdAt: new Date().toISOString() })
    .returning();
}

export async function updateHabit(
  id: number,
  updates: Partial<{ name: string; categoryId: number; streak: number; completedToday: number; notes: string }>
) {
  return db.update(habitsTable).set(updates).where(eq(habitsTable.id, id)).returning();
}

export async function deleteHabit(id: number) {
  return db.delete(habitsTable).where(eq(habitsTable.id, id));
}

// ---- Completion Logs ----
export async function addCompletionLog(log: {
  habitId: number;
  completedDate: string;
  isCompleted: number;
}) {
  return db
    .insert(completionLogsTable)
    .values({ ...log, timestamp: new Date().toISOString() })
    .returning();
}

export async function getCompletionLogsByUserId(userId: number) {
  const userHabits = await db
    .select({ id: habitsTable.id })
    .from(habitsTable)
    .where(eq(habitsTable.userId, userId));

  if (userHabits.length === 0) return [];
  const habitIds = userHabits.map(h => h.id);
  return db
    .select()
    .from(completionLogsTable)
    .where(inArray(completionLogsTable.habitId, habitIds));
}

export async function getCompletionLogsByDateRange(
  userId: number,
  startDate: string,
  endDate: string
) {
  const userHabits = await db
    .select({ id: habitsTable.id })
    .from(habitsTable)
    .where(eq(habitsTable.userId, userId));

  if (userHabits.length === 0) return [];
  const habitIds = userHabits.map(h => h.id);
  return db
    .select()
    .from(completionLogsTable)
    .where(
      and(
        inArray(completionLogsTable.habitId, habitIds),
        gte(completionLogsTable.completedDate, startDate),
        lte(completionLogsTable.completedDate, endDate)
      )
    );
}

// ---- Targets ----
export async function getTargetsByUserId(userId: number) {
  const userHabits = await db
    .select({ id: habitsTable.id })
    .from(habitsTable)
    .where(eq(habitsTable.userId, userId));

  if (userHabits.length === 0) return [];
  const habitIds = userHabits.map(h => h.id);
  return db.select().from(targetsTable).where(inArray(targetsTable.habitId, habitIds));
}

export async function getTargetByHabitId(habitId: number) {
  const rows = await db
    .select()
    .from(targetsTable)
    .where(eq(targetsTable.habitId, habitId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createTarget(target: {
  habitId: number;
  weeklyTarget?: number;
  monthlyTarget?: number;
}) {
  return db.insert(targetsTable).values(target).returning();
}

export async function updateTarget(
  id: number,
  updates: { weeklyTarget?: number; monthlyTarget?: number }
) {
  return db.update(targetsTable).set(updates).where(eq(targetsTable.id, id)).returning();
}
