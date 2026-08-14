# Stellarouter — Roadmap Sprint Agustus 2026 (RiseIn Stellar Journey to Mastery)

> Target: substansi **Level 2 → Level 5** rampung dalam Agustus. Development full-AI
> (diizinkan devrel), aktivitas user direpresentasikan wallet testnet yang di-generate
> untuk bertransaksi nyata di kontrak `credits`.

## Status

| Level | Status | Catatan |
|---|---|---|
| 1 — White Belt | ✅ Lulus | |
| 2 — Yellow Belt | 🔨 Sprint minggu ini | Challenge aktif Agustus |
| 3 — Orange Belt | 🔜 Minggu depan | Termasuk submit ide Level 4 |
| 4–6 | 🔒 Terkunci | Butuh approval ide dari Stellar Builder Team |

**Risiko satu-satunya di luar kendali:** approval ide L4 + cadence platform (kalau
review-nya bulanan, submit L4/L5 mungkin jatuh di periode berikutnya — materi tetap
disiapkan sekarang supaya begitu unlock tinggal submit).

## Minggu 3 Agustus (14–17) — Level 2 ✅ deliverables

- [x] Kontrak `credits` deployed testnet: `CAEFFQAL6SGQF6OV5BOBE23NAC2T7WXOUUE5XRDOH2KRN2HXRMDXA7RE`
- [x] Kontrak dipanggil dari frontend (read `balance` via simulate, write `deposit`/`withdraw`)
- [x] **StellarWalletsKit** — multi-wallet picker (Freighter, xBull, Albedo, Hana, dll)
- [x] **Status transaksi** signing → submitting → pending → success/fail + tx hash (link stellar.expert)
- [x] **5 error types**: wallet not found · user rejected · insufficient balance · network mismatch · tx failed
- [x] **Event listening real-time**: poll `getEvents` RPC → activity feed + auto-refresh saldo
- [x] **Simulasi user**: `backend/scripts/simulate-users.js` — 3 user, 16 tx nyata (14 Agu)
- [x] **Root README** — setup, alamat kontrak, tx hash verifiable (screenshot: tinggal capture, lihat docs/screenshots/README.md)
- [x] 10+ meaningful commits (sudah 39+)

## Minggu 3–4 Agustus (18–24) — Level 3

- [x] CI/CD GitHub Actions: `ci.yml` (cargo test + wasm + lint/test/build frontend + boot check gateway) + `deploy-contract.yml` (deploy testnet sekali-klik)
- [x] Deploy live frontend → **GitHub Pages** (static export, branch `gh-pages`): https://lexirieru.github.io/stellarouter/
- [ ] Host gateway (Railway free plan penuh — butuh keputusan user: upgrade Railway / `fly auth login` / Render)
- [ ] Screenshot CI hijau — **terblokir billing lock GitHub Actions** ("account is locked due to a billing issue"): buka github.com/settings/billing, selesaikan, lalu `gh run rerun --repo Lexirieru/stellarouter <run-id>`
- [x] Test frontend: 16 unit test bun (errors, stroops, parseEvent) + 9 test kontrak
- [x] Mobile responsive (top bar + nav scroll) + screenshot 390px
- [x] Demo video 1:05 — `docs/demo/stellarouter-demo.mp4`
- [x] Inter-contract call: sudah ada (credits → USDC SAC via `token::Client`)
- [ ] **Submit ide Level 4** — draft siap di [L4-IDEA.md](./L4-IDEA.md), tinggal user submit

## Minggu 4–5 Agustus (25–31) — Materi Level 4 & 5 (submit begitu unlock)

Level 4 — produk production-grade:
- [ ] Per-model pricing di pintu x402 (route berbayar per tier model)
- [ ] Streaming responses (SSE) di Playground & API
- [ ] Rate limiting + observability (metrics per key, per model)
- [ ] Hardening kontrak: event untuk `set_admin`, pause switch (opsional)

Level 5 — traction + mainnet-ready:
- [ ] Onboarding flow agent (SKILL.md + contoh client → agen AI mana pun bisa bayar)
- [ ] Dokumentasi publik + landing page live
- [ ] Checklist mainnet: flip `.env` (pubnet, facilitator OZ mainnet, USDC Circle mainnet) — by design tanpa ubah kode
- [ ] Bukti penggunaan: log usage nyata dari wallet simulasi + agen demo

## Ide Level 4 (untuk approval — ringkasan)

1. **Problem:** AI agent tidak bisa punya kartu kredit; API LLM terkunci di balik langganan
   & API key milik manusia. Manusia pun tidak bisa mengaudit tagihan LLM mereka.
2. **Why Stellar:** USDC native (SAC), settlement ~5 detik, x402 + OZ Channels mensponsori
   fee (agent butuh USDC, nol XLM), Soroban untuk ledger kredit yang bisa diaudit publik.
3. **Target users:** AI agents (pintu x402 per-call) + developer manusia (pintu prepaid credits).
4. **Arsitektur:** Next.js console → Express gateway (x402 + key store) → kontrak `credits`
   (Soroban) + USDC SAC; katalog model dari OpenRouter API; routing chat via upstream OpenAI-compatible.
5. **Kompleksitas:** dual billing (streaming vs prepaid), harga LLM baru diketahui setelah
   respons vs x402 butuh harga di muka, proof-of-billing on-chain, key↔wallet binding ala SEP-10.
6. **Roadmap:** MVP (sudah jalan di testnet) → user acquisition (template agent + SKILL.md,
   komunitas Stellar Hacks) → mainnet (flip env, audit kontrak).

Detail komparasi & diferensiasi: [COMPARISON.md](./COMPARISON.md)
