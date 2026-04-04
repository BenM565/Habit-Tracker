import { useContext, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HabitContext } from './(tabs)/_layout';
import { useUser } from './_layout';
import { createHabit, createTarget } from '../db/queries';
import { useTheme } from '../theme/ThemeContext';

export default function AddHabitScreen() {
  const router = useRouter();
  const { user } = useUser();
  const context = useContext(HabitContext);
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [weeklyTarget, setWeeklyTarget] = useState('5');
  const [loading, setLoading] = useState(false);

  const categories = context?.categories ?? [];
  const refresh = context?.refresh;

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Habit name is required'); return; }
    if (!categoryId) { Alert.alert('Error', 'Please select a category'); return; }
    if (!user) return;

    setLoading(true);
    try {
      const [newHabit] = await createHabit({ userId: user.id, name: name.trim(), categoryId, notes: notes.trim() || undefined });
      await createTarget({
        habitId: newHabit.id,
        weeklyTarget: parseInt(weeklyTarget) || 5,
        monthlyTarget: (parseInt(weeklyTarget) || 5) * 4,
      });
      await refresh?.();
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not add habit');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 20,
    borderRadius: 8, backgroundColor: colors.surface, color: colors.text,
  };
  const labelStyle = { fontSize: 14, fontWeight: '600' as const, marginBottom: 6, color: colors.text };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={labelStyle}>Habit Name *</Text>
        <TextInput
          placeholder="e.g. Morning Run"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          style={inputStyle}
        />

        <Text style={{ ...labelStyle, marginBottom: 10 }}>Category *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={{
                paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
                backgroundColor: categoryId === cat.id ? cat.color : colors.surface,
                borderWidth: 2, borderColor: cat.color,
              }}
            >
              <Text style={{ color: categoryId === cat.id ? '#fff' : cat.color, fontWeight: '600' }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={labelStyle}>Weekly Target (days)</Text>
        <TextInput
          placeholder="5"
          placeholderTextColor={colors.muted}
          value={weeklyTarget}
          onChangeText={setWeeklyTarget}
          keyboardType="number-pad"
          style={inputStyle}
        />

        <Text style={labelStyle}>Notes (optional)</Text>
        <TextInput
          placeholder="Any notes about this habit..."
          placeholderTextColor={colors.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ ...inputStyle, minHeight: 80 }}
        />

        <TouchableOpacity
          onPress={handleAdd}
          disabled={loading}
          style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            {loading ? 'Adding...' : 'Add Habit'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
