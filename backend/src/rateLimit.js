// Naive in-memory rate limiter (per IP, fixed window). On serverless this is
// per-instance — a soft brake, not a hard guarantee; a production build would
// back it with a shared store. Enough to stop casual draining of the demo
// wallet and feedback spam (see docs/SECURITY-REVIEW.md).

const buckets = new Map();

export function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.path}:${req.headers["x-forwarded-for"]?.split(",")[0] ?? req.ip}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      res.setHeader("Retry-After", Math.ceil((b.resetAt - now) / 1000));
      return res.status(429).json({
        error: "rate_limited",
        message: `Too many requests — try again in ${Math.ceil((b.resetAt - now) / 1000)}s.`,
      });
    }
    if (buckets.size > 10_000) buckets.clear(); // crude memory bound
    next();
  };
}
