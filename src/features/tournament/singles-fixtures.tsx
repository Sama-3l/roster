"use client";

import { useTournament } from "./context";
import { matchesPerLeg } from "@/src/domain/singles";
import styles from "./tournament.module.css";

/**
 * Singles league fixtures — renders all 1v1 matches with score
 * controls, lock/unlock, leg dividers, and a progress indicator.
 */
export function SinglesFixtures() {
  const { singles } = useTournament();
  if (!singles) return null;

  const total = singles.matches.length;
  const done = singles.matches.filter((m) => m.locked).length;
  const mpl = matchesPerLeg(singles.players.length);
  const showLegs = singles.meetings > 1;

  return (
    <>
      <hr className={styles.divider} />

      {/* Progress info */}
      <div className={styles.poolInfo}>
        Singles league · {total} matches
        {showLegs && <> · {singles.meetings} legs</>}
        {" · "}
        <span style={{ color: "var(--accent)" }}>
          {done}/{total}
        </span>{" "}
        completed
      </div>

      {/* Match cards with optional leg dividers */}
      <div className={styles.fixturesScroll}>
        {singles.matches.map((m, mi) => {
          const legNum = Math.floor(mi / mpl) + 1;
          const isLegStart = showLegs && mi % mpl === 0;

          return (
            <div key={mi}>
              {isLegStart && (
                <div className={styles.sectionDivider}>
                  <div className={styles.sectionDividerLine} />
                  <div className={styles.sectionDividerLabel}>
                    Leg {legNum}
                  </div>
                  <div className={styles.sectionDividerLine} />
                </div>
              )}
              <SinglesMatchCard mi={mi} />
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Singles Match Card ─────────────────────────────────────────────

function SinglesMatchCard({ mi }: { mi: number }) {
  const { singles, singlesAdjust, singlesLock, singlesUnlock } =
    useTournament();
  if (!singles) return null;

  const m = singles.matches[mi];
  const w1 = m.locked && m.score1 > m.score2;
  const w2 = m.locked && m.score2 > m.score1;

  return (
    <div className={styles.roundBlock}>
      <div className={styles.roundHeader}>
        <span className={styles.roundLabel}>Match {mi + 1}</span>
        {m.locked && <span className={styles.roundDone}>✓ done</span>}
      </div>
      <div className={styles.match}>
        {/* Players row */}
        <div className={styles.matchTeams}>
          <div className={styles.team}>
            <span
              className={`${styles.teamPlayer} ${w1 ? styles.winner : ""}`}
            >
              {m.player1}
            </span>
          </div>
          <span className={styles.vsSep}>vs</span>
          <div className={styles.teamRight}>
            <span
              className={`${styles.teamPlayer} ${w2 ? styles.winner : ""}`}
            >
              {m.player2}
            </span>
          </div>
        </div>

        {/* Score controls */}
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
                onClick={() => singlesUnlock(mi)}
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
                onClick={() => singlesAdjust(mi, 1, -1)}
              >
                −
              </button>
              <div className={styles.scoreVal}>{m.score1}</div>
              <button
                className={styles.scoreBtn}
                onClick={() => singlesAdjust(mi, 1, 1)}
              >
                +
              </button>
            </div>
            <span className={styles.scoreSep}>vs</span>
            <div className={styles.scoreBlock}>
              <button
                className={styles.scoreBtn}
                onClick={() => singlesAdjust(mi, 2, -1)}
              >
                −
              </button>
              <div className={styles.scoreVal}>{m.score2}</div>
              <button
                className={styles.scoreBtn}
                onClick={() => singlesAdjust(mi, 2, 1)}
              >
                +
              </button>
            </div>
            <button
              className={styles.btnLock}
              onClick={() => singlesLock(mi)}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
