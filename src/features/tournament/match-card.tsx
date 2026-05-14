"use client";

import type { Match } from "@/src/domain/types";
import { useTournament } from "./context";
import styles from "./tournament.module.css";

interface MatchCardProps {
  roundIdx: number;
  matchIdx: number;
  match: Match;
}

interface ResolvedPlayer {
  display: string;
  real: string;
  isBye: boolean;
}

/**
 * A single match card showing two teams, score controls, and lock/unlock.
 * Preserves every detail from the original HTML rendering.
 */
export function MatchCard({ roundIdx, matchIdx, match }: MatchCardProps) {
  const { adjustScore, lockMatch, unlockMatch } = useTournament();

  const m = match;
  const isByeMatch = !!m.byeVolunteer;

  // Resolve display names: replace BYE with "Volunteer (BYE)"
  function resolveNames(pair: [string, string]): ResolvedPlayer[] {
    return pair.map((name) => {
      if (name === "BYE" && m.byeVolunteer) {
        return {
          display: `${m.byeVolunteer} (BYE)`,
          real: m.byeVolunteer,
          isBye: true,
        };
      }
      return { display: name, real: name, isBye: false };
    });
  }

  const p1 = resolveNames(m.pair1);
  const p2 = resolveNames(m.pair2);

  const w1 = m.locked && m.score1 > m.score2;
  const w2 = m.locked && m.score2 > m.score1;

  function getPlayerClass(p: ResolvedPlayer, isWinner: boolean): string {
    const classes: string[] = [styles.teamPlayer];
    if (p.isBye && isWinner) {
      classes.push(styles.byeVolunteerWinner);
    } else if (p.isBye) {
      classes.push(styles.byeVolunteer);
    } else if (isWinner) {
      classes.push(styles.winner);
    }
    return classes.join(" ");
  }

  return (
    <div
      className={`${styles.match} ${isByeMatch ? styles.isByeMatch : ""}`}
    >
      {/* Teams row */}
      <div className={styles.matchTeams}>
        <div className={styles.team}>
          {p1.map((p, i) => (
            <span key={i} className={getPlayerClass(p, w1)}>
              {p.display}
            </span>
          ))}
        </div>
        <span className={styles.vsSep}>vs</span>
        <div className={styles.teamRight}>
          {p2.map((p, i) => (
            <span key={i} className={getPlayerClass(p, w2)}>
              {p.display}
            </span>
          ))}
        </div>
      </div>

      {/* Score row */}
      {m.locked ? (
        <div className={styles.scoreRow}>
          <div className={styles.scoreLock}>
            <span className={styles.scoreDisplay}>
              <span className={w1 ? styles.sWin : ""}>{m.score1}</span>
              <span className={styles.scoreDisplaySep}> – </span>
              <span className={w2 ? styles.sWin : ""}>{m.score2}</span>
            </span>
            <button
              className={styles.btnUnlock}
              onClick={() => unlockMatch(roundIdx, matchIdx)}
            >
              edit
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.scoreRow}>
          <div className={styles.scoreBlock}>
            <button
              className={styles.scoreBtn}
              onClick={() => adjustScore(roundIdx, matchIdx, 1, -1)}
            >
              −
            </button>
            <div className={styles.scoreVal}>{m.score1}</div>
            <button
              className={styles.scoreBtn}
              onClick={() => adjustScore(roundIdx, matchIdx, 1, 1)}
            >
              +
            </button>
          </div>
          <span className={styles.scoreSep}>vs</span>
          <div className={styles.scoreBlock}>
            <button
              className={styles.scoreBtn}
              onClick={() => adjustScore(roundIdx, matchIdx, 2, -1)}
            >
              −
            </button>
            <div className={styles.scoreVal}>{m.score2}</div>
            <button
              className={styles.scoreBtn}
              onClick={() => adjustScore(roundIdx, matchIdx, 2, 1)}
            >
              +
            </button>
          </div>
          <button
            className={styles.btnLock}
            onClick={() => lockMatch(roundIdx, matchIdx)}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
