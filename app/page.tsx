import { TournamentProvider } from "@/src/features/tournament/context";
import { ModeSelector } from "@/src/features/tournament/mode-selector";
import { PlayerInput } from "@/src/features/tournament/player-input";
import { GameCode } from "@/src/features/tournament/game-code";
import { Fixtures } from "@/src/features/tournament/fixtures";
import { PointsTable } from "@/src/features/tournament/points-table";
import { KnockoutFixtures } from "@/src/features/tournament/knockout-fixtures";
import { KnockoutStandings } from "@/src/features/tournament/knockout-standings";

import { SinglesFixtures } from "@/src/features/tournament/singles-fixtures";
import { SinglesStandings } from "@/src/features/tournament/singles-standings";
import { Toast } from "@/src/features/tournament/toast";
import Link from "next/link";
import styles from "@/src/features/tournament/tournament.module.css";

export default function Home() {
  return (
    <TournamentProvider>
      <div className={styles.header}>
        <div className={styles.logo}>
          ROSTER<span className={styles.logoSuffix}>/badminton</span>
        </div>
        <div className={styles.taglineRow}>
          <div className={styles.tagline}>
            Americano · Knockout · Singles
          </div>
          <Link href="/leaderboard" className={styles.leaderboardLink}>
            Leaderboard ↗
          </Link>
        </div>
        <ModeSelector />
      </div>

      <div className={styles.main}>
        <GameCode />
        <PlayerInput />

        {/* Americano mode */}
        <Fixtures />
        <PointsTable />

        {/* Knockout mode */}
        <KnockoutFixtures />
        <KnockoutStandings />

        {/* Singles mode */}
        <SinglesFixtures />
        <SinglesStandings />
      </div>

      <Toast />
    </TournamentProvider>
  );
}

