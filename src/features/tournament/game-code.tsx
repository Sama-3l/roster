"use client";

import { useRef, useState } from "react";
import { useTournament } from "./context";
import styles from "./tournament.module.css";

/**
 * Game code display + load game input.
 * Shows the game code once a game is active and allows loading by code.
 */
export function GameCode() {
  const { gameCode, loadGame, showToast } = useTournament();
  const [loadInput, setLoadInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleLoad() {
    const code = loadInput.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Code must be 6 characters");
      return;
    }
    setLoading(true);
    setError(null);
    const err = await loadGame(code);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setLoadInput("");
    }
  }

  async function handleCopyCode() {
    if (!gameCode) return;
    try {
      await navigator.clipboard.writeText(gameCode);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = gameCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showToast();
  }

  return (
    <div className={styles.gameCodeSection}>
      {/* Active game code display */}
      {gameCode && (
        <div className={styles.gameCodeDisplay}>
          <div className={styles.gameCodeLabel}>Game Code</div>
          <div className={styles.gameCodeRow}>
            <span className={styles.gameCodeValue}>{gameCode}</span>
            <button className={styles.gameCodeCopy} onClick={handleCopyCode}>
              Copy
            </button>
          </div>
          <div className={styles.gameCodeHint}>
            Share this code to let others view this tournament
          </div>
        </div>
      )}

      {/* Load game */}
      {!gameCode && (
        <div className={styles.loadGameSection}>
          <div className={styles.loadGameDivider}>
            <div className={styles.loadGameLine} />
            <span className={styles.loadGameOr}>or load existing</span>
            <div className={styles.loadGameLine} />
          </div>
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              className={styles.nameInput}
              placeholder="Enter 6-char game code…"
              maxLength={6}
              value={loadInput}
              onChange={(e) => {
                setLoadInput(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLoad();
              }}
              style={{ textTransform: "uppercase", letterSpacing: "0.2em" }}
            />
            <button
              className={styles.btnAdd}
              onClick={handleLoad}
              disabled={loading || loadInput.length < 6}
            >
              {loading ? "…" : "Load"}
            </button>
          </div>
          {error && (
            <div className={styles.infoBar}>
              <span className={styles.warn}>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
