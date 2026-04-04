import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ REPLACE THESE WITH YOUR ACTUAL SUPABASE PROJECT DETAILS
// Find them at: https://supabase.com/dashboard → your project → Settings → API
const SUPABASE_URL = 'https://kzmucjzpcxhhueyiwlew.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wa8cZLDVG3FppsS1nWAs0Q_56fCsS_j';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
