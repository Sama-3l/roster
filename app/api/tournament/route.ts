/**
 * Tournament API — Supabase persistence.
 *
 * Stores game state as JSONB rows in the `games` table, keyed by
 * 6-char alphanumeric codes.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * Required Supabase table:
 *   create table public.games (
 *     code text primary key,
 *     state jsonb not null,
 *     created_at timestamptz default now(),
 *     updated_at timestamptz default now()
 *   );
 *
 * - POST /api/tournament         → Create game, returns { code }
 * - GET  /api/tournament?code=XX → Retrieve game by code
 * - PUT  /api/tournament         → Update existing game
 */

import { NextRequest } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

/** Generate a 6-character alphanumeric code (no ambiguous chars). */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── GET — retrieve a game by code ─────────────────────────────────

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return Response.json(
      { error: "Missing ?code= parameter" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("games")
      .select("state")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return Response.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return Response.json({ code: code.toUpperCase(), state: (data as any).state });
  } catch (err) {
    console.error("GET /api/tournament error:", err);
    return Response.json(
      { error: "Server error — Supabase may not be configured" },
      { status: 500 }
    );
  }
}

// ── POST — create a new game ──────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    // Generate a unique code (retry on collision)
    let code: string = "";
    let attempts = 0;
    let inserted = false;

    while (attempts < 100) {
      code = generateCode();
      attempts++;

      const { error } = await supabase
        .from("games")
        .insert({ code, state: body } as any);

      if (!error) {
        inserted = true;
        break;
      }

      // If it's a unique violation, retry with a new code
      if (error.code === "23505") continue;

      // Any other error, throw
      throw error;
    }

    if (!inserted) {
      return Response.json(
        { error: "Could not generate unique code" },
        { status: 500 }
      );
    }

    return Response.json({ code }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tournament error:", err);
    return Response.json(
      { error: "Server error — Supabase may not be configured" },
      { status: 500 }
    );
  }
}

// ── PUT — update an existing game ─────────────────────────────────

export async function PUT(request: Request) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { code, state } = body;

    if (!code || !state) {
      return Response.json(
        { error: "Missing code or state in request body" },
        { status: 400 }
      );
    }

    const upperCode = code.toUpperCase();

    // Upsert for resilience — creates if missing, updates if exists
    const { error } = await supabase
      .from("games")
      .upsert(
        { code: upperCode, state, updated_at: new Date().toISOString() } as any,
        { onConflict: "code" }
      );

    if (error) throw error;

    return Response.json({ code: upperCode, updated: true });
  } catch (err) {
    console.error("PUT /api/tournament error:", err);
    return Response.json(
      { error: "Server error — Supabase may not be configured" },
      { status: 500 }
    );
  }
}
