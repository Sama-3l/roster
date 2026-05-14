"use client";

import { useRef, useState } from "react";
import { useTournament } from "./context";
import styles from "./tournament.module.css";

/**
 * Player name input, chips, info bar, and generate button.
 * Mirrors the original HTML's input section exactly.
 */
export function PlayerInput() {
  const {
    players,
    addPlayer,
    removePlayer,
    tournament,
    generate,
  } = useTournament();

  const inputRef = useRef<HTMLInputElement>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const n = players.length;
  const isOdd = n % 2 !== 0;
  const valid = n >= 4;
  const isActive = !!tournament;

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

  // Build info bar content
  function renderInfoBar() {
    if (flashMsg) {
      return <span className={styles.warn}>{flashMsg}</span>;
    }
    if (n === 0) return null;

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
