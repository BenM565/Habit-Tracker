import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Button, FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from './_layout';

export default function HomeScreen() {
  const router = useRouter();
  const context = useContext(HabitContext);

  if (!context) return null;

  const { habits, setHabits, categories } = context;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const filteredHabits = habits.filter(habit => {
    const matchesCategory = !selectedCategory || habit.category === selectedCategory;
    const matchesSearch = habit.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedToday = filteredHabits.filter(h => h.completedToday).length;
  const totalFiltered = filteredHabits.length;

  const handleToggleCompletion = (id: number) => {
    const updated = habits.map(h =>
      h.id === id
        ? { ...h, completedToday: !h.completedToday, streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1) }
        : h
    );
    setHabits(updated);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>
          Habit Tracker
        </Text>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 20 }}>
          {completedToday} of {totalFiltered} habits completed today
        </Text>

        <View
          style={{
            height: 8,
            backgroundColor: '#ddd',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${totalFiltered > 0 ? (completedToday / totalFiltered) * 100 : 0}%`,
              backgroundColor: '#4CAF50',
            }}
          />
        </View>

        <TextInput
          placeholder="Search habits..."
          value={searchText}
          onChangeText={setSearchText}
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 10,
            borderRadius: 6,
            marginBottom: 15,
            backgroundColor: '#fff',
          }}
        />

        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10, color: '#666' }}>
          Filter by Category:
        </Text>
        <FlatList
          data={[{ id: 0, name: 'All', color: '#999' }, ...categories]}
          horizontal
          scrollEnabled={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Button
              title={item.name}
              onPress={() => setSelectedCategory(item.id === 0 ? null : item.name)}
              color={
                (item.id === 0 && !selectedCategory) || item.name === selectedCategory
                  ? item.color
                  : '#ccc'
              }
            />
          )}
          style={{ marginBottom: 20 }}
        />

        <Button
          title="+ Add New Habit"
          onPress={() => router.push('/add-habit')}
          color="#4CAF50"
        />

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10 }}>
          Your Habits
        </Text>

        {filteredHabits.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>
            No habits found. Add one above!
          </Text>
        ) : (
          filteredHabits.map((habit) => {
            const category = categories.find(c => c.name === habit.category);
            return (
              <View
                key={habit.id}
                style={{
                  backgroundColor: '#fff',
                  padding: 15,
                  marginBottom: 10,
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: category?.color || '#999',
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}
                  onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id.toString() } })}
                >
                  {habit.name}
                </Text>
                <Text style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  {habit.category} • Streak: {habit.streak} days
                </Text>
                {habit.notes && (
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 8, fontStyle: 'italic' }}>
                    "{habit.notes}"
                  </Text>
                )}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button
                    title={habit.completedToday ? '✓ Done' : 'Complete'}
                    onPress={() => handleToggleCompletion(habit.id)}
                    color={habit.completedToday ? '#4CAF50' : '#999'}
                  />
                  <Button
                    title="Edit"
                    onPress={() => router.push({ pathname: '/habit/[id]/edit', params: { id: habit.id.toString() } })}
                    color="#2196F3"
                  />
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}