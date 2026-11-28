// Lightweight in-memory rate limiter (per IP). Suitable for a single instance.
export function rateLimit({ windowMs, max, message = "Trop de requetes. Reessayez plus tard." }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (now - entry.startedAt >= windowMs) hits.delete(key);
  }, windowMs);
  timer.unref?.();

  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.startedAt >= windowMs) {
      hits.set(key, { startedAt: now, count: 1 });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.startedAt + windowMs - now) / 1000)));
      return res.status(429).json({ message });
    }
    next();
  };
}
