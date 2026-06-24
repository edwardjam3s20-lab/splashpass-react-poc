import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY. Copy .env.example to .env and fill them in.'
  )
}

// Untyped client for now — swap in `createClient<Database>(...)` once real
// generated types exist (`supabase gen types typescript`). The hand-written
// types in src/types/database.ts are used at the call-site level instead.
export const supabase = createClient(supabaseUrl, supabaseKey)
