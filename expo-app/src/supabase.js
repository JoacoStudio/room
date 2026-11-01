// Supabase client for Room (Expo / React Native)
// Usa @supabase/supabase-js con AsyncStorage para persistencia local.

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === 'https://tu-proyecto.supabase.co') {
    console.warn('[Room] Supabase URL o ANON_KEY no configurados. Sincronización deshabilitada.');
    return null;
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

function isConfigured() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && anonKey && url !== 'https://tu-proyecto.supabase.co');
}

async function isAuthenticated() {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data } = await sb.auth.getUser();
    return !!data?.user;
  } catch (_e) {
    return false;
  }
}

export { getSupabase, isConfigured, isAuthenticated };
