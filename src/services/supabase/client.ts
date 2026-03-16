import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

function requireEnv(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Create a .env file (see .env.example) and restart the dev server.`
    );
  }
  return value;
}

const supabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const isServer = typeof window === 'undefined';

const webStorage = {
  getItem: async (key: string) => (isServer ? null : window.localStorage.getItem(key)),
  setItem: async (key: string, value: string) => {
    if (!isServer) window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (!isServer) window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // SSR-safe:
    // - native: AsyncStorage
    // - web browser: localStorage
    // - web SSR (node render): disable persistence to avoid `window` access
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

