// API key store for the human (prepaid) door: maps an API key → Stellar address.
// In-memory for the demo (lost on restart); production would use a DB and verify
// address ownership before issuing a key.

import { randomBytes } from "node:crypto";

const store = new Map(); // key -> address

// Seed the demo key from env so the Playground works out of the box.
if (process.env.DEMO_API_KEY && process.env.DEMO_USER_ADDRESS) {
  store.set(process.env.DEMO_API_KEY, process.env.DEMO_USER_ADDRESS);
}

export function createKey(address) {
  const key = "sk-stellarouter-" + randomBytes(18).toString("hex");
  store.set(key, address);
  return key;
}

export function resolveKey(key) {
  return store.get(key) || null;
}

export function listKeys(address) {
  return [...store.entries()].filter(([, a]) => a === address).map(([k]) => k);
}

export function revokeKey(key) {
  return store.delete(key);
}
