import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getHabitById, deleteHabit, getTargetByHabitId } from '../../db/queries';
import { useTheme } from '../../theme/ThemeContext';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [habit, setHabit] = useState<Awaited<ReturnType<typeof getHabitById>>>(null);
  const [target, setTarget] = useState<Awaited<ReturnType<typeof getTargetByHabitId>>>(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const [h, t] = await Promise.all([
      getHabitById(Number(id)),
      getTargetByHabitId(Number(id)),
    ]);
    setHabit(h);
    setTarget(t);
  };

  const handleDelete = () => {
    Alert.alert('Delete Habit', 'This will permanently delete this habit and all its logs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteHabit(Number(id)); router.back(); },
      },
    ]);
  };

  if (!habit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ padding: 20, color: colors.muted }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{
          backgroundColor: colors.surface, padding: 20, borderRadius: 12, marginBottom: 16,
          borderLeftWidth: 6, borderLeftColor: habit.categoryColor || colors.primary,
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>{habit.name}</Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 4 }}>Category: {habit.categoryName}</Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 4 }}>🔥 Streak: {habit.streak} days</Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 4 }}>
            Status: {habit.completedToday === 1 ? '✅ Completed today' : '⏳ Not done today'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 4 }}>
            Started: {new Date(habit.createdAt).toLocaleDateString()}
          </Text>
          {habit.notes ? (
            <Text style={{ fontSize: 14, color: colors.subtext, fontStyle: 'italic', marginTop: 8 }}>"{habit.notes}"</Text>
          ) : null}
        </View>

        {target && (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.text }}>Targets</Text>
            <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 4 }}>
              Weekly: {target.weeklyTarget ?? '-'} days
            </Text>
            <Text style={{ fontSize: 14, color: colors.subtext }}>
              Monthly: {target.monthlyTarget ?? '-'} days
            </Text>
            {target.weeklyTarget && (
              <View style={{ marginTop: 12 }}>
                <View style={{ height: 8, backgroundColor: colors.progressBg, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    width: `${Math.min((habit.streak / target.weeklyTarget) * 100, 100)}%`,
                    backgroundColor: habit.streak >= target.weeklyTarget ? colors.primary : colors.warning,
                  }} />
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                  {habit.streak >= target.weeklyTarget ? 'Weekly target met! 🎉' : `${target.weeklyTarget - habit.streak} days to weekly target`}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/habit/[id]/edit', params: { id: id.toString() } })}
            style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Edit Habit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={{ backgroundColor: colors.danger, padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Delete Habit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
