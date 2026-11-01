// Supabase client for Room (web / Electron)
// Requiere que supabase-js esté cargado globalmente (vía CDN en index.html)
// o importado desde un bundler.

let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.VITE_SUPABASE_URL || window.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('[Room] Supabase URL o ANON_KEY no configurados. Sincronización deshabilitada.');
    return null;
  }

  // @ts-ignore: supabase está disponible globalmente vía CDN
  supabaseClient = window.supabase.createClient(url, anonKey);
  return supabaseClient;
}

function isConfigured() {
  const url = process.env.VITE_SUPABASE_URL || window.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;
  return !!(url && anonKey);
}

function isAuthenticated() {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = sb.auth.getUser();
  return !!data?.user;
}

export { getSupabase, isConfigured, isAuthenticated };
