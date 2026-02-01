const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export const checkRateLimit = (identifier: string) => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count += 1;
  rateLimitMap.set(identifier, record);
  return true;
};
