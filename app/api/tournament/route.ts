/**
 * Tournament API — Upstash Redis persistence.
 *
 * Stores game state as JSON values keyed by 6-char codes.
 * Works on Vercel serverless, local dev, and anywhere with env vars set.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * - POST /api/tournament         → Create game, returns { code }
 * - GET  /api/tournament?code=XX → Retrieve game by code
 * - PUT  /api/tournament         → Update existing game
 */

import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Key prefix to namespace game data. */
const PREFIX = "game:";

/** Generate a 6-character alphanumeric code (no ambiguous chars). */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── GET — retrieve a game by code ─────────────────────────────────

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return Response.json(
      { error: "Missing ?code= parameter" },
      { status: 400 }
    );
  }

  const key = PREFIX + code.toUpperCase();
  const data = await redis.get(key);

  if (!data) {
    return Response.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }

  return Response.json({ code: code.toUpperCase(), state: data });
}

// ── POST — create a new game ──────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json();

  // Generate a unique code (retry on collision)
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    const exists = await redis.exists(PREFIX + code);
    if (!exists) break;
  } while (attempts < 100);

  const key = PREFIX + code;
  // Store with 30-day TTL (2592000 seconds)
  await redis.set(key, body, { ex: 2592000 });

  return Response.json({ code }, { status: 201 });
}

// ── PUT — update an existing game ─────────────────────────────────

export async function PUT(request: Request) {
  const body = await request.json();
  const { code, state } = body;

  if (!code || !state) {
    return Response.json(
      { error: "Missing code or state in request body" },
      { status: 400 }
    );
  }

  const key = PREFIX + code.toUpperCase();
  const exists = await redis.exists(key);

  if (!exists) {
    return Response.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }

  // Update with refreshed 30-day TTL
  await redis.set(key, state, { ex: 2592000 });

  return Response.json({ code: code.toUpperCase(), updated: true });
}
