import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '../_layout';
import { useTheme } from '../../theme/ThemeContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useUser();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Error', 'Fill in all fields');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be 6+ characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (e) {
      Alert.alert('Registration Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12,
    borderRadius: 8, backgroundColor: colors.surface, color: colors.text,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: colors.text }}>
          Create Account
        </Text>
        <Text style={{ fontSize: 15, textAlign: 'center', color: colors.muted, marginBottom: 40 }}>
          Start tracking your habits
        </Text>

        <TextInput placeholder="Full Name" placeholderTextColor={colors.muted} value={name} onChangeText={setName} editable={!loading} style={inputStyle} />
        <TextInput placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} style={inputStyle} />
        <TextInput placeholder="Password" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry editable={!loading} style={inputStyle} />
        <TextInput placeholder="Confirm Password" placeholderTextColor={colors.muted} value={confirm} onChangeText={setConfirm} secureTextEntry editable={!loading} style={{ ...inputStyle, marginBottom: 20 }} />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, marginBottom: 20, opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
            {loading ? 'Creating...' : 'Register'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading}>
          <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600' }}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
