import { createClient } from '@supabase/supabase-js';
import AsyncStorage from 'expo-sqlite/kv-store';

const projectUrl = 'https://moumvgdgnutjuwadeaoo.supabase.co';
const publishableKey = 'sb_publishable_n0UJkgHNa-dm5iLHz2zdRQ_lSuRFnd4';

// Publishable keys are safe in the client. Access is restricted by RLS policies.
export const supabase = createClient(projectUrl, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
