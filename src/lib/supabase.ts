import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sincronizzazione automatica sessione -> cookie per il middleware server-side
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Imposta cookie di autenticazione valido per 7 giorni
      document.cookie = `calcflow_auth=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    } else {
      // Elimina il cookie al logout o alla scadenza
      document.cookie = 'calcflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
  });
}