/**
 * Tournament API — file-based JSON persistence.
 *
 * - POST /api/tournament         → Create game, returns { code }
 * - GET  /api/tournament?code=XX → Retrieve game by code
 * - PUT  /api/tournament         → Update existing game
 */

import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

/** Ensure the data directory exists. */
async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

/** Generate a 6-character alphanumeric code. */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous I/O/0/1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function filePath(code: string): string {
  // Sanitize: only allow alphanumeric
  const safe = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return path.join(DATA_DIR, `${safe}.json`);
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
    const fp = filePath(code);
    const data = await fs.readFile(fp, "utf-8");
    return Response.json({ code: code.toUpperCase(), state: JSON.parse(data) });
  } catch {
    return Response.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }
}

// ── POST — create a new game ──────────────────────────────────────

export async function POST(request: Request) {
  await ensureDir();
  const body = await request.json();

  // Generate unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
  } while (
    attempts < 100 &&
    await fileExists(filePath(code))
  );

  const fp = filePath(code);
  await fs.writeFile(fp, JSON.stringify(body, null, 2), "utf-8");

  return Response.json({ code }, { status: 201 });
}

// ── PUT — update an existing game ─────────────────────────────────

export async function PUT(request: Request) {
  await ensureDir();
  const body = await request.json();
  const { code, state } = body;

  if (!code || !state) {
    return Response.json(
      { error: "Missing code or state in request body" },
      { status: 400 }
    );
  }

  const fp = filePath(code);

  if (!(await fileExists(fp))) {
    return Response.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }

  await fs.writeFile(fp, JSON.stringify(state, null, 2), "utf-8");

  return Response.json({ code, updated: true });
}

// ── Helper ────────────────────────────────────────────────────────

async function fileExists(fp: string): Promise<boolean> {
  try {
    await fs.access(fp);
    return true;
  } catch {
    return false;
  }
}
