import { NextRequest } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stats: { playerName: string; points: number; matches: number }[] = body.stats;

    if (!stats || !Array.isArray(stats)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Filter out entries with 0 matches to save DB calls if any
    const activeStats = stats.filter(s => s.matches > 0);
    if (activeStats.length === 0) {
      return Response.json({ success: true, message: "No active matches" });
    }

    const supabase = getSupabase();

    // Fetch existing stats for these players
    const playerNames = activeStats.map((s) => s.playerName);
    const { data: existing, error: fetchError } = await supabase
      .from("player_stats")
      .select("*")
      .in("player_name", playerNames);

    if (fetchError) throw fetchError;

    const existingMap = new Map<string, any>();
    if (existing) {
      existing.forEach((row) => existingMap.set((row as any).player_name, row));
    }

    // Prepare upsert payload
    const upsertPayload = activeStats.map((s) => {
      const ex = existingMap.get(s.playerName) || { total_points: 0, matches_played: 0 };
      return {
        player_name: s.playerName,
        total_points: ex.total_points + s.points,
        matches_played: ex.matches_played + s.matches,
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upsertError } = await supabase
      .from("player_stats")
      .upsert(upsertPayload as any, { onConflict: "player_name" });

    if (upsertError) throw upsertError;

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/stats error:", err);
    return Response.json(
      { error: "Server error — could not update stats" },
      { status: 500 }
    );
  }
}
