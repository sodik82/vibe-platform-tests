import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type ExperimentResult = {
  id?: string
  session_id: string
  variant_assigned: 'A' | 'B'
  highest_step_reached: number
  free_text_answer?: string | null
  multiple_choice_answer?: string | null
  created_at?: string
}

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars')
    _client = createClient(url, key)
  }
  return _client
}

// Convenience alias — resolves lazily so module import is safe at build time
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
