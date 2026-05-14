"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  GameState,
  KnockoutState,
  Match,
  Pair,
  Player,
  PoolMatch,
  Round,
  Standing,
  Tournament,
  TournamentMode,
} from "@/src/domain/types";
import { generateMatches, generateRoundPairs } from "@/src/domain/round-robin";
import { assignByeVolunteers } from "@/src/domain/bye-assignment";
import { computePoints } from "@/src/domain/scoring";
import {
  computeKnockoutPoints,
  generateKnockout,
  resolvePlayoffSeeds,
} from "@/src/domain/knockout";

// ── Context shape ─────────────────────────────────────────────────

interface TournamentContextValue {
  // Player management
  players: Player[];
  addPlayer: (name: string) => string | null;
  removePlayer: (name: string) => void;

  // Mode
  mode: TournamentMode;
  setMode: (mode: TournamentMode) => void;

  // Tournament (Americano)
  tournament: Tournament | null;

  // Knockout
  knockout: KnockoutState | null;

  // Generate (dispatches based on mode)
  generate: () => void;

  // Americano match operations
  adjustScore: (
    roundIdx: number,
    matchIdx: number,
    side: 1 | 2,
    delta: number
  ) => void;
  lockMatch: (roundIdx: number, matchIdx: number) => void;
  unlockMatch: (roundIdx: number, matchIdx: number) => void;

  // Knockout match operations
  koAdjust: (
    stage: "pool" | "playoff",
    id: string,
    side: 1 | 2,
    delta: number
  ) => void;
  koLock: (stage: "pool" | "playoff", id: string) => void;
  koLockBye: (id: string) => void;
  koUnlock: (stage: "pool" | "playoff", id: string) => void;

  // Derived
  standings: Standing[];

  // Toast
  toastVisible: boolean;
  showToast: () => void;

  // Persistence
  gameCode: string | null;
  loadGame: (code: string) => Promise<string | null>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

// ── Persistence helpers ───────────────────────────────────────────

async function apiCreate(state: GameState): Promise<string> {
  const res = await fetch("/api/tournament", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `API returned ${res.status}`);
  }
  return data.code;
}

async function apiUpdate(code: string, state: GameState): Promise<void> {
  try {
    const res = await fetch("/api/tournament", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    });
    if (!res.ok) {
      const data = await res.json();
      console.error("apiUpdate failed:", data.error || res.status);
    }
  } catch (err) {
    console.error("apiUpdate network error:", err);
  }
}

async function apiLoad(
  code: string
): Promise<{ state: GameState } | { error: string }> {
  const res = await fetch(`/api/tournament?code=${code}`);
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Failed to load" };
  return { state: data.state };
}

// ── Provider ──────────────────────────────────────────────────────

export function TournamentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setModeState] = useState<TournamentMode>("americano");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [knockout, setKnockout] = useState<KnockoutState | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [gameCode, setGameCode] = useState<string | null>(null);

  // Ref to track if we need to persist — avoids saving on load
  const skipPersistRef = useRef(false);

  // ── Auto-persist on state changes ─────────────────────────────

  const getGameState = useCallback((): GameState => ({
    mode,
    players,
    tournament,
    knockout,
  }), [mode, players, tournament, knockout]);

  // Debounced persist: fires whenever state changes
  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    if (!gameCode) return;
    // Only persist if we have an active game (tournament or knockout generated)
    if (!tournament && !knockout) return;

    const state = getGameState();
    const timer = setTimeout(() => {
      apiUpdate(gameCode, state).catch(console.error);
    }, 300); // debounce 300ms

    return () => clearTimeout(timer);
  }, [gameCode, tournament, knockout, getGameState]);

  // ── Mode ──────────────────────────────────────────────────────

  const setMode = useCallback(
    (m: TournamentMode) => {
      if (tournament || knockout) return;
      setModeState(m);
    },
    [tournament, knockout]
  );

  // ── Player management ─────────────────────────────────────────

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
      if (tournament || knockout) return;
      setPlayers((prev) => prev.filter((p) => p !== name));
    },
    [tournament, knockout]
  );

  // ── Generate ──────────────────────────────────────────────────

  const generate = useCallback(async () => {
    const n = players.length;
    if (n < 4) return;

    let newTournament: Tournament | null = null;
    let newKnockout: KnockoutState | null = null;

    if (mode === "americano") {
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
      newTournament = { players: [...players], isOdd, rounds };
      setTournament(newTournament);
    } else {
      const ko = generateKnockout(players);
      resolvePlayoffSeeds(ko);
      newKnockout = ko;
      setKnockout(newKnockout);
    }

    // Create the game on the server and get the code
    try {
      const state: GameState = {
        mode,
        players: [...players],
        tournament: newTournament,
        knockout: newKnockout,
      };
      const code = await apiCreate(state);
      setGameCode(code);
    } catch (err) {
      console.error("Failed to save game:", err);
    }
  }, [players, mode]);

  // ── Load game ─────────────────────────────────────────────────

  const loadGame = useCallback(
    async (code: string): Promise<string | null> => {
      const result = await apiLoad(code);
      if ("error" in result) return result.error;

      const { state } = result;
      skipPersistRef.current = true;

      setModeState(state.mode);
      setPlayers(state.players);
      setTournament(state.tournament);
      setKnockout(state.knockout);
      setGameCode(code.toUpperCase());
      return null;
    },
    []
  );

  // ── Americano match operations ────────────────────────────────

  const adjustScore = useCallback(
    (roundIdx: number, matchIdx: number, side: 1 | 2, delta: number) => {
      setTournament((prev) => {
        if (!prev) return prev;
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

  // ── Knockout match operations ─────────────────────────────────

  const getKoMatch = (
    ko: KnockoutState,
    stage: "pool" | "playoff",
    id: string
  ) => {
    if (stage === "pool") return ko.poolMatches[Number(id)];
    return ko.playoff[id as keyof typeof ko.playoff];
  };

  const koAdjust = useCallback(
    (stage: "pool" | "playoff", id: string, side: 1 | 2, delta: number) => {
      setKnockout((prev) => {
        if (!prev) return prev;
        const ko = deepCloneKo(prev);
        const m = getKoMatch(ko, stage, id);
        if (!m) return prev;
        if (side === 1) m.score1 = Math.max(0, m.score1 + delta);
        else m.score2 = Math.max(0, m.score2 + delta);
        resolvePlayoffSeeds(ko);
        return ko;
      });
    },
    []
  );

  const koLock = useCallback(
    (stage: "pool" | "playoff", id: string) => {
      setKnockout((prev) => {
        if (!prev) return prev;
        const ko = deepCloneKo(prev);
        const m = getKoMatch(ko, stage, id);
        if (!m) return prev;
        m.locked = true;
        resolvePlayoffSeeds(ko);
        return ko;
      });
    },
    []
  );

  const koLockBye = useCallback(
    (id: string) => {
      setKnockout((prev) => {
        if (!prev) return prev;
        const ko = deepCloneKo(prev);
        const poolIdx = Number(id);
        const m = ko.poolMatches[poolIdx];
        if (!m) return prev;

        const prevMatches = ko.poolMatches.slice(0, poolIdx);
        const tempKo = { ...ko, poolMatches: prevMatches };
        const standings = computeKnockoutPoints(tempKo);
        const len = standings.length;
        const pLast2 = len >= 2 ? standings[len - 2].name : null;
        const pLast1 = len >= 1 ? standings[len - 1].name : null;
        if (!pLast2 || !pLast1) return prev;

        m.pair2 = [pLast2, pLast1];
        m.isByePool = true;
        m.locked = true;
        resolvePlayoffSeeds(ko);
        return ko;
      });
    },
    []
  );

  const koUnlock = useCallback(
    (stage: "pool" | "playoff", id: string) => {
      setKnockout((prev) => {
        if (!prev) return prev;
        const ko = deepCloneKo(prev);
        const m = getKoMatch(ko, stage, id);
        if (!m) return prev;
        m.locked = false;

        if (stage === "playoff" && (id === "semi1" || id === "semi2")) {
          ko.playoff.final.locked = false;
          ko.playoff.third.locked = false;
          ko.playoff.final.score1 = 0;
          ko.playoff.final.score2 = 0;
          ko.playoff.third.score1 = 0;
          ko.playoff.third.score2 = 0;
        }
        resolvePlayoffSeeds(ko);
        return ko;
      });
    },
    []
  );

  // ── Derived ───────────────────────────────────────────────────

  const standings = useMemo(() => {
    if (!tournament) return [];
    return computePoints(tournament);
  }, [tournament]);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }, []);

  // ── Value ─────────────────────────────────────────────────────

  const value = useMemo<TournamentContextValue>(
    () => ({
      players,
      addPlayer,
      removePlayer,
      mode,
      setMode,
      tournament,
      knockout,
      generate,
      adjustScore,
      lockMatch,
      unlockMatch,
      koAdjust,
      koLock,
      koLockBye,
      koUnlock,
      standings,
      toastVisible,
      showToast,
      gameCode,
      loadGame,
    }),
    [
      players,
      addPlayer,
      removePlayer,
      mode,
      setMode,
      tournament,
      knockout,
      generate,
      adjustScore,
      lockMatch,
      unlockMatch,
      koAdjust,
      koLock,
      koLockBye,
      koUnlock,
      standings,
      toastVisible,
      showToast,
      gameCode,
      loadGame,
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

// ── Deep clone helper ─────────────────────────────────────────────

function deepCloneKo(ko: KnockoutState): KnockoutState {
  return {
    ...ko,
    poolMatches: ko.poolMatches.map((m) => ({
      ...m,
      pair1: [...m.pair1] as [string, string],
      pair2: [...m.pair2] as [string, string],
      pair1Bye: m.pair1Bye ? [...m.pair1Bye] : undefined,
      pair2Bye: m.pair2Bye ? [...m.pair2Bye] : undefined,
    })),
    playoff: {
      semi1: { ...ko.playoff.semi1, pair1: [...ko.playoff.semi1.pair1] as [string | null, string | null], pair2: [...ko.playoff.semi1.pair2] as [string | null, string | null] },
      semi2: { ...ko.playoff.semi2, pair1: [...ko.playoff.semi2.pair1] as [string | null, string | null], pair2: [...ko.playoff.semi2.pair2] as [string | null, string | null] },
      final: { ...ko.playoff.final, pair1: [...ko.playoff.final.pair1] as [string | null, string | null], pair2: [...ko.playoff.final.pair2] as [string | null, string | null] },
      third: { ...ko.playoff.third, pair1: [...ko.playoff.third.pair1] as [string | null, string | null], pair2: [...ko.playoff.third.pair2] as [string | null, string | null] },
    },
  };
}
