import type { Player, SinglesMatch, SinglesStanding, SinglesState } from "./types";

// ── Singles round-robin match generation ──────────────────────────
//
// Uses the circle method to produce naturally staggered rounds.
// Each round's matches are independent (no player appears twice),
// so when flattened the maximum consecutive matches for any player
// is 2 (across a round boundary) — well within a 3-match limit.
//
// The `meetings` parameter (1–5) repeats the full schedule so each
// pair faces each other that many times.
//
// For odd player counts a null sentinel is added; pairings that
// include null are skipped (the player sits out that round).
//
// Total matches = n * (n-1) / 2 * meetings.

export function generateSinglesMatches(
  players: Player[],
  meetings: number = 1
): SinglesMatch[] {
  const n = players.length;
  if (n < 2) return [];

  const isOdd = n % 2 !== 0;
  const pool: (Player | null)[] = isOdd ? [...players, null] : [...players];
  const size = pool.length;
  const matches: SinglesMatch[] = [];

  const clampedMeetings = Math.max(1, Math.min(5, meetings));

  for (let leg = 0; leg < clampedMeetings; leg++) {
    for (let r = 0; r < size - 1; r++) {
      // Build current rotation — fix index 0, rotate the rest
      const arr: (Player | null)[] = [pool[0]];
      for (let i = 1; i < size; i++) {
        arr.push(pool[1 + ((i - 1 + r) % (size - 1))]);
      }

      // Pair from outside-in
      for (let i = 0; i < size / 2; i++) {
        const p1 = arr[i];
        const p2 = arr[size - 1 - i];

        // Skip sit-out slot
        if (p1 === null || p2 === null) continue;

        matches.push({
          player1: p1,
          player2: p2,
          score1: 0,
          score2: 0,
          locked: false,
        });
      }
    }
  }

  return matches;
}

/**
 * Compute the number of matches per leg (one full round-robin pass).
 */
export function matchesPerLeg(playerCount: number): number {
  return (playerCount * (playerCount - 1)) / 2;
}

// ── Standings computation ─────────────────────────────────────────
//
// Scoring: Win = 3 pts, Draw = 1 pt, Loss = 0 pts
// Sort: pts desc → wins desc → name asc

export function computeSinglesStandings(
  state: SinglesState
): SinglesStanding[] {
  const pts: Record<string, number> = {};
  const wins: Record<string, number> = {};
  const losses: Record<string, number> = {};
  const draws: Record<string, number> = {};
  const played: Record<string, number> = {};

  state.players.forEach((p) => {
    pts[p] = 0;
    wins[p] = 0;
    losses[p] = 0;
    draws[p] = 0;
    played[p] = 0;
  });

  state.matches.forEach((m) => {
    if (!m.locked) return;

    played[m.player1]++;
    played[m.player2]++;

    if (m.score1 > m.score2) {
      // Player 1 wins
      wins[m.player1]++;
      losses[m.player2]++;
    } else if (m.score2 > m.score1) {
      // Player 2 wins
      wins[m.player2]++;
      losses[m.player1]++;
    } else {
      // Draw
      draws[m.player1]++;
      draws[m.player2]++;
    }
    pts[m.player1] += m.score1;
    pts[m.player2] += m.score2;
  });

  return Object.entries(pts)
    .map(([name, p]) => ({
      name,
      pts: p,
      w: wins[name],
      l: losses[name],
      d: draws[name],
      matchesPlayed: played[name],
    }))
    .sort(
      (a, b) =>
        b.pts - a.pts || b.w - a.w || a.name.localeCompare(b.name)
    );
}
