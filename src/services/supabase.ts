import { createClient } from '@supabase/supabase-js';
import AsyncStorage from 'expo-sqlite/kv-store';

const projectUrl = 'https://ohztxpkoxsypydihtlja.supabase.co';
const publishableKey = 'sb_publishable_1P2jzGAyH5s_TVsu4nuexQ_4L3MyQhm';

// Publishable keys are safe in the client. Access is restricted by RLS policies.
export const supabase = createClient(projectUrl, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
