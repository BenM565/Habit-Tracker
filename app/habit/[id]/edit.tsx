import { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getHabitById, updateHabit, getAllCategories, getTargetByHabitId, updateTarget } from '../../../db/queries';
import { HabitContext } from '../../(tabs)/_layout';
import { useTheme } from '../../../theme/ThemeContext';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const context = useContext(HabitContext);
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [weeklyTarget, setWeeklyTarget] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string; color: string }[]>([]);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const [habit, cats, target] = await Promise.all([
      getHabitById(Number(id)),
      getAllCategories(),
      getTargetByHabitId(Number(id)),
    ]);
    if (habit) {
      setName(habit.name);
      setNotes(habit.notes ?? '');
      setCategoryId(habit.categoryId);
    }
    setCategories(cats);
    if (target) {
      setTargetId(target.id);
      setWeeklyTarget(target.weeklyTarget?.toString() ?? '');
      setMonthlyTarget(target.monthlyTarget?.toString() ?? '');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId) {
      Alert.alert('Error', 'Name and category are required');
      return;
    }
    setLoading(true);
    try {
      await updateHabit(Number(id), { name: name.trim(), categoryId, notes: notes.trim() || undefined });
      if (targetId) {
        await updateTarget(targetId, {
          weeklyTarget: parseInt(weeklyTarget) || undefined,
          monthlyTarget: parseInt(monthlyTarget) || undefined,
        });
      }
      await context?.refresh();
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save changes');
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
        <Text style={labelStyle}>Habit Name</Text>
        <TextInput value={name} onChangeText={setName} placeholderTextColor={colors.muted} style={inputStyle} />

        <Text style={labelStyle}>Category</Text>
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
        <TextInput value={weeklyTarget} onChangeText={setWeeklyTarget} keyboardType="number-pad" placeholderTextColor={colors.muted} style={inputStyle} />

        <Text style={labelStyle}>Monthly Target (days)</Text>
        <TextInput value={monthlyTarget} onChangeText={setMonthlyTarget} keyboardType="number-pad" placeholderTextColor={colors.muted} style={inputStyle} />

        <Text style={labelStyle}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.muted}
          style={{ ...inputStyle, minHeight: 80 }}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
