import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '../_layout';
import { useTheme } from '../../theme/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useUser();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Login Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>

        {/* Logo / branding */}
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 22, backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
          }}>
            <Text style={{ fontSize: 40 }}>🎯</Text>
          </View>
          <Text style={{ fontSize: 30, fontWeight: 'bold', color: colors.text, letterSpacing: 0.5 }}>
            Habit Tracker
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>
            Build better habits, one day at a time
          </Text>
        </View>

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          accessibilityLabel="Email address"
          style={{
            borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 14,
            borderRadius: 10, backgroundColor: colors.surface, color: colors.text, fontSize: 15,
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          accessibilityLabel="Password"
          style={{
            borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 22,
            borderRadius: 10, backgroundColor: colors.surface, color: colors.text, fontSize: 15,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          accessibilityLabel="Login"
          accessibilityRole="button"
          style={{
            backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 10,
            marginBottom: 16, opacity: loading ? 0.6 : 1,
            shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          disabled={loading}
          accessibilityLabel="Go to register screen"
        >
          <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600', fontSize: 14 }}>
            Don't have an account? Register
          </Text>
        </TouchableOpacity>

        {/* Demo hint */}
        <View style={{ marginTop: 32, padding: 14, backgroundColor: colors.surfaceAlt, borderRadius: 10 }}>
          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.muted, fontWeight: '600', marginBottom: 4 }}>
            DEMO ACCOUNT
          </Text>
          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.subtext }}>
            demo@habits.com / demo123
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
