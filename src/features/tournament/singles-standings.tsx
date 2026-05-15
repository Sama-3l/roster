"use client";

import { useTournament } from "./context";
import { copyToClipboard } from "@/src/lib/clipboard";
import styles from "./tournament.module.css";

/**
 * Singles league standings table with W/L/D and points.
 * Highlights the leader. Copy-to-clipboard support.
 */
export function SinglesStandings() {
  const { singlesStandings, showToast } = useTournament();

  const hasAny = singlesStandings.some((s) => s.pts > 0);
  if (!hasAny) return null;

  async function handleCopy() {
    const text = singlesStandings
      .map(
        (s, i) =>
          `${i + 1}. ${s.name} – W:${s.w} L:${s.l} D:${s.d} Pts:${s.pts}`
      )
      .join("\n");
    await copyToClipboard(text);

    // Save stats to database
    try {
      const statsPayload = singlesStandings.map((s) => ({
        playerName: s.name,
        points: s.pts,
        matches: s.matchesPlayed || 0,
      }));
      await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: statsPayload }),
      });
    } catch (err) {
      console.error("Failed to update stats:", err);
    }

    showToast();
  }

  return (
    <div className={styles.pointsSection}>
      <div className={styles.pointsTitle}>League standings</div>
      <div className={styles.pointsTable}>
        {/* Header row */}
        <div className={styles.singlesHeaderRow}>
          <span className={styles.rankNum}>#</span>
          <span className={styles.pointsName}>Player</span>
          <span className={styles.singlesStatHeader}>W</span>
          <span className={styles.singlesStatHeader}>L</span>
          <span className={styles.singlesStatHeader}>D</span>
          <span className={styles.singlesStatHeader}>P</span>
          <span className={styles.pointsVal}>Pts</span>
        </div>
        {singlesStandings.map((s, i) => (
          <div
            key={s.name}
            className={i === 0 ? styles.pointsRowTop : styles.pointsRow}
          >
            <span className={i === 0 ? styles.rankNumGold : styles.rankNum}>
              {i + 1}
            </span>
            <span className={styles.pointsName}>{s.name}</span>
            <span className={styles.singlesStat}>{s.w}</span>
            <span className={styles.singlesStat}>{s.l}</span>
            <span className={styles.singlesStat}>{s.d}</span>
            <span className={styles.singlesStat}>{s.matchesPlayed}</span>
            <span className={styles.pointsVal}>{s.pts}</span>
          </div>
        ))}
      </div>
      <button className={styles.btnCopy} onClick={handleCopy}>
        Copy standings
      </button>
    </div>
  );
}
