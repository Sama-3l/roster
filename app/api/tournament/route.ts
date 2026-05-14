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

/** Key prefix to namespace game data. */
const PREFIX = "game:";

/** Lazy singleton — avoids crash at build time if env vars are missing. */
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN env vars"
      );
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

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

  try {
    const redis = getRedis();
    const key = PREFIX + code.toUpperCase();
    const data = await redis.get(key);

    if (!data) {
      return Response.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    return Response.json({ code: code.toUpperCase(), state: data });
  } catch (err) {
    console.error("GET /api/tournament error:", err);
    return Response.json(
      { error: "Server error — Redis may not be configured" },
      { status: 500 }
    );
  }
}

// ── POST — create a new game ──────────────────────────────────────

export async function POST(request: Request) {
  try {
    const redis = getRedis();
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
  } catch (err) {
    console.error("POST /api/tournament error:", err);
    return Response.json(
      { error: "Server error — Redis may not be configured" },
      { status: 500 }
    );
  }
}

// ── PUT — update an existing game ─────────────────────────────────

export async function PUT(request: Request) {
  try {
    const redis = getRedis();
    const body = await request.json();
    const { code, state } = body;

    if (!code || !state) {
      return Response.json(
        { error: "Missing code or state in request body" },
        { status: 400 }
      );
    }

    const key = PREFIX + code.toUpperCase();

    // Upsert — just write, don't require existence for resilience
    await redis.set(key, state, { ex: 2592000 });

    return Response.json({ code: code.toUpperCase(), updated: true });
  } catch (err) {
    console.error("PUT /api/tournament error:", err);
    return Response.json(
      { error: "Server error — Redis may not be configured" },
      { status: 500 }
    );
  }
}
