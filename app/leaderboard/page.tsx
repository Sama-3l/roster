import { getSupabase } from "@/src/lib/supabase";
import Link from "next/link";
import styles from "@/src/features/tournament/tournament.module.css";

export const revalidate = 0; // Ensure data is fetched fresh

export default async function LeaderboardPage() {
  const supabase = getSupabase();
  const { data: stats, error } = await supabase
    .from("player_stats")
    .select("*")
    .order("total_points", { ascending: false });

  return (
    <div className={styles.main}>
      <div className={styles.header} style={{ padding: "2rem 0 1rem", maxWidth: "100%" }}>
        <div className={styles.logo}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            ROSTER<span className={styles.logoSuffix}>/badminton</span>
          </Link>
        </div>
        <div className={styles.tagline}>Global Leaderboard</div>
      </div>

      <div className={styles.pointsSection}>
        {error ? (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem" }}>
            Error loading leaderboard: {error.message}
          </div>
        ) : !stats || stats.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            No stats recorded yet.
          </div>
        ) : (
          <div className={styles.pointsTable}>
            {/* Header row */}
            <div className={styles.singlesHeaderRow}>
              <span className={styles.rankNum}>#</span>
              <span className={styles.pointsName}>Player</span>
              <span className={styles.singlesStatHeader}>M</span>
              <span className={styles.pointsVal}>Pts</span>
            </div>
            {stats.map((s, i) => (
              <div
                key={(s as any).player_name}
                className={i === 0 ? styles.pointsRowTop : styles.pointsRow}
              >
                <span className={i === 0 ? styles.rankNumGold : styles.rankNum}>
                  {i + 1}
                </span>
                <span className={styles.pointsName}>{(s as any).player_name}</span>
                <span className={styles.singlesStat}>{(s as any).matches_played}</span>
                <span className={styles.pointsVal}>{(s as any).total_points}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Link href="/" className={styles.btnPrimary} style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
          ← Back to Tournament
        </Link>
      </div>
    </div>
  );
}
