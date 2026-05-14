/**
 * Tournament API route handler — stub for future backend implementation.
 *
 * Intended API shape:
 * - GET  /api/tournament        → list saved tournaments
 * - POST /api/tournament        → create/save a tournament
 * - GET  /api/tournament/[id]   → fetch a specific tournament
 * - PUT  /api/tournament/[id]   → update match scores
 */

export async function GET() {
  return Response.json({
    message: "Tournament API — not yet implemented",
    endpoints: {
      "GET /api/tournament": "List saved tournaments",
      "POST /api/tournament": "Create/save a tournament",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  return Response.json(
    {
      message: "Tournament creation — not yet implemented",
      received: body,
    },
    { status: 501 }
  );
}
