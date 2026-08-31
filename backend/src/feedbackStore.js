// User feedback store (product validation). Backed by SQLite like the key and
// log stores; on serverless point FEEDBACK_DB_PATH at /tmp (ephemeral — a
// production build would use a hosted DB, see docs/FEEDBACK.md).

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.FEEDBACK_DB_PATH || "data/feedback.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    ts      INTEGER NOT NULL,
    rating  INTEGER NOT NULL,
    text    TEXT NOT NULL,
    wallet  TEXT,
    page    TEXT
  )
`);

export function addFeedback({ rating, text, wallet, page }) {
  db.prepare(
    "INSERT INTO feedback (ts, rating, text, wallet, page) VALUES (?, ?, ?, ?, ?)"
  ).run(Date.now(), rating, text, wallet ?? null, page ?? null);
}

export function listFeedback(limit = 50) {
  return db
    .prepare("SELECT ts, rating, text, wallet, page FROM feedback ORDER BY id DESC LIMIT ?")
    .all(limit);
}

export function feedbackStats() {
  const row = db
    .prepare("SELECT COUNT(*) AS count, AVG(rating) AS avg FROM feedback")
    .get();
  return { count: row.count ?? 0, avgRating: row.avg ? Number(row.avg.toFixed(2)) : null };
}
