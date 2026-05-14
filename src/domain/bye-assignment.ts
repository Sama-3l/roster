import type { Match, Player, Round } from "./types";

/**
 * Assign BYE volunteers so every real player gets exactly the same
 * number of BYE duties.
 *
 * Algorithm:
 * 1. Collect all BYE matches with their eligible volunteers (players
 *    not already in that match).
 * 2. Calculate the exact target: totalByeMatches / numPlayers. This is
 *    always a whole number because of how round-robin maths works.
 * 3. Use backtracking to find an assignment where every player ends up
 *    with exactly `target` BYE duties. Falls back to balanced-greedy
 *    if backtracking finds no perfect solution (shouldn't happen in
 *    standard configurations).
 *
 * Mutates the `byeVolunteer` field on affected match objects.
 */
export function assignByeVolunteers(
  rounds: Round[],
  realPlayers: Player[]
): void {
  // Collect all BYE matches in order
  const byeMatches: { m: Match; eligible: Player[] }[] = [];

  rounds.forEach((rd) => {
    rd.matches.forEach((m) => {
      if (!m.pair1.includes("BYE") && !m.pair2.includes("BYE")) return;

      const inMatch = [...m.pair1, ...m.pair2].filter((p) => p !== "BYE");
      const eligible = realPlayers.filter((p) => !inMatch.includes(p));
      byeMatches.push({ m, eligible });
    });
  });

  const total = byeMatches.length;
  const n = realPlayers.length;
  const target = total / n; // exact integer for valid configurations

  const byeCount: Record<Player, number> = {};
  realPlayers.forEach((p) => {
    byeCount[p] = 0;
  });
  const assignment: (Player | null)[] = new Array(total).fill(null);

  // Backtracking solver
  function solve(idx: number): boolean {
    if (idx === total) {
      // Check every player has exactly `target` bye duties
      return realPlayers.every((p) => byeCount[p] === target);
    }
    const { eligible } = byeMatches[idx];
    // Try eligible players in order of current count (fewest first) for speed
    const sorted = [...eligible].sort((a, b) => byeCount[a] - byeCount[b]);
    for (const p of sorted) {
      if (byeCount[p] < target) {
        byeCount[p]++;
        assignment[idx] = p;
        if (solve(idx + 1)) return true;
        byeCount[p]--;
        assignment[idx] = null;
      }
    }
    return false;
  }

  const solved = solve(0);

  if (!solved) {
    // Fallback: greedy (keeps counts as balanced as possible)
    realPlayers.forEach((p) => {
      byeCount[p] = 0;
    });
    byeMatches.forEach(({ eligible }, idx) => {
      const sorted = [...eligible].sort((a, b) => byeCount[a] - byeCount[b]);
      assignment[idx] = sorted[0];
      byeCount[sorted[0]]++;
    });
  }

  // Write volunteers back to match objects
  byeMatches.forEach(({ m }, idx) => {
    m.byeVolunteer = assignment[idx]!;
  });
}
