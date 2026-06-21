// API key store for the human (prepaid) door — persistent + hashed.
//
// Keys map to a Stellar address (for on-chain billing). The plaintext key is
// shown ONCE on creation; only its SHA-256 hash is stored, so a DB leak never
// exposes usable keys. Backed by SQLite so keys survive restarts.

import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.KEYS_DB_PATH || "data/keys.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    hash       TEXT PRIMARY KEY,
    address    TEXT NOT NULL,
    prefix     TEXT NOT NULL,
    name       TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_api_keys_address ON api_keys(address);
`);
// Migrate older DBs that predate the `name` column.
try {
  db.exec("ALTER TABLE api_keys ADD COLUMN name TEXT");
} catch {
  // column already exists
}

const hashKey = (key) => createHash("sha256").update(key, "utf8").digest("hex");
const mask = (key) => `${key.slice(0, 18)}…${key.slice(-4)}`;

const insertStmt = db.prepare(
  "INSERT OR IGNORE INTO api_keys (hash, address, prefix, name, created_at) VALUES (?, ?, ?, ?, ?)"
);

// Seed the demo key (hashed) so the Playground works out of the box.
if (process.env.DEMO_API_KEY && process.env.DEMO_USER_ADDRESS) {
  const key = process.env.DEMO_API_KEY;
  insertStmt.run(hashKey(key), process.env.DEMO_USER_ADDRESS, mask(key), "demo", Date.now());
}

export function createKey(address, name) {
  const key = "sk-stellarouter-" + randomBytes(24).toString("hex");
  insertStmt.run(hashKey(key), address, mask(key), name || null, Date.now());
  return key; // full key — shown once, never stored in plaintext
}

export function resolveKey(key) {
  const row = db
    .prepare("SELECT address FROM api_keys WHERE hash = ?")
    .get(hashKey(key));
  return row ? row.address : null;
}

export function listKeys(address) {
  return db
    .prepare(
      "SELECT hash AS id, prefix, name, created_at AS createdAt FROM api_keys WHERE address = ? ORDER BY created_at DESC"
    )
    .all(address);
}

export function revokeKey(id) {
  const info = db.prepare("DELETE FROM api_keys WHERE hash = ?").run(id);
  return info.changes > 0;
}
