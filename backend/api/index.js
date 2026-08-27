// Vercel serverless entry — the whole Express gateway is mounted in one function.
// Every path is rewritten here (see vercel.json); Express still sees the original
// path, so routing for /v1/chat/completions, /models, etc. is unchanged.
import app from "../src/server.js";

export default app;
