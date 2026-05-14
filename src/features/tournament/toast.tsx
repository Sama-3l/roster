"use client";

import { useTournament } from "./context";
import styles from "./tournament.module.css";

/**
 * Fixed-position toast notification that appears after copying
 * the points table.
 */
export function Toast() {
  const { toastVisible } = useTournament();

  return (
    <div
      className={`${styles.toast} ${toastVisible ? styles.toastShow : ""}`}
      role="status"
      aria-live="polite"
    >
      Copied!
    </div>
  );
}
