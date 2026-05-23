import { createClient } from '@supabase/supabase-js'

// Cliente con service role key — SOLO para uso en servidor (API routes)
// NUNCA importar este archivo en componentes de cliente
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
