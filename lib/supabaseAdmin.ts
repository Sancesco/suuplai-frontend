import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente de Supabase para uso EXCLUSIVO en el servidor (API routes).
// Usa la service_role key, que salta RLS — nunca debe llegar al navegador.
let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null // env no configurado todavía

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
