import { useContext, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from './_layout';
import { useTheme } from '../../theme/ThemeContext';

export default function SearchScreen() {
  const context = useContext(HabitContext);
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [streakFilter, setStreakFilter] = useState<'all' | 'high' | 'low'>('all');

  if (!context) return null;
  const { habits, categories } = context;

  const filteredHabits = habits.filter(habit => {
    const matchesText = habit.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !selectedCategory || habit.categoryName === selectedCategory;
    const matchesStreak =
      streakFilter === 'all' ? true :
      streakFilter === 'high' ? habit.streak >= 7 :
      habit.streak < 7;
    return matchesText && matchesCategory && matchesStreak;
  });

  const activeFilters =
    (searchText ? 1 : 0) + (selectedCategory ? 1 : 0) + (streakFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory(null);
    setStreakFilter('all');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>Search & Filter</Text>
          {activeFilters > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>Clear ({activeFilters})</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          placeholder="Search by name..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
          style={{
            borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8,
            backgroundColor: colors.surface, marginBottom: 20, color: colors.text,
          }}
        />

        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10, color: colors.text }}>Filter by Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              style={{
                paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6,
                backgroundColor: selectedCategory === cat.name ? colors.primary : colors.surface,
                borderWidth: 1, borderColor: selectedCategory === cat.name ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: selectedCategory === cat.name ? '#fff' : colors.subtext, fontWeight: '500', fontSize: 12 }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10, color: colors.text }}>Filter by Streak</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(['all', 'high', 'low'] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setStreakFilter(f)}
              style={{
                flex: 1, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6,
                backgroundColor: streakFilter === f ? colors.primary : colors.surface,
                borderWidth: 1, borderColor: streakFilter === f ? colors.primary : colors.border,
              }}
            >
              <Text style={{ textAlign: 'center', color: streakFilter === f ? '#fff' : colors.subtext, fontWeight: '500', fontSize: 12 }}>
                {f === 'all' ? 'All' : f === 'high' ? '7+ days' : 'Under 7'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
          Results ({filteredHabits.length})
        </Text>

        {filteredHabits.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>No habits match your filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredHabits.map(habit => (
            <View
              key={habit.id}
              style={{
                backgroundColor: colors.surface, padding: 15, marginBottom: 10,
                borderRadius: 8, borderLeftWidth: 4, borderLeftColor: habit.categoryColor || colors.muted,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text }}>{habit.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
                {habit.categoryName} • Streak: {habit.streak} days{habit.completedToday === 1 ? ' ✓' : ''}
              </Text>
              <View style={{ height: 6, backgroundColor: colors.progressBg, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <View style={{
                  height: '100%',
                  width: `${Math.min((habit.streak / 30) * 100, 100)}%`,
                  backgroundColor: habit.streak >= 7 ? colors.primary : colors.warning,
                }} />
              </View>
              {habit.completedToday === 1 && (
                <View style={{ backgroundColor: colors.primary + '22', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>Completed today</Text>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
