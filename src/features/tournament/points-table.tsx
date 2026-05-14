"use client";

import { useTournament } from "./context";
import { copyToClipboard } from "@/src/lib/clipboard";
import styles from "./tournament.module.css";

/**
 * Points / standings table with copy-to-clipboard functionality.
 * Only visible when at least one match has points.
 */
export function PointsTable() {
  const { standings, showToast } = useTournament();

  const hasAny = standings.some((s) => s.pts > 0);
  if (!hasAny) return null;

  async function handleCopy() {
    const text = standings
      .map((s) => `${s.name} - ${s.pts} points`)
      .join("\n");
    await copyToClipboard(text);
    showToast();
  }

  return (
    <div className={styles.pointsSection}>
      <div className={styles.pointsTitle}>Points table</div>
      <div className={styles.pointsTable}>
        {standings.map((s, i) => (
          <div
            key={s.name}
            className={i === 0 ? styles.pointsRowTop : styles.pointsRow}
          >
            <span className={i === 0 ? styles.rankNumGold : styles.rankNum}>
              {i + 1}
            </span>
            <span className={styles.pointsName}>{s.name}</span>
            <span className={styles.pointsVal}>{s.pts}</span>
          </div>
        ))}
      </div>
      <button
        className={styles.btnCopy}
        id="copyBtn"
        onClick={handleCopy}
      >
        Copy points table
      </button>
    </div>
  );
}
