"use client";

import { useRef, useState } from "react";
import { useTournament } from "./context";
import { computePoolMatchCount } from "@/src/domain/knockout";
import styles from "./tournament.module.css";

/**
 * Player name input, chips, info bar, and generate button.
 * Now mode-aware: shows different info for americano vs knockout.
 */
export function PlayerInput() {
  const {
    players,
    addPlayer,
    removePlayer,
    tournament,
    knockout,
    singles,
    generate,
    mode,
    meetingsCount,
    setMeetingsCount,
    resetGame,
  } = useTournament();

  const inputRef = useRef<HTMLInputElement>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const n = players.length;
  const isOdd = n % 2 !== 0;
  const valid = mode === "singles" ? n >= 2 : n >= 4;
  const isActive = !!tournament || !!knockout || !!singles;

  function handleAdd() {
    const input = inputRef.current;
    if (!input) return;
    const error = addPlayer(input.value);
    if (error) {
      flash(error);
    } else {
      input.value = "";
      input.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  function flash(msg: string) {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), 1500);
  }

  // Build info bar content (mode-aware)
  function renderInfoBar() {
    if (flashMsg) {
      return <span className={styles.warn}>{flashMsg}</span>;
    }
    if (n === 0) return null;

    if (mode === "americano") {
      const effectiveN = isOdd ? n + 1 : n;
      const rounds = effectiveN - 1;
      return (
        <>
          <span className={styles.count}>{n} players</span>
          <span>· {rounds} rounds</span>
          {n < 4 && (
            <span className={styles.warn}>· need at least 4</span>
          )}
          {n >= 4 && isOdd && (
            <span className={styles.byeNote}>· BYE auto-added</span>
          )}
        </>
      );
    } else if (mode === "knockout") {
      // Knockout info
      const effectiveN = isOdd ? n + 1 : n;
      const totalPairs = (effectiveN * (effectiveN - 1)) / 2;
      const poolMatches = computePoolMatchCount(effectiveN);
      return (
        <>
          <span className={styles.count}>{n} players</span>
          <span>· {poolMatches} pool matches</span>
          <span>· {totalPairs} partnerships</span>
          {n < 4 && (
            <span className={styles.warn}>· need at least 4</span>
          )}
          {n >= 4 && isOdd && (
            <span className={styles.byeNote}>· BYE auto-added</span>
          )}
          {n >= 4 && !isOdd && (
            <span style={{ color: "var(--accent)" }}>· ready!</span>
          )}
        </>
      );
    } else {
      // Singles info
      const baseMatches = n >= 2 ? (n * (n - 1)) / 2 : 0;
      const totalMatches = baseMatches * meetingsCount;
      return (
        <>
          <span className={styles.count}>{n} players</span>
          <span>· {totalMatches} matches</span>
          {meetingsCount > 1 && (
            <span>· {meetingsCount}× each</span>
          )}
          {n < 2 && (
            <span className={styles.warn}>· need at least 2</span>
          )}
          {n >= 2 && (
            <span style={{ color: "var(--accent)" }}>· ready!</span>
          )}
        </>
      );
    }
  }

  return (
    <div className={styles.inputSection}>
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          id="nameInput"
          className={styles.nameInput}
          placeholder="Enter player name…"
          maxLength={24}
          disabled={isActive}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.btnAdd}
          onClick={handleAdd}
          disabled={isActive}
        >
          + Add
        </button>
        {isActive && (
          <button
            className={styles.btnReset}
            onClick={() => {
              if (window.confirm("Reset this game? All scores will be lost.")) {
                resetGame();
              }
            }}
          >
            Reset
          </button>
        )}
      </div>

      <div className={styles.chips}>
        {players.map((p) => (
          <span key={p} className={styles.chip}>
            {p}
            {!isActive && (
              <button
                className={styles.chipRemove}
                onClick={() => removePlayer(p)}
                aria-label={`Remove ${p}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      <div className={styles.infoBar} id="infoBar">
        {renderInfoBar()}
      </div>

      {/* Meetings selector (singles only, before generation) */}
      {mode === "singles" && !isActive && (
        <div className={styles.meetingsRow}>
          <span className={styles.meetingsLabel}>Encounters per pair</span>
          <div className={styles.meetingsStepper}>
            <button
              className={styles.meetingsBtn}
              onClick={() => setMeetingsCount(meetingsCount - 1)}
              disabled={meetingsCount <= 1}
            >
              −
            </button>
            <span className={styles.meetingsVal}>{meetingsCount}</span>
            <button
              className={styles.meetingsBtn}
              onClick={() => setMeetingsCount(meetingsCount + 1)}
              disabled={meetingsCount >= 5}
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        className={styles.btnPrimary}
        id="generateBtn"
        onClick={generate}
        disabled={!valid || isActive}
      >
        Generate fixtures
      </button>
    </div>
  );
}
