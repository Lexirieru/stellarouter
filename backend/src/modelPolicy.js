// Kebijakan model per jaringan.
//
// Testnet memakai USDC tiruan, tapi upstream LLM (OpenRouter) menagih dolar
// sungguhan — jadi di testnet hanya model GRATIS/termurah yang diaktifkan.
// Katalog tetap ditampilkan penuh supaya produknya terlihat utuh; model lain
// diberi label "available in mainnet" dan ditolak SEBELUM pembayaran.
// Di pubnet (mainnet) seluruh katalog aktif tanpa perubahan kode.

const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
export const IS_MAINNET = NETWORK === "stellar:pubnet";

// Model gratis di OpenRouter (suffix ":free" = $0 in/out). Override via env:
//   TESTNET_MODELS=google/gemma-4-31b-it:free,minimax/minimax-m3:free
// Urutan = prioritas fallback (diprobe 27 Agu 2026: minimax paling stabil &
// jawabannya bersih; gemma bagus tapi sering 429; nemotron cadangan terakhir).
const DEFAULT_TESTNET_MODELS = [
  "minimax/minimax-m3:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

export const TESTNET_MODELS = (process.env.TESTNET_MODELS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (TESTNET_MODELS.length === 0) TESTNET_MODELS.push(...DEFAULT_TESTNET_MODELS);

const allowed = new Set(TESTNET_MODELS);

/** Model default untuk request tanpa `model`. */
export const DEFAULT_MODEL = IS_MAINNET ? "openai/gpt-4o-mini" : TESTNET_MODELS[0];

export function isModelEnabled(id) {
  if (IS_MAINNET) return true;
  return typeof id === "string" && allowed.has(id);
}

/** Daftar model yang bisa dipakai sekarang (kosong = semua, di mainnet). */
export function enabledModels() {
  return IS_MAINNET ? [] : [...TESTNET_MODELS];
}

/**
 * Tambahkan `enabled` + `availability` ke setiap entri katalog OpenRouter dan
 * letakkan model yang aktif di urutan teratas.
 */
export function annotateCatalog(data) {
  const list = Array.isArray(data?.data) ? data.data : [];
  const annotated = list.map((m) => {
    const enabled = isModelEnabled(m.id);
    return { ...m, enabled, availability: enabled ? "now" : "mainnet" };
  });
  annotated.sort((a, b) => Number(b.enabled) - Number(a.enabled));
  return {
    ...data,
    data: annotated,
    network: NETWORK,
    enabled_models: enabledModels(),
    policy: IS_MAINNET
      ? "all models enabled"
      : "testnet: only free/cheapest models enabled — full catalog on mainnet",
  };
}

/**
 * Validasi `body.model` untuk request chat. Mengisi default bila kosong.
 * Mengembalikan objek error (untuk res.status(400).json(...)) atau null.
 */
export function gateModel(body) {
  if (!body || typeof body !== "object") return null;
  if (!body.model) {
    body.model = DEFAULT_MODEL;
    return null;
  }
  if (isModelEnabled(body.model)) return null;
  return {
    error: "model_unavailable_on_testnet",
    message: `"${body.model}" is available on mainnet only. Enabled on ${NETWORK}: ${TESTNET_MODELS.join(", ")}.`,
    enabled_models: enabledModels(),
    availability: "mainnet",
  };
}
