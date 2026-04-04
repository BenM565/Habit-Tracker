import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useUser } from '../_layout';
import { getHabitsByUserId, getAllCategories, getTargetsByUserId } from '../../db/queries';
import { useTheme } from '../../theme/ThemeContext';

export type HabitWithCategory = {
  id: number;
  userId: number;
  name: string;
  categoryId: number;
  categoryName: string | null;
  categoryColor: string | null;
  streak: number;
  completedToday: number;
  createdAt: string;
  notes: string | null;
};

export type Category = {
  id: number;
  name: string;
  color: string;
};

export type Target = {
  id: number;
  habitId: number;
  weeklyTarget: number | null;
  monthlyTarget: number | null;
};

type ContextType = {
  habits: HabitWithCategory[];
  categories: Category[];
  targets: Target[];
  refresh: () => Promise<void>;
};

export const HabitContext = createContext<ContextType | null>(null);

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within TabLayout');
  return ctx;
}

export default function TabLayout() {
  const { user } = useUser();
  const { colors } = useTheme();
  const [habits, setHabits] = useState<HabitWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [h, c, t] = await Promise.all([
      getHabitsByUserId(user.id),
      getAllCategories(),
      getTargetsByUserId(user.id),
    ]);
    setHabits(h as HabitWithCategory[]);
    setCategories(c);
    setTargets(t);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <HabitContext.Provider value={{ habits, categories, targets, refresh }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />
      </Tabs>
    </HabitContext.Provider>
  );
}
