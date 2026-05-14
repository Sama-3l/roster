import type { Match, Pair, Player } from "./types";

/**
 * Generate round-robin pair assignments using the circle method.
 *
 * Given an even-length player list, produces (n − 1) rounds where each
 * round contains n/2 pairs. The first player is fixed; the rest rotate.
 *
 * @param playerList - Must have an even number of entries.
 *                     For odd player counts, append "BYE" before calling.
 * @returns Array of rounds, each round is an array of pairs.
 */
export function generateRoundPairs(playerList: Player[]): Pair[][] {
  const n = playerList.length; // guaranteed even
  const rounds: Pair[][] = [];
  const arr = [...playerList];

  for (let r = 0; r < n - 1; r++) {
    const pairs: Pair[] = [];
    for (let i = 0; i < n / 2; i++) {
      pairs.push([arr[i], arr[n - 1 - i]]);
    }
    rounds.push(pairs);
    // rotate: keep first fixed, shift the rest
    arr.splice(1, 0, arr.pop()!);
  }

  return rounds;
}

/**
 * Generate all matches for a single round's pairs.
 *
 * Every pair plays against every other pair in the round,
 * producing C(pairs, 2) matches.
 */
export function generateMatches(pairs: Pair[]): Match[] {
  const matches: Match[] = [];

  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      matches.push({
        pair1: pairs[i],
        pair2: pairs[j],
        score1: 0,
        score2: 0,
        locked: false,
      });
    }
  }

  return matches;
}
