"use client";

import type { TournamentMode } from "@/src/domain/types";
import { useTournament } from "./context";
import styles from "./tournament.module.css";

const MODE_DESC: Record<TournamentMode, string> = {
  americano:
    "Rotating pairs each round · points from scores accumulate per player",
  knockout:
    "All partnerships play pool matches · top 4 advance to bracket",
};

/**
 * Connected button group to select Americano or Partnership Knockout.
 * Matches the HTML's mode-selector exactly.
 */
export function ModeSelector() {
  const { mode, setMode, tournament, knockout } = useTournament();
  const isActive = !!tournament || !!knockout;

  return (
    <>
      <div className={styles.modeSelector}>
        <button
          className={`${styles.modeBtn} ${mode === "americano" ? styles.modeBtnActive : ""}`}
          onClick={() => setMode("americano")}
          disabled={isActive}
          style={isActive && mode !== "americano" ? { opacity: 0.35 } : undefined}
        >
          Americano
        </button>
        <button
          className={`${styles.modeBtn} ${mode === "knockout" ? styles.modeBtnActive : ""}`}
          onClick={() => setMode("knockout")}
          disabled={isActive}
          style={isActive && mode !== "knockout" ? { opacity: 0.35 } : undefined}
        >
          Partnership Knockout
        </button>
      </div>
      <div className={styles.modeDesc}>{MODE_DESC[mode]}</div>
    </>
  );
}
