"use client";

import type { PlayoffMatch } from "@/src/domain/types";
import { computeKnockoutPoints } from "@/src/domain/knockout";
import { useTournament } from "./context";
import styles from "./tournament.module.css";

/**
 * Bracket grid visualization matching the HTML's bracket-grid layout.
 * Shows semis → finals with an arrow between columns.
 */
export function BracketGrid() {
  const { knockout } = useTournament();
  if (!knockout) return null;

  const pl = knockout.playoff;

  // Only show bracket if standings have points
  const standings = computeKnockoutPoints(knockout);
  const hasAny = standings.some((s) => s.pts > 0);
  if (!hasAny) return null;

  return (
    <div className={styles.bracketSection}>
      <div className={styles.bracketTitle}>Knockout bracket</div>
      <div className={styles.bracketGrid}>
        {/* Semis column */}
        <div className={styles.bracketCol}>
          <div className={styles.bracketColTitle}>Semis</div>
          <div className={styles.bracketSubtitle}>
            Semi 1 · Seeds 1&4 vs 2&3
          </div>
          <BracketMatchBox match={pl.semi1} isFinal={false} />
          <div
            className={`${styles.bracketSubtitle} ${styles.bracketSubtitleMargin}`}
          >
            Semi 2 · Seeds 5&8 vs 6&7
          </div>
          <BracketMatchBox match={pl.semi2} isFinal={false} />
        </div>

        {/* Arrow */}
        <div className={styles.bracketArrow}>→</div>

        {/* Finals column */}
        <div className={styles.bracketCol}>
          <div className={styles.bracketColTitle}>Finals</div>
          <div className={styles.bracketSubtitlePlayoff}>Final</div>
          <BracketMatchBox match={pl.final} isFinal={true} />
          <div
            className={`${styles.bracketSubtitle} ${styles.bracketSubtitleMargin}`}
          >
            3rd place
          </div>
          <BracketMatchBox match={pl.third} isFinal={false} />
        </div>
      </div>
    </div>
  );
}

function BracketMatchBox({
  match,
  isFinal,
}: {
  match: PlayoffMatch;
  isFinal: boolean;
}) {
  const w1 = match.locked && match.score1 > match.score2;
  const w2 = match.locked && match.score2 > match.score1;

  function teamLabel(pair: (string | null)[]): string {
    if (!pair || !pair[0]) return "TBD";
    return pair.filter(Boolean).join(" & ") || "TBD";
  }

  function teamRow(
    pair: (string | null)[],
    isWinner: boolean,
    isLoser: boolean,
    score: number,
    showScore: boolean
  ) {
    let cls = styles.bTeam;
    if (isWinner) cls = styles.bTeamWinner;
    else if (isLoser) cls = styles.bTeamLoser;
    else if (!pair || !pair[0]) cls = styles.bTeamTbd;

    return (
      <div className={cls}>
        <span>{teamLabel(pair)}</span>
        {showScore && <span className={styles.bScore}>{score}</span>}
      </div>
    );
  }

  return (
    <div className={isFinal ? styles.bMatchFinal : styles.bMatch}>
      {teamRow(match.pair1, w1, match.locked && !w1, match.score1, match.locked)}
      {teamRow(match.pair2, w2, match.locked && !w2, match.score2, match.locked)}
    </div>
  );
}
