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

// ── Knockout-specific types ───────────────────────────────────────

export type TournamentMode = "americano" | "knockout";

/** A pool-stage match in a partnership knockout. */
export interface PoolMatch {
  pair1: [Player, Player];
  pair2: [Player, Player];
  score1: number;
  score2: number;
  locked: boolean;
  isByePool?: boolean;
  pair1Bye?: (Player | null)[];
  pair2Bye?: (Player | null)[];
}

/** A playoff match (semi-final, final, or 3rd place). */
export interface PlayoffMatch {
  pair1: [Player | null, Player | null];
  pair2: [Player | null, Player | null];
  score1: number;
  score2: number;
  locked: boolean;
  label: string;
}

/** The four playoff matches. */
export interface Playoff {
  semi1: PlayoffMatch;
  semi2: PlayoffMatch;
  final: PlayoffMatch;
  third: PlayoffMatch;
}

/** Knockout standings row with W/L/D tracking. */
export interface KnockoutStanding {
  name: Player;
  pts: number;
  w: number;
  l: number;
  d: number;
}

/** Full knockout tournament state. */
export interface KnockoutState {
  players: Player[];
  effectivePlayers: Player[];
  poolMatches: PoolMatch[];
  playoff: Playoff;
}

// ── Persistence ───────────────────────────────────────────────────

/** Serializable snapshot of the entire app state for save/load. */
export interface GameState {
  mode: TournamentMode;
  players: Player[];
  tournament: Tournament | null;
  knockout: KnockoutState | null;
}

