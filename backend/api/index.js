// Vercel serverless entry — seluruh Express gateway di-mount di satu function.
// Semua path di-rewrite ke sini (lihat vercel.json); Express tetap melihat
// path aslinya, jadi routing /v1/chat/completions, /models, dst. tidak berubah.
import app from "../src/server.js";

export default app;
