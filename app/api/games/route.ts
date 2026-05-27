/**
 * Games list API — returns a lightweight summary of all saved games.
 *
 * GET /api/games?limit=50
 * Returns: { games: GameSummary[] }
 *
 * GameSummary: { code, mode, playerCount, updatedAt, createdAt }
 */

import { NextRequest } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

export interface GameSummary {
  code: string;
  mode: string;
  playerCount: number;
  updatedAt: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "50"),
    100
  );

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("games")
      .select("code, state, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const games: GameSummary[] = (data ?? []).map((row: any) => ({
      code: row.code,
      mode: row.state?.mode ?? "americano",
      playerCount: Array.isArray(row.state?.players)
        ? row.state.players.length
        : 0,
      updatedAt: row.updated_at ?? row.created_at,
      createdAt: row.created_at,
    }));

    return Response.json({ games });
  } catch (err) {
    console.error("GET /api/games error:", err);
    return Response.json(
      { error: "Server error — could not fetch games" },
      { status: 500 }
    );
  }
}
