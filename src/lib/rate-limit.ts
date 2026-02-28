const windowMs = 10 * 60 * 1000; // 10 minutes
const maxHits = 3;

const store = new Map<string, number[]>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) store.delete(key);
    else store.set(key, valid);
  }
}, 5 * 60 * 1000).unref();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const timestamps = (store.get(key) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxHits) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}
