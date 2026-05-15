"use client";

import { useTournament } from "./context";
import { computeKnockoutPoints } from "@/src/domain/knockout";
import styles from "./tournament.module.css";

/**
 * Knockout pool standings with W/L tracking and seed pills.
 * Shows qualified (top 4) rows with purple highlight.
 */
export function KnockoutStandings() {
  const { knockout, showToast } = useTournament();
  if (!knockout) return null;

  const standings = computeKnockoutPoints(knockout);
  const hasAny = standings.some((s) => s.pts > 0);
  if (!hasAny) return null;

  async function handleCopy() {
    const text = standings
      .map((s, i) => `${i + 1}. ${s.name} – W:${s.w} L:${s.l} Pts:${s.pts}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    // Save stats to database
    try {
      const statsPayload = standings.map((s) => ({
        playerName: s.name,
        points: s.pts,
        matches: s.w + s.l + s.d, // Total matches played
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
      <div className={styles.pointsTitle}>Pool standings</div>
      <div className={styles.pointsTable}>
        {standings.map((s, i) => {
          const qualified = i < 4;
          let rowClass: string;
          if (qualified && i === 0) rowClass = styles.pointsRowQualifiedTop;
          else if (qualified) rowClass = styles.pointsRowQualified;
          else if (i === 0) rowClass = styles.pointsRowTop;
          else rowClass = styles.pointsRow;

          return (
            <div key={s.name} className={rowClass}>
              <span className={i === 0 ? styles.rankNumGold : styles.rankNum}>
                {i + 1}
              </span>
              <span className={styles.pointsName}>{s.name}</span>
              <span className={styles.wlVal}>
                {s.w}W {s.l}L
              </span>
              {qualified && (
                <span className={styles.seedPill}>Seed {i + 1}</span>
              )}
              <span className={styles.pointsVal}>{s.pts}</span>
            </div>
          );
        })}
      </div>
      <button className={styles.btnCopy} onClick={handleCopy}>
        Copy standings
      </button>
    </div>
  );
}
