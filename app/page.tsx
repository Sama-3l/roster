"use client";

import { useState, useCallback } from "react";
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
import { GamesList } from "@/src/features/tournament/games-list";
import Link from "next/link";
import styles from "@/src/features/tournament/tournament.module.css";

type Tab = "new" | "games";

function HomeContent() {
  const [activeTab, setActiveTab] = useState<Tab>("new");

  const switchToNew = useCallback(() => setActiveTab("new"), []);

  return (
    <>
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

        {/* Tab bar */}
        <div className={styles.tabBar} role="tablist">
          <button
            id="tab-new-game"
            role="tab"
            aria-selected={activeTab === "new"}
            className={`${styles.tabBtn} ${activeTab === "new" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("new")}
          >
            New Game
          </button>
          <button
            id="tab-games"
            role="tab"
            aria-selected={activeTab === "games"}
            className={`${styles.tabBtn} ${activeTab === "games" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("games")}
          >
            Games
          </button>
        </div>

        {/* Mode selector only shown on New Game tab */}
        {activeTab === "new" && <ModeSelector />}
      </div>

      <div className={styles.main}>
        {activeTab === "games" ? (
          <GamesList onGameLoaded={switchToNew} />
        ) : (
          <>
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
          </>
        )}
      </div>

      <Toast />
    </>
  );
}

export default function Home() {
  return (
    <TournamentProvider>
      <HomeContent />
    </TournamentProvider>
  );
}
