import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { View, LogBox } from 'react-native';

// expo-notifications logs a console error in Expo Go because remote push tokens
// were removed in SDK 53. Local scheduled notifications still work fine.
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
import * as Crypto from 'expo-crypto';
import { getUserByEmail, createUser, deleteUser } from '../db/queries';
import { seedDatabase } from '../db/seed';
import { ThemeProvider } from '../theme/ThemeContext';
import { setupNotificationChannel } from '../utils/notifications';

type User = { id: number; name: string; email: string } | null;

type UserContextType = {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  const initialize = async () => {
    try {
      await seedDatabase();
      // Notifications are not fully supported in Expo Go — guard with try/catch
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        await setupNotificationChannel();
      } catch (_) {}
      const saved = await AsyncStorage.getItem('currentUser');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {
      console.error('Init error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
    const [found] = await getUserByEmail(email);
    if (!found || found.password !== hashed) throw new Error('Invalid email or password');
    const userData = { id: found.id, name: found.name, email: found.email };
    await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string) => {
    const existing = await getUserByEmail(email);
    if (existing.length > 0) throw new Error('Email already registered');
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
    const [newUser] = await createUser({ name, email, password: hashed });
    const userData = { id: newUser.id, name: newUser.name, email: newUser.email };
    await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('currentUser');
    setUser(null);
  };

  const deleteProfile = async () => {
    if (!user) return;
    await deleteUser(user.id);
    await AsyncStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, register, logout, deleteProfile }}>
      {children}
    </UserContext.Provider>
  );
}

function RootLayoutNav() {
  const { isLoading } = useUser();
  if (isLoading) return <View style={{ flex: 1 }} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="add-habit" options={{ title: 'Add Habit', presentation: 'modal', headerShown: true }} />
      <Stack.Screen name="habit/[id]" options={{ title: 'Details', headerShown: true }} />
      <Stack.Screen name="habit/[id]/edit" options={{ title: 'Edit Habit', presentation: 'modal', headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProvider>
        <RootLayoutNav />
      </UserProvider>
    </ThemeProvider>
  );
}
