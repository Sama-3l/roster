import { TournamentProvider } from "@/src/features/tournament/context";
import { ModeSelector } from "@/src/features/tournament/mode-selector";
import { PlayerInput } from "@/src/features/tournament/player-input";
import { GameCode } from "@/src/features/tournament/game-code";
import { Fixtures } from "@/src/features/tournament/fixtures";
import { PointsTable } from "@/src/features/tournament/points-table";
import { KnockoutFixtures } from "@/src/features/tournament/knockout-fixtures";
import { KnockoutStandings } from "@/src/features/tournament/knockout-standings";
import { BracketGrid } from "@/src/features/tournament/bracket-grid";
import { Toast } from "@/src/features/tournament/toast";
import styles from "@/src/features/tournament/tournament.module.css";

export default function Home() {
  return (
    <TournamentProvider>
      <div className={styles.header}>
        <div className={styles.logo}>
          AMERICANO<span className={styles.logoSuffix}>/badminton</span>
        </div>
        <div className={styles.tagline}>
          Doubles · Rotating pairs · Individual scoring
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
        <BracketGrid />
      </div>

      <Toast />
    </TournamentProvider>
  );
}

