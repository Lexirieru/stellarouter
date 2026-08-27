# Screenshots untuk submission

File yang dibutuhkan README root (nama harus persis):

| File | Cara ambil |
|---|---|
| `wallet-options.png` | Buka console (`cd frontend && bun run dev`) → klik **Connect Wallet** di sidebar → screenshot modal Stellar Wallets Kit yang menampilkan daftar wallet (Freighter, xBull, Albedo, Lobstr, Hana, …). Ini bukti multi-wallet untuk checklist Level 2. |
| `credits-live-feed.png` | Halaman **Credits** dengan wallet terhubung: lakukan top-up kecil, tangkap saat kartu status transaksi tampil (pending/confirmed) dan feed **On-chain activity** berisi event. Jalankan `node scripts/simulate-users.js` di backend/ dulu supaya feed ramai. |
| `playground.png` | Halaman **Playground** — toggle agent/human terlihat. |

Tips: jendela ~1280px lebar, light mode, crop rapi tanpa bookmark bar.

File Level 3 (sudah tergenerate otomatis via Playwright):

| File | Isi |
|---|---|
| `mobile-playground.png` / `mobile-credits.png` | UI mobile 390×844 (checklist "mobile responsive UI") |
| `ci-pipeline.png` | Halaman commits GitHub: popover status commit ✓ "Vercel — Deployment has completed" (CD via Git integration) |
| `ci-build-log.png` | Build log Vercel untuk commit tersebut (`vercel inspect <url> --logs`) |

