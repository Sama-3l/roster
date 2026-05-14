// ── Domain types for the Americano tournament system ──────────────

/** A player is identified by their display name. */
export type Player = string;

/** A pair is two players teamed together for a round. */
export type Pair = [Player, Player];

/**
 * A single match between two pairs within a round.
 *
 * When an odd number of players exists, one slot in a pair is "BYE".
 * The `byeVolunteer` field records which real player fills in for
 * scoring purposes.
 */
export interface Match {
  pair1: Pair;
  pair2: Pair;
  score1: number;
  score2: number;
  locked: boolean;
  byeVolunteer?: Player;
}

/** A round contains its number, the pairs for that round, and all matches. */
export interface Round {
  roundNum: number;
  pairs: Pair[];
  matches: Match[];
}

/** The full tournament state. */
export interface Tournament {
  players: Player[];
  isOdd: boolean;
  rounds: Round[];
}

/** A single row in the standings / points table. */
export interface Standing {
  name: Player;
  pts: number;
}
