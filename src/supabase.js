// Supabase client for Room (web / Electron)
// Requiere que supabase-js esté cargado globalmente (vía CDN en index.html).
// Se anexa a window.RoomSupabase para uso sin bundler.

(function () {
  let supabaseClient = null;

  function getSupabase() {
    if (supabaseClient) return supabaseClient;

    const url = window.SUPABASE_URL;
    const anonKey = window.SUPABASE_ANON_KEY;

    if (!url || !anonKey || url === 'https://tu-proyecto.supabase.co') {
      console.warn('[Room] Supabase URL o ANON_KEY no configurados. Sincronización deshabilitada.');
      return null;
    }

    if (!window.supabase) {
      console.error('[Room] supabase-js no está cargado. Asegúrate de incluir el CDN antes de este script.');
      return null;
    }

    supabaseClient = window.supabase.createClient(url, anonKey);
    return supabaseClient;
  }

  function isConfigured() {
    const url = window.SUPABASE_URL;
    const anonKey = window.SUPABASE_ANON_KEY;
    return !!(url && anonKey && url !== 'https://tu-proyecto.supabase.co');
  }

  function isAuthenticated() {
    const sb = getSupabase();
    if (!sb) return false;
    const { data } = sb.auth.getUser();
    return !!data?.user;
  }

  window.RoomSupabase = {
    getSupabase,
    isConfigured,
    isAuthenticated
  };
})();
