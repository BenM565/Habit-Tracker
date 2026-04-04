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
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: colors.text }}>
          Habit Tracker
        </Text>
        <Text style={{ fontSize: 15, textAlign: 'center', color: colors.muted, marginBottom: 40 }}>
          Sign in to continue
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          style={{
            borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 15,
            borderRadius: 8, backgroundColor: colors.surface, color: colors.text,
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          style={{
            borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 20,
            borderRadius: 8, backgroundColor: colors.surface, color: colors.text,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, marginBottom: 20, opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
          <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600' }}>
            Don't have an account? Register
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
