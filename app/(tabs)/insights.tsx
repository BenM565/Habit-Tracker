import { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from './_layout';
import { getCompletionLogsByDateRange, getWeeklyStreakForHabit } from '../../db/queries';
import { useUser } from '../_layout';
import { useTheme } from '../../theme/ThemeContext';

type ViewType = 'daily' | 'weekly' | 'monthly';
type BarItem = { label: string; completed: number; total: number };
type WeeklyStreakItem = { habitName: string; weeklyStreak: number; weeklyTarget: number };

export default function InsightsScreen() {
  const context = useContext(HabitContext);
  const { user } = useUser();
  const { colors } = useTheme();
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [barData, setBarData] = useState<BarItem[]>([]);
  const [weeklyStreaks, setWeeklyStreaks] = useState<WeeklyStreakItem[]>([]);

  const habits = context?.habits ?? [];
  const targets = context?.targets ?? [];

  useEffect(() => {
    if (!user) return;
    loadChartData();
  }, [viewType, user, habits.length]);

  useEffect(() => {
    if (!user || habits.length === 0) return;
    loadWeeklyStreaks();
  }, [habits, targets]);

  const loadWeeklyStreaks = async () => {
    const results: WeeklyStreakItem[] = [];
    for (const t of targets) {
      if (!t.weeklyTarget) continue;
      const habit = habits.find(h => h.id === t.habitId);
      if (!habit) continue;
      const weeklyStreak = await getWeeklyStreakForHabit(t.habitId, t.weeklyTarget);
      results.push({ habitName: habit.name, weeklyStreak, weeklyTarget: t.weeklyTarget });
    }
    setWeeklyStreaks(results);
  };

  const loadChartData = async () => {
    if (!user) return;
    const now = new Date();
    let items: BarItem[] = [];

    if (viewType === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const logs = await getCompletionLogsByDateRange(user.id, dateStr, dateStr);
        const completed = logs.filter(l => l.isCompleted === 1).length;
        items.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), completed, total: habits.length });
      }
    } else if (viewType === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        const logs = await getCompletionLogsByDateRange(
          user.id, start.toISOString().split('T')[0], end.toISOString().split('T')[0]
        );
        const completed = logs.filter(l => l.isCompleted === 1).length;
        items.push({ label: `W${4 - i}`, completed, total: habits.length * 7 });
      }
    } else {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const logs = await getCompletionLogsByDateRange(
          user.id, d.toISOString().split('T')[0], endD.toISOString().split('T')[0]
        );
        const completed = logs.filter(l => l.isCompleted === 1).length;
        items.push({ label: d.toLocaleDateString('en', { month: 'short' }), completed, total: habits.length * endD.getDate() });
      }
    }
    setBarData(items);
  };

  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completedToday === 1).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const avgStreak = totalHabits > 0 ? Math.round(habits.reduce((s, h) => s + h.streak, 0) / totalHabits) : 0;
  const bestStreak = totalHabits > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const maxBar = Math.max(...barData.map(d => d.completed), 1);

  const byCategory: Record<string, { completed: number; total: number }> = {};
  habits.forEach(h => {
    const name = h.categoryName ?? 'Uncategorised';
    if (!byCategory[name]) byCategory[name] = { completed: 0, total: 0 };
    byCategory[name].total++;
    if (h.completedToday === 1) byCategory[name].completed++;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: colors.text }}>Insights</Text>

        {/* Key stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Today', value: `${completionRate}%`, color: colors.primary },
            { label: 'Avg Streak', value: `${avgStreak}d`, color: colors.accent },
            { label: 'Best Streak', value: `${bestStreak}d`, color: colors.warning },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: colors.surface, padding: 15, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>{s.label}</Text>
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: s.color }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Chart */}
        <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>Completion Chart</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {(['daily', 'weekly', 'monthly'] as const).map(v => (
              <TouchableOpacity
                key={v}
                onPress={() => setViewType(v)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 6,
                  backgroundColor: viewType === v ? colors.primary : colors.surfaceAlt,
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', fontSize: 12, color: viewType === v ? '#fff' : colors.subtext, textTransform: 'capitalize' }}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {barData.map((item, i) => {
              const barH = maxBar > 0 ? (item.completed / maxBar) * 120 : 0;
              return (
                <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.muted }}>{item.completed}</Text>
                  <View style={{ width: 28, height: Math.max(barH, 2), backgroundColor: colors.primary, borderRadius: 4 }} />
                  <Text style={{ fontSize: 10, color: colors.subtext, fontWeight: '600' }}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weekly Streak Tracking */}
        {weeklyStreaks.length > 0 && (
          <View style={{ backgroundColor: colors.surface, padding: 15, borderRadius: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4, color: colors.text }}>🗓 Weekly Streaks</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>Consecutive weeks where weekly target was met</Text>
            {weeklyStreaks.map((item, i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{item.habitName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 18 }}>🔥</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: item.weeklyStreak > 0 ? colors.primary : colors.muted }}>
                      {item.weeklyStreak}w
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  Target: {item.weeklyTarget} days/week
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* By category */}
        <View style={{ backgroundColor: colors.surface, padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: colors.text }}>By Category</Text>
          {Object.entries(byCategory).map(([cat, data]) => {
            const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
            return (
              <View key={cat} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{cat}</Text>
                  <Text style={{ fontSize: 14, color: colors.subtext }}>{rate}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: colors.progressBg, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${rate}%`, backgroundColor: colors.primary }} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Targets progress */}
        {targets.length > 0 && (
          <View style={{ backgroundColor: colors.surface, padding: 15, borderRadius: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: colors.text }}>Weekly Targets</Text>
            {targets.map(t => {
              const habit = habits.find(h => h.id === t.habitId);
              if (!habit || !t.weeklyTarget) return null;
              const progress = Math.min(habit.streak, t.weeklyTarget);
              const pct = Math.round((progress / t.weeklyTarget) * 100);
              const met = progress >= t.weeklyTarget;
              return (
                <View key={t.id} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{habit.name}</Text>
                    <Text style={{ fontSize: 12, color: met ? colors.primary : colors.warning, fontWeight: '600' }}>
                      {progress}/{t.weeklyTarget} {met ? '✓' : ''}
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: colors.progressBg, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: met ? colors.primary : colors.warning }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Top streaks */}
        <View style={{ backgroundColor: colors.surface, padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15, color: colors.text }}>🔥 Top Streaks</Text>
          {[...habits].sort((a, b) => b.streak - a.streak).slice(0, 3).map((h, i) => (
            <View key={h.id} style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{i + 1}. {h.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{h.streak} days • {h.categoryName}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
