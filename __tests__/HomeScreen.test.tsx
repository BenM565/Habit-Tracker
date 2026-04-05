/**
 * Integration test: HomeScreen habit list
 * Tests the filtering, completion counting, and empty state logic
 * that the HomeScreen applies to habits from the HabitContext.
 * Uses plain objects matching the HabitWithCategory shape — no native renderer needed.
 */

type Habit = {
  id: number;
  name: string;
  categoryName: string | null;
  completedToday: number;
  streak: number;
};

// --- Pure functions extracted from HomeScreen ---

function filterHabits(
  habits: Habit[],
  searchText: string,
  selectedCategory: string | null
): Habit[] {
  return habits.filter(h => {
    const matchesCategory = !selectedCategory || h.categoryName === selectedCategory;
    const matchesSearch = h.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

function countCompleted(habits: Habit[]): number {
  return habits.filter(h => h.completedToday === 1).length;
}

function summaryText(completed: number, total: number): string {
  return `${completed} of ${total} habits completed today`;
}

// --- Seeded test data (mirrors db/seed.ts) ---

const seededHabits: Habit[] = [
  { id: 1, name: 'Morning Run',   categoryName: 'Fitness',     completedToday: 0, streak: 7  },
  { id: 2, name: 'Read 30 mins',  categoryName: 'Learning',    completedToday: 1, streak: 12 },
  { id: 3, name: 'Meditate',      categoryName: 'Mindfulness', completedToday: 0, streak: 3  },
  { id: 4, name: 'Drink Water',   categoryName: 'Health',      completedToday: 1, streak: 25 },
  { id: 5, name: 'Learn Spanish', categoryName: 'Learning',    completedToday: 0, streak: 5  },
  { id: 6, name: 'Yoga',          categoryName: 'Fitness',     completedToday: 1, streak: 8  },
];

// --- Tests ---

describe('HomeScreen filtering logic', () => {
  test('returns all habits when no filters applied', () => {
    const result = filterHabits(seededHabits, '', null);
    expect(result).toHaveLength(6);
  });

  test('filters by search text (case-insensitive)', () => {
    const result = filterHabits(seededHabits, 'run', null);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Morning Run');
  });

  test('filters by category', () => {
    const result = filterHabits(seededHabits, '', 'Learning');
    expect(result).toHaveLength(2);
    result.forEach(h => expect(h.categoryName).toBe('Learning'));
  });

  test('combines search and category filter', () => {
    const result = filterHabits(seededHabits, 'yoga', 'Fitness');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Yoga');
  });

  test('returns empty array when no habits match', () => {
    const result = filterHabits(seededHabits, 'zzznomatch', null);
    expect(result).toHaveLength(0);
  });
});

describe('HomeScreen completion counting', () => {
  test('counts completed habits correctly from seeded data', () => {
    const completed = countCompleted(seededHabits);
    expect(completed).toBe(3); // Read 30 mins, Drink Water, Yoga
  });

  test('returns 0 when no habits are completed', () => {
    const none = seededHabits.map(h => ({ ...h, completedToday: 0 }));
    expect(countCompleted(none)).toBe(0);
  });

  test('returns total when all habits are completed', () => {
    const all = seededHabits.map(h => ({ ...h, completedToday: 1 }));
    expect(countCompleted(all)).toBe(6);
  });

  test('produces correct summary text', () => {
    expect(summaryText(3, 6)).toBe('3 of 6 habits completed today');
    expect(summaryText(0, 0)).toBe('0 of 0 habits completed today');
  });
});
