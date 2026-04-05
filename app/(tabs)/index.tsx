import { useContext, useState } from 'react';
import { View, Text, ScrollView, TextInput, FlatList, Alert, TouchableOpacity, Modal } from 'react-native';
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

  // Date-picker modal state
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [pendingHabitId, setPendingHabitId] = useState<number | null>(null);
  const [pendingCurrent, setPendingCurrent] = useState(0);
  const [logDate, setLogDate] = useState('');

  if (!context) return null;
  const { habits, categories, refresh } = context;

  const filteredHabits = habits.filter(habit => {
    const matchesCategory = !selectedCategory || habit.categoryName === selectedCategory;
    const matchesSearch = habit.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedToday = habits.filter(h => h.completedToday === 1).length;
  const totalHabits = habits.length;

  const openLogModal = (id: number, current: number) => {
    setPendingHabitId(id);
    setPendingCurrent(current);
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogModalVisible(true);
  };

  const handleToggle = async () => {
    if (pendingHabitId === null) return;
    const next = pendingCurrent === 1 ? 0 : 1;
    const dateToLog = logDate || new Date().toISOString().split('T')[0];
    setLogModalVisible(false);
    await updateHabit(pendingHabitId, { completedToday: next, streak: next === 1 ? undefined : undefined });
    await addCompletionLog({
      habitId: pendingHabitId,
      completedDate: dateToLog,
      isCompleted: next,
    });
    refresh();
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Habit', `Delete "${name}"? This cannot be undone.`, [
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

        {/* Header / branding */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <Text style={{ fontSize: 20 }}>🎯</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>Habit Tracker</Text>
        </View>
        <Text style={{ fontSize: 15, color: colors.subtext, marginBottom: 16 }}>
          {completedToday} of {totalHabits} habits completed today
        </Text>

        {/* Progress bar */}
        <View
          style={{ height: 8, backgroundColor: colors.progressBg, borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}
          accessibilityLabel={`${completedToday} of ${totalHabits} habits completed`}
          accessibilityRole="progressbar"
        >
          <View style={{
            height: '100%',
            width: `${totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}%`,
            backgroundColor: colors.primary,
          }} />
        </View>

        <QuoteWidget />

        {/* Search */}
        <TextInput
          placeholder="Search habits..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
          accessibilityLabel="Search habits"
          style={{
            borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 6,
            marginBottom: 15, backgroundColor: colors.surface, color: colors.text,
          }}
        />

        {/* Category filter */}
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
                accessibilityLabel={`Filter by ${item.name}`}
                accessibilityState={{ selected: active }}
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
          style={{ marginBottom: 16 }}
        />

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/add-habit')}
            accessibilityLabel="Add new habit"
            style={{ flex: 2, backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>+ ADD NEW HABIT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/categories')}
            accessibilityLabel="Manage categories"
            style={{ flex: 1, backgroundColor: colors.surface, padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>Categories</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: colors.text }}>Your Habits</Text>

        {filteredHabits.length === 0 ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 15, marginBottom: 12 }}>
              No habits found. Add one above!
            </Text>
          </View>
        ) : (
          filteredHabits.map(habit => (
            <View
              key={habit.id}
              accessibilityLabel={`Habit: ${habit.name}`}
              style={{
                backgroundColor: colors.surface, padding: 15, marginBottom: 10,
                borderRadius: 8, borderLeftWidth: 4, borderLeftColor: habit.categoryColor || colors.muted,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id.toString() } })}
                accessibilityLabel={`View details for ${habit.name}`}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text }}>
                  {habit.name}
                </Text>
              </TouchableOpacity>
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
                  onPress={() => openLogModal(habit.id, habit.completedToday)}
                  accessibilityLabel={habit.completedToday === 1 ? `Mark ${habit.name} incomplete` : `Complete ${habit.name}`}
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
                  accessibilityLabel={`Edit ${habit.name}`}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: colors.accent }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(habit.id, habit.name)}
                  accessibilityLabel={`Delete ${habit.name}`}
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

      {/* Log date modal */}
      <Modal visible={logModalVisible} animationType="fade" transparent onRequestClose={() => setLogModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 24, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 6 }}>
              {pendingCurrent === 1 ? 'Mark Incomplete' : 'Log Completion'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
              Choose the date for this log entry
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
              Date (YYYY-MM-DD)
            </Text>
            <TextInput
              value={logDate}
              onChangeText={setLogDate}
              placeholder="e.g. 2026-04-05"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Log date"
              style={{
                borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8,
                backgroundColor: colors.background, color: colors.text, marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setLogModalVisible(false)}
                accessibilityLabel="Cancel log"
                style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ textAlign: 'center', color: colors.subtext, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleToggle}
                accessibilityLabel="Confirm log entry"
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: colors.primary }}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
