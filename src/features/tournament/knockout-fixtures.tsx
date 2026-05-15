"use client";

import { useTournament } from "./context";
import { countPairsCovered, computeKnockoutPoints } from "@/src/domain/knockout";
import styles from "./tournament.module.css";

/**
 * Pool match + playoff match rendering for knockout mode.
 * Exact port of renderKnockoutFixtures / renderKnockoutMatch from the HTML.
 */
export function KnockoutFixtures() {
  const { knockout, koAdjust, koLock, koLockBye, koUnlock } = useTournament();
  if (!knockout) return null;

  const totalPairs =
    (knockout.effectivePlayers.length *
      (knockout.effectivePlayers.length - 1)) /
    2;
  const covered = countPairsCovered(knockout);

  return (
    <>
      <hr className={styles.divider} />

      {/* Pool info */}
      <div className={styles.poolInfo}>
        Pool stage · {knockout.poolMatches.length} matches ·{" "}
        <span style={{ color: "var(--accent)" }}>
          {covered}/{totalPairs}
        </span>{" "}
        partnerships covered
      </div>

      {/* Pool matches */}
      <div className={styles.fixturesScroll}>
        {knockout.poolMatches.map((m, mi) => (
          <PoolMatchCard key={mi} mi={mi} />
        ))}
      </div>

      {/* Section divider */}
      <div className={styles.sectionDivider}>
        <div className={styles.sectionDividerLine} />
        <div className={styles.sectionDividerLabel}>⬡ Playoff stage</div>
        <div className={styles.sectionDividerLine} />
      </div>

      {/* Playoff matches */}
      <div className={styles.fixturesScroll}>
        {(["match1", "match2", "match3"] as const).map((key) => (
          <PlayoffMatchCard key={key} matchKey={key} />
        ))}
      </div>
    </>
  );
}

// ── Pool Match Card ───────────────────────────────────────────────

function PoolMatchCard({ mi }: { mi: number }) {
  const { knockout, koAdjust, koLock, koLockBye, koUnlock } = useTournament();
  if (!knockout) return null;
  const m = knockout.poolMatches[mi];
  const w1 = m.locked && m.score1 > m.score2;
  const w2 = m.locked && m.score2 > m.score1;

  // Resolve display names for BYE volunteers
  function resolveDisplay(
    pair: [string, string],
    byeArr?: (string | null)[],
    isWinner?: boolean
  ) {
    return pair.map((name, si) => {
      if (name === "BYE" && byeArr && byeArr[si]) {
        return (
          <span
            key={si}
            className={`${styles.teamPlayer} ${isWinner ? styles.winner : ""}`}
            style={{ color: isWinner ? undefined : "var(--bye)" }}
          >
            {byeArr[si]}{" "}
            <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>(BYE)</span>
          </span>
        );
      }
      if (!name || name === "BYE") {
        return (
          <span key={si} className={`${styles.teamPlayer} ${styles.tbd}`}>
            BYE
          </span>
        );
      }
      return (
        <span
          key={si}
          className={`${styles.teamPlayer} ${isWinner ? styles.winner : ""}`}
        >
          {name}
        </span>
      );
    });
  }

  let byeOpponents: [string | null, string | null] = [null, null];
  if (m.isByePool && !m.locked) {
    // We don't know who they are until save, but we know they will be available.
    // The context will assign 2 random players who are not in pair1.
    byeOpponents = ["Random Player 1", "Random Player 2"];
  }

  // Build right team for isByePool
  let rightTeam: React.ReactNode;
  if (m.isByePool && !m.locked) {
    rightTeam = (
      <div className={styles.teamRight}>
        {byeOpponents.map((name, i) =>
          name ? (
            <span key={i} className={styles.teamPlayer} style={{ color: "var(--bye)" }}>
              {name}{" "}
              <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>(BYE)</span>
            </span>
          ) : (
            <span key={i} className={`${styles.teamPlayer} ${styles.tbd}`}>
              Assigned on save
            </span>
          )
        )}
      </div>
    );
  } else {
    rightTeam = (
      <div className={styles.teamRight}>
        {resolveDisplay(m.pair2, m.pair2Bye, w2)}
      </div>
    );
  }

  // Score controls
  let scoreHtml: React.ReactNode;
  if (m.locked) {
    scoreHtml = (
      <div className={styles.scoreRow}>
        <div className={styles.scoreLock}>
          <span className={styles.scoreDisplay}>
            <span className={w1 ? styles.sWin : ""}>{m.score1}</span>
            <span className={styles.scoreDisplaySep}> – </span>
            <span className={w2 ? styles.sWin : ""}>{m.score2}</span>
          </span>
          <button
            className={styles.btnUnlock}
            onClick={() => koUnlock("pool", String(mi))}
          >
            edit
          </button>
        </div>
      </div>
    );
  } else if (m.isByePool) {
    if (false) {
      // Obsolete condition since we don't depend on prior matches anymore
      scoreHtml = null;
    } else {
      scoreHtml = (
        <div className={styles.scoreRow}>
          <div className={styles.scoreBlock}>
            <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 1, -1)}>−</button>
            <div className={styles.scoreVal}>{m.score1}</div>
            <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 1, 1)}>+</button>
          </div>
          <span className={styles.scoreSep}>vs</span>
          <div className={styles.scoreBlock}>
            <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 2, -1)}>−</button>
            <div className={styles.scoreVal}>{m.score2}</div>
            <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 2, 1)}>+</button>
          </div>
          <button className={styles.btnLock} onClick={() => koLockBye(String(mi))}>Save</button>
        </div>
      );
    }
  } else {
    scoreHtml = (
      <div className={styles.scoreRow}>
        <div className={styles.scoreBlock}>
          <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 1, -1)}>−</button>
          <div className={styles.scoreVal}>{m.score1}</div>
          <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 1, 1)}>+</button>
        </div>
        <span className={styles.scoreSep}>vs</span>
        <div className={styles.scoreBlock}>
          <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 2, -1)}>−</button>
          <div className={styles.scoreVal}>{m.score2}</div>
          <button className={styles.scoreBtn} onClick={() => koAdjust("pool", String(mi), 2, 1)}>+</button>
        </div>
        <button className={styles.btnLock} onClick={() => koLock("pool", String(mi))}>Save</button>
      </div>
    );
  }

  return (
    <div className={styles.roundBlock}>
      <div className={styles.roundHeader}>
        <span className={styles.roundLabel}>
          Match {mi + 1}
          {m.isByePool && (
            <span style={{ color: "var(--bye)", fontSize: "0.55rem", marginLeft: 4 }}>
              Last 2 (BYE)
            </span>
          )}
        </span>
        {m.locked && <span className={styles.roundDone}>✓ done</span>}
      </div>
      <div className={`${styles.match} ${m.isByePool ? styles.isByeMatch : ""}`}>
        <div className={styles.matchTeams}>
          <div className={styles.team}>
            {resolveDisplay(m.pair1, m.pair1Bye, w1)}
          </div>
          <span className={styles.vsSep}>vs</span>
          {rightTeam}
        </div>
        {scoreHtml}
      </div>
    </div>
  );
}

// ── Playoff Match Card ────────────────────────────────────────────

function PlayoffMatchCard({
  matchKey,
}: {
  matchKey: "match1" | "match2" | "match3";
}) {
  const { knockout, koAdjust, koLock, koUnlock } = useTournament();
  if (!knockout) return null;
  const m = knockout.playoff[matchKey];
  const w1 = m.locked && m.score1 > m.score2;
  const w2 = m.locked && m.score2 > m.score1;
  const hasTBD = m.pair1.some((p) => !p) || m.pair2.some((p) => !p);

  function renderPlayer(name: string | null, isWinner: boolean) {
    if (!name)
      return (
        <span className={`${styles.teamPlayer} ${styles.tbd}`}>TBD</span>
      );
    return (
      <span
        className={`${styles.teamPlayer} ${isWinner ? styles.winner : ""}`}
      >
        {name}
      </span>
    );
  }

  let scoreHtml: React.ReactNode;
  if (m.locked) {
    scoreHtml = (
      <div className={styles.scoreRow}>
        <div className={styles.scoreLock}>
          <span className={styles.scoreDisplay}>
            <span className={w1 ? styles.sWin : ""}>{m.score1}</span>
            <span className={styles.scoreDisplaySep}> – </span>
            <span className={w2 ? styles.sWin : ""}>{m.score2}</span>
          </span>
          <button
            className={styles.btnUnlock}
            onClick={() => koUnlock("playoff", matchKey)}
          >
            edit
          </button>
        </div>
      </div>
    );
  } else if (hasTBD) {
    scoreHtml = (
      <div className={styles.scoreRow}>
        <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
          Awaiting semi-final results
        </span>
      </div>
    );
  } else {
    scoreHtml = (
      <div className={styles.scoreRow}>
        <div className={styles.scoreBlock}>
          <button className={styles.scoreBtn} onClick={() => koAdjust("playoff", matchKey, 1, -1)}>−</button>
          <div className={styles.scoreVal}>{m.score1}</div>
          <button className={styles.scoreBtn} onClick={() => koAdjust("playoff", matchKey, 1, 1)}>+</button>
        </div>
        <span className={styles.scoreSep}>vs</span>
        <div className={styles.scoreBlock}>
          <button className={styles.scoreBtn} onClick={() => koAdjust("playoff", matchKey, 2, -1)}>−</button>
          <div className={styles.scoreVal}>{m.score2}</div>
          <button className={styles.scoreBtn} onClick={() => koAdjust("playoff", matchKey, 2, 1)}>+</button>
        </div>
        <button className={styles.btnLock} onClick={() => koLock("playoff", matchKey)}>Save</button>
      </div>
    );
  }

  return (
    <div className={styles.roundBlock}>
      <div className={styles.roundHeader}>
        <span className={`${styles.roundLabel} ${styles.playoffLabelHdr}`}>
          {m.label}
        </span>
        {m.locked && <span className={styles.roundDone}>✓ done</span>}
      </div>
      <div className={`${styles.match} ${styles.isPlayoff}`}>
        <div className={styles.matchTeams}>
          <div className={styles.team}>
            {m.pair1.map((p, i) => (
              <span key={i}>{renderPlayer(p, w1)}</span>
            ))}
          </div>
          <span className={styles.vsSep}>vs</span>
          <div className={styles.teamRight}>
            {m.pair2.map((p, i) => (
              <span key={i}>{renderPlayer(p, w2)}</span>
            ))}
          </div>
        </div>
        {scoreHtml}
      </div>
    </div>
  );
}
