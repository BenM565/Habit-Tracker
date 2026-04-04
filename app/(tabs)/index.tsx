import { useContext, useState } from 'react';
import { View, Text, ScrollView, TextInput, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HabitContext } from './_layout';
import { updateHabit, addCompletionLog, deleteHabit } from '../../db/queries';
import { useTheme } from '../../theme/ThemeContext';
import QuoteWidget from '../../components/QuoteWidget';

export default function HomeScreen() {
  const router = useRouter();
  const context = useContext(HabitContext);
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  if (!context) return null;
  const { habits, categories, refresh } = context;

  const filteredHabits = habits.filter(habit => {
    const matchesCategory = !selectedCategory || habit.categoryName === selectedCategory;
    const matchesSearch = habit.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedToday = filteredHabits.filter(h => h.completedToday === 1).length;
  const totalFiltered = filteredHabits.length;

  const handleToggle = async (id: number, current: number) => {
    const next = current === 1 ? 0 : 1;
    await updateHabit(id, { completedToday: next });
    await addCompletionLog({
      habitId: id,
      completedDate: new Date().toISOString().split('T')[0],
      isCompleted: next,
    });
    refresh();
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Habit', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteHabit(id); refresh(); },
      },
    ]);
  };

  const allCategories = [{ id: 0, name: 'All', color: colors.muted }, ...categories];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 6, color: colors.text }}>Habit Tracker</Text>
        <Text style={{ fontSize: 16, color: colors.subtext, marginBottom: 16 }}>
          {completedToday} of {totalFiltered} habits completed today
        </Text>

        <View style={{ height: 8, backgroundColor: colors.progressBg, borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
          <View style={{
            height: '100%',
            width: `${totalFiltered > 0 ? (completedToday / totalFiltered) * 100 : 0}%`,
            backgroundColor: colors.primary,
          }} />
        </View>

        <QuoteWidget />

        <TextInput
          placeholder="Search habits..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
          style={{
            borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 6,
            marginBottom: 15, backgroundColor: colors.surface, color: colors.text,
          }}
        />

        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10, color: colors.subtext }}>
          Filter by Category:
        </Text>
        <FlatList
          data={allCategories}
          horizontal
          scrollEnabled={false}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const active = (item.id === 0 && !selectedCategory) || item.name === selectedCategory;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id === 0 ? null : item.name)}
                style={{
                  paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, marginRight: 8,
                  backgroundColor: active ? item.color : colors.surface,
                  borderWidth: 1, borderColor: active ? item.color : colors.border,
                }}
              >
                <Text style={{ color: active ? '#fff' : colors.subtext, fontWeight: '600', fontSize: 12 }}>
                  {item.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={{ marginBottom: 20 }}
        />

        <TouchableOpacity
          onPress={() => router.push('/add-habit')}
          style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 8, marginBottom: 20, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>+ ADD NEW HABIT</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: colors.text }}>Your Habits</Text>

        {filteredHabits.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 20 }}>
            No habits found. Add one above!
          </Text>
        ) : (
          filteredHabits.map(habit => (
            <View
              key={habit.id}
              style={{
                backgroundColor: colors.surface, padding: 15, marginBottom: 10,
                borderRadius: 8, borderLeftWidth: 4, borderLeftColor: habit.categoryColor || colors.muted,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text }}
                onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id.toString() } })}
              >
                {habit.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
                {habit.categoryName} • Streak: {habit.streak} days
              </Text>
              {habit.notes ? (
                <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 8, fontStyle: 'italic' }}>
                  "{habit.notes}"
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleToggle(habit.id, habit.completedToday)}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center',
                    backgroundColor: habit.completedToday === 1 ? colors.primary : colors.surfaceAlt,
                  }}
                >
                  <Text style={{ color: habit.completedToday === 1 ? '#fff' : colors.subtext, fontWeight: '600', fontSize: 13 }}>
                    {habit.completedToday === 1 ? '✓ DONE' : 'COMPLETE'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/habit/[id]/edit', params: { id: habit.id.toString() } })}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: colors.accent }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(habit.id)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: colors.danger }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
