import { useContext, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitContext } from './(tabs)/_layout';
import { createCategory, updateCategory, deleteCategory } from '../db/queries';
import { useTheme } from '../theme/ThemeContext';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA502', '#9C27B0',
  '#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#607D8B',
  '#795548', '#00BCD4', '#8BC34A', '#FF5722', '#673AB7',
];

export default function CategoriesScreen() {
  const context = useContext(HabitContext);
  const { colors } = useTheme();
  const categories = context?.categories ?? [];
  const refresh = context?.refresh;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setSelectedColor(PRESET_COLORS[0]);
    setModalVisible(true);
  };

  const openEdit = (cat: { id: number; name: string; color: string }) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSelectedColor(cat.color);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), color: selectedColor });
      } else {
        await createCategory({ name: name.trim(), color: selectedColor });
      }
      await refresh?.();
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save category. Name may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (cat: { id: number; name: string }) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Habits using this category will be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
              await refresh?.();
            } catch {
              Alert.alert('Error', 'Could not delete category. It may be in use by habits.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>Categories</Text>
          <TouchableOpacity
            onPress={openAdd}
            accessibilityLabel="Add new category"
            style={{ backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {categories.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 30, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: colors.muted, marginBottom: 12 }}>No categories yet</Text>
            <TouchableOpacity onPress={openAdd}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Add your first category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          categories.map(cat => (
            <View
              key={cat.id}
              style={{
                backgroundColor: colors.surface, borderRadius: 10, marginBottom: 10,
                flexDirection: 'row', alignItems: 'center', padding: 14,
                borderLeftWidth: 5, borderLeftColor: cat.color,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{cat.name}</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{cat.color}</Text>
              </View>
              <TouchableOpacity
                onPress={() => openEdit(cat)}
                accessibilityLabel={`Edit ${cat.name}`}
                style={{ backgroundColor: colors.accent, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginRight: 8 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(cat)}
                accessibilityLabel={`Delete ${cat.name}`}
                style={{ backgroundColor: colors.danger, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>
              {editingId ? 'Edit Category' : 'New Category'}
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Fitness"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Category name"
              style={{
                borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8,
                backgroundColor: colors.background, color: colors.text, marginBottom: 20,
              }}
            />

            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 }}>Colour</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  accessibilityLabel={`Select colour ${c}`}
                  style={{
                    width: 36, height: 36, borderRadius: 18, backgroundColor: c,
                    borderWidth: selectedColor === c ? 3 : 0,
                    borderColor: colors.text,
                  }}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
              >
                <Text style={{ textAlign: 'center', color: colors.subtext, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                accessibilityLabel={editingId ? 'Save category changes' : 'Create category'}
                style={{ flex: 2, padding: 14, borderRadius: 8, backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>
                  {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Category'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
