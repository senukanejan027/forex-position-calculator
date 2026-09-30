import { createClient } from '@supabase/supabase-js'

// Only the public (publishable) key belongs in frontend code. Data isolation is enforced by
// Row Level Security in the database, never by this key. Never put a service-role key here.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && key)

// PKCE keeps tokens out of the URL hash, which the app uses for routing on GitHub Pages.
export const supabase = isSupabaseConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } })
  : null
