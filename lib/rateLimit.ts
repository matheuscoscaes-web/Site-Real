const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Limitador simples em memória (por instância do processo). Suficiente para
 * conter força bruta/spam num app rodando numa única instância; não é
 * distribuído entre múltiplas instâncias nem sobrevive a um restart.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count++;
  return true;
}

export function getClientIp(headers: Headers | Record<string, string | undefined> | undefined): string {
  if (!headers) return "unknown";
  const forwarded = headers instanceof Headers ? headers.get("x-forwarded-for") : headers["x-forwarded-for"];
  if (!forwarded) return "unknown";
  return forwarded.split(",")[0].trim();
}
