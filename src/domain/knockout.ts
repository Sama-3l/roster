import type {
  KnockoutStanding,
  KnockoutState,
  Player,
  PlayoffMatch,
  PoolMatch,
} from "./types";

// ── Pool match count (for info bar) ───────────────────────────────

export function computePoolMatchCount(n: number): number {
  const totalPairs = (n * (n - 1)) / 2;
  return Math.ceil(totalPairs / 2);
}

// ── Partnership match generation ──────────────────────────────────
//
// Uses 1-factorization of K_n:
//   - Fix player 0, rotate players 1..n-1 (standard round-robin)
//   - Each "round" is a perfect matching: n/2 partnerships
//   - Within each round, pair partnerships into matches (2 per match)
//   - Leftover partnerships (when n/2 is odd) collected and paired later
//   - Any truly unpaired leftover gets a BYE-pool match

export function generatePartnershipMatches(
  playerNames: Player[]
): PoolMatch[] {
  const n = playerNames.length; // must be even

  // Build n-1 rounds via standard round-robin rotation
  const rounds: number[][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const arr = [0];
    for (let i = 1; i < n; i++) {
      arr.push(1 + ((i - 1 + r) % (n - 1)));
    }
    const roundPairs: number[][] = [];
    for (let i = 0; i < n / 2; i++) {
      roundPairs.push([arr[i], arr[n - 1 - i]]);
    }
    rounds.push(roundPairs);
  }

  // Pair partnerships within each round into matches
  const matches: PoolMatch[] = [];
  const leftovers: number[][] = [];

  for (const roundPairs of rounds) {
    const usedInRound = new Array(roundPairs.length).fill(false);
    for (let i = 0; i < roundPairs.length; i++) {
      if (usedInRound[i]) continue;
      const [a, b] = roundPairs[i];
      let paired = false;
      for (let j = i + 1; j < roundPairs.length; j++) {
        if (usedInRound[j]) continue;
        const [c, d] = roundPairs[j];
        if (c !== a && c !== b && d !== a && d !== b) {
          matches.push({
            pair1: [playerNames[a], playerNames[b]],
            pair2: [playerNames[c], playerNames[d]],
            score1: 0,
            score2: 0,
            locked: false,
          });
          usedInRound[i] = true;
          usedInRound[j] = true;
          paired = true;
          break;
        }
      }
      if (!paired) {
        leftovers.push([a, b]);
      }
    }
  }

  // Pair leftovers using skip-rotation
  const lUsed = new Array(leftovers.length).fill(false);
  if (leftovers.length > 1) {
    let bestSkip = 2;
    let bestCount = -1;
    for (let skip = 2; skip < leftovers.length; skip++) {
      let count = 0;
      const tmp = new Array(leftovers.length).fill(false);
      for (let i = 0; i < leftovers.length; i++) {
        if (tmp[i]) continue;
        const j = (i + skip) % leftovers.length;
        if (tmp[j] || i === j) continue;
        const [a, b] = leftovers[i];
        const [c, d] = leftovers[j];
        if (c !== a && c !== b && d !== a && d !== b) {
          tmp[i] = true;
          tmp[j] = true;
          count++;
        }
      }
      if (count > bestCount) {
        bestCount = count;
        bestSkip = skip;
      }
    }
    for (let i = 0; i < leftovers.length; i++) {
      if (lUsed[i]) continue;
      const j = (i + bestSkip) % leftovers.length;
      if (lUsed[j] || i === j) continue;
      const [a, b] = leftovers[i];
      const [c, d] = leftovers[j];
      if (c !== a && c !== b && d !== a && d !== b) {
        matches.push({
          pair1: [playerNames[a], playerNames[b]],
          pair2: [playerNames[c], playerNames[d]],
          score1: 0,
          score2: 0,
          locked: false,
        });
        lUsed[i] = true;
        lUsed[j] = true;
      }
    }
  }

  // Any truly unpaired leftover gets a BYE-pool match
  for (let i = 0; i < leftovers.length; i++) {
    if (!lUsed[i]) {
      const [a, b] = leftovers[i];
      matches.push({
        pair1: [playerNames[a], playerNames[b]],
        pair2: ["BYE", "BYE"],
        score1: 0,
        score2: 0,
        locked: false,
        isByePool: true,
      });
    }
  }

  return matches;
}

// ── Make a playoff match stub ─────────────────────────────────────

function makePlayoffMatch(label: string): PlayoffMatch {
  return {
    pair1: [null, null],
    pair2: [null, null],
    score1: 0,
    score2: 0,
    locked: false,
    label,
  };
}

// ── Generate full knockout state ──────────────────────────────────

export function generateKnockout(playerNames: Player[]): KnockoutState {
  const isOdd = playerNames.length % 2 !== 0;
  const pool = isOdd ? [...playerNames, "BYE"] : [...playerNames];
  const poolMatches = generatePartnershipMatches(pool);

  // BYE volunteer assignment for odd-player tournaments
  if (isOdd) {
    assignKnockoutByeVolunteers(poolMatches, playerNames);
  }

  const playoff = {
    semi1: makePlayoffMatch("Semi-final 1"),
    semi2: makePlayoffMatch("Semi-final 2"),
    final: makePlayoffMatch("Final"),
    third: makePlayoffMatch("3rd place"),
  };

  return {
    players: [...playerNames],
    effectivePlayers: pool,
    poolMatches,
    playoff,
  };
}

// ── BYE volunteer assignment for knockout ─────────────────────────

function assignKnockoutByeVolunteers(
  poolMatches: PoolMatch[],
  playerNames: Player[]
): void {
  const byeSlots: { mi: number; side: 1 | 2; si: number }[] = [];

  poolMatches.forEach((m, mi) => {
    m.pair1.forEach((p, si) => {
      if (p === "BYE") byeSlots.push({ mi, side: 1, si });
    });
    m.pair2.forEach((p, si) => {
      if (p === "BYE") byeSlots.push({ mi, side: 2, si });
    });
  });

  const n = playerNames.length;
  const byeCount: Record<string, number> = {};
  playerNames.forEach((p) => {
    byeCount[p] = 0;
  });
  const maxBye = Math.ceil(byeSlots.length / n);
  const assignment: (Player | null)[] = new Array(byeSlots.length).fill(null);

  function solve(idx: number): boolean {
    if (idx === byeSlots.length) return true;
    const { mi } = byeSlots[idx];
    const m = poolMatches[mi];
    const inMatch = new Set(
      [...m.pair1, ...m.pair2].filter((p) => p !== "BYE")
    );
    const eligible = playerNames
      .filter((p) => !inMatch.has(p) && byeCount[p] < maxBye)
      .sort((a, b) => byeCount[a] - byeCount[b]);

    for (const p of eligible) {
      byeCount[p]++;
      assignment[idx] = p;
      if (solve(idx + 1)) return true;
      byeCount[p]--;
      assignment[idx] = null;
    }
    return false;
  }

  if (!solve(0)) {
    // fallback: greedy
    playerNames.forEach((p) => {
      byeCount[p] = 0;
    });
    byeSlots.forEach(({ mi }, idx) => {
      const m = poolMatches[mi];
      const inMatch = new Set(
        [...m.pair1, ...m.pair2].filter((p) => p !== "BYE")
      );
      const eligible = playerNames
        .filter((p) => !inMatch.has(p))
        .sort((a, b) => byeCount[a] - byeCount[b]);
      assignment[idx] = eligible[0];
      byeCount[eligible[0]]++;
    });
  }

  byeSlots.forEach(({ mi, side, si }, idx) => {
    const m = poolMatches[mi];
    if (side === 1) {
      if (!m.pair1Bye) m.pair1Bye = [null, null];
      m.pair1Bye[si] = assignment[idx];
    } else {
      if (!m.pair2Bye) m.pair2Bye = [null, null];
      m.pair2Bye[si] = assignment[idx];
    }
  });
}

// ── Knockout standings computation ────────────────────────────────

export function computeKnockoutPoints(
  state: KnockoutState
): KnockoutStanding[] {
  const pts: Record<string, number> = {};
  const wins: Record<string, number> = {};
  const losses: Record<string, number> = {};
  const draws: Record<string, number> = {};
  state.players.forEach((p) => {
    pts[p] = 0;
    wins[p] = 0;
    losses[p] = 0;
    draws[p] = 0;
  });

  state.poolMatches.forEach((m) => {
    if (!m.locked) return;
    const s1 = m.score1;
    const s2 = m.score2;

    const resolveReal = (
      pair: [string, string],
      byeArr?: (string | null)[]
    ): string[] =>
      pair
        .map((p, si) =>
          p === "BYE" && byeArr && byeArr[si] ? byeArr[si]! : p
        )
        .filter((p) => p !== "BYE" && pts[p] !== undefined);

    const realP1 = resolveReal(m.pair1, m.pair1Bye);
    const realP2 = resolveReal(m.pair2, m.pair2Bye);

    realP1.forEach((p) => {
      pts[p] += s1;
    });
    realP2.forEach((p) => {
      pts[p] += s2;
    });

    if (s1 > s2) {
      realP1.forEach((p) => wins[p]++);
      realP2.forEach((p) => losses[p]++);
    } else if (s2 > s1) {
      realP2.forEach((p) => wins[p]++);
      realP1.forEach((p) => losses[p]++);
    } else {
      realP1.forEach((p) => draws[p]++);
      realP2.forEach((p) => draws[p]++);
    }
  });

  return Object.entries(pts)
    .map(([name, p]) => ({
      name,
      pts: p,
      w: wins[name],
      l: losses[name],
      d: draws[name],
    }))
    .sort((a, b) => b.pts - a.pts || b.w - a.w);
}

// ── Playoff seed resolution ───────────────────────────────────────

export function resolvePlayoffSeeds(state: KnockoutState): void {
  const standings = computeKnockoutPoints(state);
  const get = (i: number): Player | null =>
    standings[i] ? standings[i].name : null;

  // Semi 1: seeds 1&4 vs 2&3
  state.playoff.semi1.pair1 = [get(0), get(3)];
  state.playoff.semi1.pair2 = [get(1), get(2)];
  // Semi 2: seeds 5&8 vs 6&7
  state.playoff.semi2.pair1 = [get(4), get(7)];
  state.playoff.semi2.pair2 = [get(5), get(6)];

  if (state.playoff.semi1.locked && state.playoff.semi2.locked) {
    const [w1, l1] = getWinnerLoser(state.playoff.semi1);
    const [w2, l2] = getWinnerLoser(state.playoff.semi2);
    state.playoff.final.pair1 = w1;
    state.playoff.final.pair2 = w2;
    state.playoff.third.pair1 = l1;
    state.playoff.third.pair2 = l2;
  } else if (state.playoff.semi1.locked) {
    const [w1, l1] = getWinnerLoser(state.playoff.semi1);
    state.playoff.final.pair1 = w1;
    state.playoff.third.pair1 = l1;
    state.playoff.final.pair2 = [null, null];
    state.playoff.third.pair2 = [null, null];
  }
}

export function getWinnerLoser(
  m: PlayoffMatch
): [[Player | null, Player | null], [Player | null, Player | null]] {
  if (!m.locked) return [[null, null], [null, null]];
  if (m.score1 >= m.score2) return [m.pair1, m.pair2];
  return [m.pair2, m.pair1];
}

// ── Count partnerships covered ────────────────────────────────────

export function countPairsCovered(state: KnockoutState): number {
  const done = new Set<string>();
  const key = (x: string, y: string) => [x, y].sort().join(",");

  state.poolMatches.forEach((m) => {
    if (!m.locked) return;
    const r1 = m.pair1.map((p, si) =>
      p === "BYE" && m.pair1Bye && m.pair1Bye[si] ? m.pair1Bye[si]! : p
    );
    const r2 = m.pair2.map((p, si) =>
      p === "BYE" && m.pair2Bye && m.pair2Bye[si] ? m.pair2Bye[si]! : p
    );
    if (!r1.includes("BYE")) done.add(key(r1[0], r1[1]));
    if (!r2.includes("BYE")) done.add(key(r2[0], r2[1]));
  });

  return done.size;
}
