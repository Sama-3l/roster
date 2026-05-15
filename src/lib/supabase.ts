import { createClient } from "@supabase/supabase-js";

// ── Database type definition ──────────────────────────────────────

/** Minimal type for the `games` table so supabase-js infers
 *  insert/select/update shapes correctly instead of `never`. */
interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          code: string;
          state: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          state: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          state?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ── Client singleton ──────────────────────────────────────────────

/**
 * Lazy singleton Supabase client for server-side use in API routes.
 *
 * Uses the publishable (anon) key since this app has no auth —
 * all game data is public. RLS should allow public read/write
 * on the `games` table.
 */
let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env vars"
      );
    }
    _supabase = createClient<Database>(url, key);
  }
  return _supabase;
}
