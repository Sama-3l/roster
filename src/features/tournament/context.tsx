"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  Match,
  Pair,
  Player,
  Round,
  Standing,
  Tournament,
} from "@/src/domain/types";
import { generateMatches, generateRoundPairs } from "@/src/domain/round-robin";
import { assignByeVolunteers } from "@/src/domain/bye-assignment";
import { computePoints } from "@/src/domain/scoring";

// ── Context shape ─────────────────────────────────────────────────

interface TournamentContextValue {
  // Player management
  players: Player[];
  addPlayer: (name: string) => string | null; // returns error string or null
  removePlayer: (name: string) => void;

  // Tournament
  tournament: Tournament | null;
  generate: () => void;

  // Match operations
  adjustScore: (
    roundIdx: number,
    matchIdx: number,
    side: 1 | 2,
    delta: number
  ) => void;
  lockMatch: (roundIdx: number, matchIdx: number) => void;
  unlockMatch: (roundIdx: number, matchIdx: number) => void;

  // Derived
  standings: Standing[];

  // Toast
  toastVisible: boolean;
  showToast: () => void;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────

export function TournamentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const addPlayer = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      if (
        players.find((p) => p.toLowerCase() === trimmed.toLowerCase())
      ) {
        return "Already added!";
      }
      setPlayers((prev) => [...prev, trimmed]);
      return null;
    },
    [players]
  );

  const removePlayer = useCallback(
    (name: string) => {
      if (tournament) return; // can't remove during tournament
      setPlayers((prev) => prev.filter((p) => p !== name));
    },
    [tournament]
  );

  const generate = useCallback(() => {
    const n = players.length;
    if (n < 4) return;

    const isOdd = n % 2 !== 0;
    const pool: Player[] = isOdd ? [...players, "BYE"] : [...players];

    const roundPairs: Pair[][] = generateRoundPairs(pool);

    const rounds: Round[] = roundPairs.map((pairs, i) => ({
      roundNum: i + 1,
      pairs,
      matches: generateMatches(pairs),
    }));

    if (isOdd) {
      assignByeVolunteers(rounds, players);
    }

    setTournament({ players: [...players], isOdd, rounds });
  }, [players]);

  const adjustScore = useCallback(
    (roundIdx: number, matchIdx: number, side: 1 | 2, delta: number) => {
      setTournament((prev) => {
        if (!prev) return prev;
        // Deep clone the specific match
        const newRounds = prev.rounds.map((rd, ri) => {
          if (ri !== roundIdx) return rd;
          return {
            ...rd,
            matches: rd.matches.map((m, mi) => {
              if (mi !== matchIdx) return m;
              const newMatch: Match = { ...m };
              if (side === 1)
                newMatch.score1 = Math.max(0, newMatch.score1 + delta);
              else newMatch.score2 = Math.max(0, newMatch.score2 + delta);
              return newMatch;
            }),
          };
        });
        return { ...prev, rounds: newRounds };
      });
    },
    []
  );

  const lockMatch = useCallback(
    (roundIdx: number, matchIdx: number) => {
      setTournament((prev) => {
        if (!prev) return prev;
        const newRounds = prev.rounds.map((rd, ri) => {
          if (ri !== roundIdx) return rd;
          return {
            ...rd,
            matches: rd.matches.map((m, mi) => {
              if (mi !== matchIdx) return m;
              return { ...m, locked: true };
            }),
          };
        });
        return { ...prev, rounds: newRounds };
      });
    },
    []
  );

  const unlockMatch = useCallback(
    (roundIdx: number, matchIdx: number) => {
      setTournament((prev) => {
        if (!prev) return prev;
        const newRounds = prev.rounds.map((rd, ri) => {
          if (ri !== roundIdx) return rd;
          return {
            ...rd,
            matches: rd.matches.map((m, mi) => {
              if (mi !== matchIdx) return m;
              return { ...m, locked: false };
            }),
          };
        });
        return { ...prev, rounds: newRounds };
      });
    },
    []
  );

  const standings = useMemo(() => {
    if (!tournament) return [];
    return computePoints(tournament);
  }, [tournament]);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }, []);

  const value = useMemo<TournamentContextValue>(
    () => ({
      players,
      addPlayer,
      removePlayer,
      tournament,
      generate,
      adjustScore,
      lockMatch,
      unlockMatch,
      standings,
      toastVisible,
      showToast,
    }),
    [
      players,
      addPlayer,
      removePlayer,
      tournament,
      generate,
      adjustScore,
      lockMatch,
      unlockMatch,
      standings,
      toastVisible,
      showToast,
    ]
  );

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────

export function useTournament(): TournamentContextValue {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return ctx;
}
