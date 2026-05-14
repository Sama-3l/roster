"use client";

import { useTournament } from "./context";
import { MatchCard } from "./match-card";
import styles from "./tournament.module.css";

/**
 * Renders all rounds and their matches once the tournament is generated.
 * Includes the divider, round headers with pair display, done indicators,
 * and all match cards.
 */
export function Fixtures() {
  const { tournament } = useTournament();

  if (!tournament) return null;

  return (
    <>
      <hr className={styles.divider} />

      <div className={styles.fixturesScroll}>
        {tournament.rounds.map((rd, ri) => {
          const allLocked =
            rd.matches.length > 0 && rd.matches.every((m) => m.locked);

          return (
            <div key={ri} className={styles.roundBlock} id={`round-${ri}`}>
              {/* Round header */}
              <div className={styles.roundHeader}>
                <div className={styles.roundHeaderTop}>
                  <span className={styles.roundLabel}>
                    Round {rd.roundNum}
                  </span>
                  {allLocked && (
                    <span className={styles.roundDone}>✓ done</span>
                  )}
                </div>
                <div className={styles.roundPairs}>
                  {rd.pairs.map((pair, pi) => (
                    <span key={pi}>
                      {pi > 0 && " | "}
                      {pair.map((name, ni) => (
                        <span key={ni}>
                          {ni > 0 && " & "}
                          {name === "BYE" ? (
                            <span className={styles.byeLabel}>BYE</span>
                          ) : (
                            name
                          )}
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
              </div>

              {/* Matches */}
              {rd.matches.map((m, mi) => (
                <MatchCard
                  key={mi}
                  roundIdx={ri}
                  matchIdx={mi}
                  match={m}
                />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
