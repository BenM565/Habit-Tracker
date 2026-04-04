import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
});

export const categoriesTable = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
});

export const habitsTable = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  categoryId: integer('categoryId').notNull().references(() => categoriesTable.id),
  streak: integer('streak').notNull().default(0),
  completedToday: integer('completedToday').notNull().default(0),
  createdAt: text('createdAt').notNull(),
  notes: text('notes'),
});

export const completionLogsTable = sqliteTable('completion_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habitId').notNull().references(() => habitsTable.id),
  completedDate: text('completedDate').notNull(),
  isCompleted: integer('isCompleted').notNull(),
  timestamp: text('timestamp').notNull(),
});

export const targetsTable = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habitId').notNull().references(() => habitsTable.id),
  weeklyTarget: integer('weeklyTarget'),
  monthlyTarget: integer('monthlyTarget'),
});
