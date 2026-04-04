import { useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useUser } from '../_layout';
import { HabitContext } from './_layout';
import { useTheme } from '../../theme/ThemeContext';
import { getCompletionLogsByUserId } from '../../db/queries';
import {
  scheduleReminder, cancelReminder, loadNotificationSettings,
  NOTIFICATION_TIMES,
} from '../../utils/notifications';

export default function ProfileScreen() {
  const { user, logout, deleteProfile } = useUser();
  const context = useContext(HabitContext);
  const { colors, isDark, toggleTheme } = useTheme();
  const habits = context?.habits ?? [];

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(9);
  const [notifMinute, setNotifMinute] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadNotificationSettings().then(({ enabled, hour, minute }) => {
      setNotifEnabled(enabled);
      setNotifHour(hour);
      setNotifMinute(minute);
    });
  }, []);

  const handleNotifToggle = async (value: boolean) => {
    setNotifLoading(true);
    try {
      if (value) {
        const ok = await scheduleReminder(notifHour, notifMinute);
        if (!ok) {
          Alert.alert('Permission denied', 'Please enable notifications in your device settings.');
          setNotifLoading(false);
          return;
        }
      } else {
        await cancelReminder();
      }
      setNotifEnabled(value);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleTimeSelect = async (hour: number, minute: number) => {
    setNotifHour(hour);
    setNotifMinute(minute);
    if (notifEnabled) {
      setNotifLoading(true);
      try {
        await scheduleReminder(hour, minute);
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const logs = await getCompletionLogsByUserId(user.id);

      const header = 'Habit ID,Habit Name,Date,Completed,Timestamp\n';
      const rows = logs.map(log => {
        const habit = habits.find(h => h.id === log.habitId);
        const name = habit ? `"${habit.name.replace(/"/g, '""')}"` : log.habitId;
        return `${log.habitId},${name},${log.completedDate},${log.isCompleted === 1 ? 'Yes' : 'No'},${log.timestamp}`;
      }).join('\n');

      const csv = header + rows;
      const fileUri = FileSystem.documentDirectory + `habit_export_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Habit Data' });
      } else {
        Alert.alert('Exported', `File saved to:\n${fileUri}`);
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Profile',
      'This will permanently delete your account and all your habits. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteProfile },
      ]
    );
  };

  const completedToday = habits.filter(h => h.completedToday === 1).length;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  const selectedTimeLabel = NOTIFICATION_TIMES.find(t => t.hour === notifHour && t.minute === notifMinute)?.label ?? '9:00 AM';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: colors.text }}>Profile</Text>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 32, color: '#fff', fontWeight: 'bold' }}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>{user?.name}</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total Habits', value: habits.length },
            { label: 'Done Today', value: completedToday },
            { label: 'Best Streak', value: `${bestStreak}d` },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: colors.surface, padding: 14, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.primary }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Appearance */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, padding: 14, paddingBottom: 6, textTransform: 'uppercase' }}>
            Appearance
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Dark Mode</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{isDark ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, padding: 14, paddingBottom: 6, textTransform: 'uppercase' }}>
            Notifications
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: notifEnabled ? 0 : 14 }}>
            <View>
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Daily Reminder</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {notifEnabled ? `Enabled · ${selectedTimeLabel}` : 'Disabled'}
              </Text>
            </View>
            {notifLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Switch
                value={notifEnabled}
                onValueChange={handleNotifToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>
          {notifEnabled && (
            <View style={{ padding: 14, paddingTop: 10 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Reminder time</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {NOTIFICATION_TIMES.map(t => {
                  const active = t.hour === notifHour && t.minute === notifMinute;
                  return (
                    <TouchableOpacity
                      key={t.label}
                      onPress={() => handleTimeSelect(t.hour, t.minute)}
                      style={{
                        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
                        backgroundColor: active ? colors.primary : colors.surfaceAlt,
                        borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: active ? '#fff' : colors.subtext, fontWeight: '600' }}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Data */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, padding: 14, paddingBottom: 6, textTransform: 'uppercase' }}>
            Data
          </Text>
          <TouchableOpacity
            onPress={handleExportCSV}
            disabled={exportLoading}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 }}
          >
            <View>
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>Export to CSV</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Download all completion logs</Text>
            </View>
            {exportLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={{ fontSize: 20, color: colors.primary }}>↓</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Account info */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, padding: 14, paddingBottom: 6, textTransform: 'uppercase' }}>
            Account
          </Text>
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 14, color: colors.subtext }}>Name</Text>
              <Text style={{ fontSize: 14, color: colors.text }}>{user?.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
              <Text style={{ fontSize: 14, color: colors.subtext }}>Email</Text>
              <Text style={{ fontSize: 14, color: colors.text }}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.primary }}
        >
          <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', fontSize: 16 }}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.danger }}
        >
          <Text style={{ textAlign: 'center', color: colors.danger, fontWeight: '600', fontSize: 16 }}>Delete Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
