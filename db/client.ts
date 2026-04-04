import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const sqlite = openDatabaseSync('habittracker.db');

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    categoryId INTEGER NOT NULL,
    streak INTEGER NOT NULL DEFAULT 0,
    completedToday INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(categoryId) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS completion_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitId INTEGER NOT NULL,
    completedDate TEXT NOT NULL,
    isCompleted INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(habitId) REFERENCES habits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitId INTEGER NOT NULL,
    weeklyTarget INTEGER,
    monthlyTarget INTEGER,
    FOREIGN KEY(habitId) REFERENCES habits(id) ON DELETE CASCADE
  );
`);

export const db = drizzle(sqlite, { schema });
export { schema };
