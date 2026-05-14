import { TournamentProvider } from "@/src/features/tournament/context";
import { PlayerInput } from "@/src/features/tournament/player-input";
import { Fixtures } from "@/src/features/tournament/fixtures";
import { PointsTable } from "@/src/features/tournament/points-table";
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
      </div>

      <div className={styles.main}>
        <PlayerInput />
        <Fixtures />
        <PointsTable />
      </div>

      <Toast />
    </TournamentProvider>
  );
}
