// Request usage logs (persistent, SQLite). One row per completion across both
// doors — feeds the Logs page (model, provider, tokens, cost, speed, key).

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.LOGS_DB_PATH || "data/logs.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS usage_logs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    ts                INTEGER NOT NULL,
    model             TEXT,
    provider          TEXT,
    prompt_tokens     INTEGER,
    completion_tokens INTEGER,
    cost              REAL,
    mode              TEXT,
    label             TEXT,
    speed             REAL,
    finish_reason     TEXT
  );
`);

const insertStmt = db.prepare(`
  INSERT INTO usage_logs
    (ts, model, provider, prompt_tokens, completion_tokens, cost, mode, label, speed, finish_reason)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function logUsage(e) {
  try {
    insertStmt.run(
      e.ts,
      e.model ?? null,
      e.provider ?? null,
      e.promptTokens ?? 0,
      e.completionTokens ?? 0,
      e.cost ?? null,
      e.mode ?? null,
      e.label ?? null,
      e.speed ?? null,
      e.finishReason ?? null
    );
  } catch {
    // logging must never break a request
  }
}

export function listLogs(limit = 100) {
  return db
    .prepare(
      `SELECT ts, model, provider,
              prompt_tokens AS promptTokens, completion_tokens AS completionTokens,
              cost, mode, label, speed, finish_reason AS finishReason
       FROM usage_logs ORDER BY ts DESC LIMIT ?`
    )
    .all(limit);
}
