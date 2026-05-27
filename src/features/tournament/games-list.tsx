"use client";

import { useCallback, useEffect, useState } from "react";
import { useTournament } from "./context";
import styles from "./tournament.module.css";
import type { GameSummary } from "@/app/api/games/route";

interface GamesListProps {
  onGameLoaded: () => void;
}

// ── Time formatting ────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function isLive(isoString: string): boolean {
  return Date.now() - new Date(isoString).getTime() < 30 * 60_000;
}

function isToday(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// ── Mode badge label ───────────────────────────────────────────────

const MODE_LABEL: Record<string, string> = {
  americano: "AME",
  knockout: "KO",
  singles: "SGL",
};

// ── Component ─────────────────────────────────────────────────────

export function GamesList({ onGameLoaded }: GamesListProps) {
  const { loadGame } = useTournament();

  const [games, setGames] = useState<GameSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch games on mount
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    setFetchError(null);

    fetch("/api/games")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setFetchError(data.error);
        } else {
          setGames(data.games ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError("Could not connect to server");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoad = useCallback(
    async (code: string) => {
      setLoadingCode(code);
      setLoadError(null);
      const err = await loadGame(code);
      setLoadingCode(null);
      if (err) {
        setLoadError(`${code}: ${err}`);
      } else {
        onGameLoaded();
      }
    },
    [loadGame, onGameLoaded]
  );

  // ── Bucket games into groups ───────────────────────────────────

  const live = games.filter((g) => isLive(g.updatedAt));
  const today = games.filter((g) => !isLive(g.updatedAt) && isToday(g.updatedAt));
  const older = games.filter((g) => !isLive(g.updatedAt) && !isToday(g.updatedAt));

  // ── Render helpers ─────────────────────────────────────────────

  function renderRow(game: GameSummary) {
    const isLoading = loadingCode === game.code;
    return (
      <div key={game.code} className={styles.gamesItem}>
        <span
          className={
            game.mode === "knockout"
              ? styles.modeBadgeKo
              : game.mode === "singles"
              ? styles.modeBadgeSingles
              : styles.modeBadge
          }
        >
          {MODE_LABEL[game.mode] ?? game.mode.toUpperCase()}
        </span>

        <div className={styles.gamesItemMeta}>
          <span className={styles.gamesCode}>{game.code}</span>
          <span className={styles.gamesSubLine}>
            <span className={styles.gamesPlayerCount}>
              {game.playerCount} player{game.playerCount !== 1 ? "s" : ""}
            </span>
            <span className={styles.gamesDot}>·</span>
            <span className={styles.gamesTimestamp}>
              {timeAgo(game.updatedAt)}
            </span>
          </span>
        </div>

        <button
          className={styles.gamesLoadBtn}
          onClick={() => handleLoad(game.code)}
          disabled={isLoading || loadingCode !== null}
          id={`load-game-${game.code}`}
        >
          {isLoading ? (
            <span className={styles.btnSpinner} />
          ) : (
            "Load"
          )}
        </button>
      </div>
    );
  }

  function renderGroup(label: string, items: GameSummary[], accent?: boolean) {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <div
          className={styles.gamesGroupLabel}
          style={accent ? { color: "var(--accent)" } : undefined}
        >
          {label}
          {accent && <span className={styles.liveDot} />}
        </div>
        {items.map(renderRow)}
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────

  if (fetching) {
    return (
      <div className={styles.gamesList}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.gamesSkeleton} />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className={styles.gamesList}>
        <div className={styles.gamesEmpty}>
          <span style={{ color: "var(--danger)" }}>{fetchError}</span>
        </div>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────

  if (games.length === 0) {
    return (
      <div className={styles.gamesList}>
        <div className={styles.gamesEmpty}>
          No saved games yet — start one on the New Game tab.
        </div>
      </div>
    );
  }

  // ── List ───────────────────────────────────────────────────────

  return (
    <div className={styles.gamesList}>
      {loadError && (
        <div className={styles.infoBar}>
          <span className={styles.warn}>{loadError}</span>
        </div>
      )}
      {renderGroup("Live", live, true)}
      {renderGroup("Today", today)}
      {renderGroup("Older", older)}
    </div>
  );
}
