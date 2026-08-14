# Stellarouter vs Ekosistem — Komparasi & Diferensiasi

> Sumber: survei ekosistem via **Stellar Raven MCP** (direktori proyek stellarlight.xyz,
> submission Stellar Hacks: Agents/DoraHacks, SCF records) — per 14 Agustus 2026.

## Lanskap: "AI membayar API di Stellar"

Space ini panas dan tervalidasi — SDF punya use case resmi **agentic payments**
(x402 + MPP), dan hackathon *Stellar Hacks: Agents* melahirkan belasan proyek.
Tapi hampir semuanya berhenti di lapisan **infrastruktur/middleware**:

| Proyek | Apa itu | Lapisan | Bukti |
|---|---|---|---|
| **REAPP** | Protokol otorisasi agentic (x402 + policy Soroban + mandat AP2) sebagai SDK TypeScript | SDK/protokol | SCF Build **$70k** (round 43) |
| **stellar/stellar-mpp-sdk** | SDK resmi Stellar untuk MPP (charge + payment channels) | SDK resmi | repo aktif |
| **x402 MCP Stellar Template** | Template Node/Python/Go untuk MCP server berbayar | Template | 4th place, Stellar Hacks: Agents |
| **TollPay** | Middleware monetisasi MCP tools per-call USDC | Middleware | Winner, Stellar Hacks: Agents |
| **StellarPay402** | Marketplace API agent-to-agent + registry Soroban | Marketplace | Agentic Hackathon (judge 1.0) |
| **PUMAx402** | Hub x402: katalog REST+UI + CLI/MCP client 402→pay→retry | Hub/katalog API generik | Stellar Hacks: Agents |
| **PLUTO** | Payment gateway ala Stripe untuk merchant + dukungan x402 | Gateway pembayaran umum | Stellar Hacks: Agents |
| **AXON (DeAI)** | Marketplace AI terdesentralisasi, pay-per-inference x402/MPP | Marketplace inference | Stellar Hacks: Agents |
| **RenderGate** | API headless-browser pay-per-render via x402 | Satu API vertikal | 3rd place, Stellar Hacks: Agents |
| **x402kit / Oxide Gateway / Sentryx402 / NyayaMitra** | Toolkit & API vertikal berbayar x402 | Toolkit/API tunggal | Stellar Hacks: Agents |
| **Nirium** | Protokol treasury & micropayments otonom + SDK agent | Protokol/SDK | Agentic Hackathon |

**Yang paling dekat** dengan kita: AXON (pay-per-inference marketplace) dan PUMAx402
(katalog + client). Keduanya prototype hackathon, tanpa product surface untuk manusia,
tanpa billing prepaid on-chain, tanpa manajemen key.

## Diferensiasi Stellarouter

Stellarouter bukan SDK dan bukan marketplace generik — ini **produk gateway LLM
end-to-end ala OpenRouter**, dengan billing yang justru tidak mungkin ditiru OpenRouter:

1. **Dual-door billing — satu-satunya di lanskap ini.**
   - *Pintu agent:* x402 pay-per-call. Tanpa akun, tanpa API key, tanpa saldo — dan
     **nol XLM** (fee disponsori facilitator OZ Channels). Agen bayar $0.005 USDC per call.
   - *Pintu manusia:* prepaid credits ala OpenRouter, tapi saldonya **hidup di kontrak
     Soroban** (`credits`), bukan di database kami.
2. **Saldo non-custodial & refundable.** Di OpenRouter, kredit adalah entri database
   custodial yang hangus sesuai kebijakan mereka. Di Stellarouter, `withdraw()` mengembalikan
   USDC yang tidak terpakai kapan saja — admin hanya bisa men-debit usage, tidak bisa
   menyentuh sisa saldo user.
3. **Proof-of-billing on-chain.** Setiap `deposit`/`debit`/`withdraw` memancarkan contract
   event yang bisa diverifikasi siapa pun di explorer. Tagihan LLM yang auditable publik —
   tidak ada gateway web2 (OpenRouter, Together, dsb.) yang bisa menawarkan ini.
4. **Wallet = akun.** API key diikat ke kepemilikan wallet lewat challenge ala SEP-10
   (tanda tangan, bukan email/password). Key di-hash (SHA-256) di server.
5. **Product surface lengkap**, bukan endpoint tunggal: katalog model (OpenRouter API),
   Playground dengan mode agent/human, halaman Keys, usage Logs, activity feed on-chain
   real-time.
6. **Mainnet by config.** Seluruh jalur pembayaran dirancang flip-`.env` ke pubnet tanpa
   perubahan kode.

### Positioning satu kalimat

> **Stellarouter = OpenRouter yang tagihannya bisa diaudit di blockchain** — agen AI bayar
> per-call lewat x402 tanpa punya XLM, manusia top-up USDC ke vault kredit on-chain yang
> bisa ditarik kembali kapan saja.

### Cara pakai komparasi ini

- **Submission ide L4:** kutip REAPP ($70k SCF) dan barisan pemenang Stellar Hacks: Agents
  sebagai *validasi pasar*, lalu tunjukkan gap: belum ada produk gateway LLM utuh.
- **Demo/video:** tunjukkan dua pintu berdampingan — terminal agent (402 → pay → 200) dan
  browser manusia (top-up → chat → saldo berkurang → event muncul di feed + explorer).
