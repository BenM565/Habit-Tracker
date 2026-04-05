/**
 * Unit test: seedDatabase function
 * Verifies the seed logic builds the correct category map and habit structure
 * without hitting a real database.
 */

// --- Types used by the seed function ---
type Category = { id: number; name: string };
type Habit = { userId: number; name: string; categoryId: number; streak: number; notes: string };
type Target = { habitId: number; weeklyTarget: number; monthlyTarget: number };

// --- Pure helper extracted from seed.ts logic ---
function buildCategoryMap(categories: Category[]): Record<string, number> {
  const map: Record<string, number> = {};
  categories.forEach(c => { map[c.name] = c.id; });
  return map;
}

function buildHabits(
  habitsData: { name: string; category: string; streak: number; notes: string }[],
  catMap: Record<string, number>,
  userId: number
): Habit[] {
  return habitsData.map(h => ({
    userId,
    name: h.name,
    categoryId: catMap[h.category],
    streak: h.streak,
    notes: h.notes,
  }));
}

function buildTargets(habitIds: number[]): Target[] {
  return habitIds.map(habitId => ({ habitId, weeklyTarget: 5, monthlyTarget: 20 }));
}

// --- Tests ---

describe('seedDatabase helpers', () => {
  const mockCategories: Category[] = [
    { id: 1, name: 'Health' },
    { id: 2, name: 'Learning' },
    { id: 3, name: 'Fitness' },
    { id: 4, name: 'Productivity' },
    { id: 5, name: 'Mindfulness' },
  ];

  const mockHabitsData = [
    { name: 'Morning Run',   category: 'Fitness',     streak: 7,  notes: 'Running in the park for 30 minutes' },
    { name: 'Read 30 mins',  category: 'Learning',    streak: 12, notes: 'Reading tech books and articles' },
    { name: 'Meditate',      category: 'Mindfulness', streak: 3,  notes: 'Morning meditation session' },
    { name: 'Drink Water',   category: 'Health',      streak: 25, notes: 'Drink 2 liters of water daily' },
    { name: 'Learn Spanish', category: 'Learning',    streak: 5,  notes: 'Duolingo daily practice' },
    { name: 'Yoga',          category: 'Fitness',     streak: 8,  notes: '30 minutes yoga' },
  ];

  test('buildCategoryMap maps names to ids correctly', () => {
    const map = buildCategoryMap(mockCategories);
    expect(map['Health']).toBe(1);
    expect(map['Learning']).toBe(2);
    expect(map['Fitness']).toBe(3);
    expect(map['Mindfulness']).toBe(5);
    expect(Object.keys(map)).toHaveLength(5);
  });

  test('buildHabits assigns correct categoryId and userId', () => {
    const catMap = buildCategoryMap(mockCategories);
    const habits = buildHabits(mockHabitsData, catMap, 42);

    expect(habits).toHaveLength(6);
    expect(habits[0]).toMatchObject({ name: 'Morning Run', categoryId: 3, userId: 42, streak: 7 });
    expect(habits[1]).toMatchObject({ name: 'Read 30 mins', categoryId: 2, streak: 12 });
    expect(habits[3]).toMatchObject({ name: 'Drink Water', categoryId: 1, streak: 25 });
  });

  test('buildTargets creates one target per habit with correct defaults', () => {
    const habitIds = [10, 20, 30];
    const targets = buildTargets(habitIds);

    expect(targets).toHaveLength(3);
    targets.forEach((t, i) => {
      expect(t.habitId).toBe(habitIds[i]);
      expect(t.weeklyTarget).toBe(5);
      expect(t.monthlyTarget).toBe(20);
    });
  });

  test('all seeded habits have a valid category', () => {
    const catMap = buildCategoryMap(mockCategories);
    const habits = buildHabits(mockHabitsData, catMap, 1);
    habits.forEach(h => {
      expect(h.categoryId).toBeDefined();
      expect(typeof h.categoryId).toBe('number');
    });
  });
});
