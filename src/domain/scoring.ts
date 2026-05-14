import type { Standing, Tournament } from "./types";

/**
 * Compute points standings for a tournament.
 *
 * BYE volunteer's score is credited to the volunteer (their real name),
 * not to 'BYE'. Since we store `byeVolunteer` on the match, we resolve
 * real players per pair before accumulating.
 *
 * Only locked matches count toward points.
 *
 * @returns Standings sorted descending by points.
 */
export function computePoints(tournament: Tournament): Standing[] {
  const pts: Record<string, number> = {};
  tournament.players.forEach((p) => {
    pts[p] = 0;
  });

  tournament.rounds.forEach((rd) => {
    rd.matches.forEach((m) => {
      if (!m.locked) return;

      // Resolve real names (BYE → volunteer)
      const real1 = m.pair1.map((n) =>
        n === "BYE" && m.byeVolunteer ? m.byeVolunteer : n
      );
      const real2 = m.pair2.map((n) =>
        n === "BYE" && m.byeVolunteer ? m.byeVolunteer : n
      );

      real1.forEach((p) => {
        if (pts[p] !== undefined) pts[p] += m.score1;
      });
      real2.forEach((p) => {
        if (pts[p] !== undefined) pts[p] += m.score2;
      });
    });
  });

  return Object.entries(pts)
    .map(([name, p]) => ({ name, pts: p }))
    .sort((a, b) => b.pts - a.pts);
}
