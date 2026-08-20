import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from 'expo-sqlite/kv-store';

const projectUrl = 'https://ohztxpkoxsypydihtlja.supabase.co';
const publishableKey = 'sb_publishable_1P2jzGAyH5s_TVsu4nuexQ_4L3MyQhm';

// Publishable keys are safe in the client. Access is restricted by RLS policies.
const browserAuthStorage = {
  getItem: async (key: string) => typeof window === 'undefined' ? null : window.localStorage.getItem(key),
  setItem: async (key: string, value: string) => { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); },
  removeItem: async (key: string) => { if (typeof window !== 'undefined') window.localStorage.removeItem(key); },
};

export const supabase = createClient(projectUrl, publishableKey, {
  auth: {
    // expo-sqlite's web backend holds an OPFS access handle. Keeping auth in
    // localStorage prevents it from competing with BEANFOLD's record database.
    storage: Platform.OS === 'web' ? browserAuthStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
