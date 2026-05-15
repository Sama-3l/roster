import { createClient } from "@supabase/supabase-js";

/**
 * Lazy singleton Supabase client for server-side use in API routes.
 *
 * Uses the publishable (anon) key since this app has no auth —
 * all game data is public. RLS should allow public read/write
 * on the `games` table.
 */
let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env vars"
      );
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}
