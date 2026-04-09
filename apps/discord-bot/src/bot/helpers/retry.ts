export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function parseRetryAfterMs(value: string): number {
  if (!value) return 0;

  const asSeconds = Number(value);
  if (Number.isFinite(asSeconds) && asSeconds > 0) {
    return Math.round(asSeconds * 1_000);
  }

  const asDate = Date.parse(value);
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - Date.now());
  }

  return 0;
}

export function retryDelayMs(baseMs: number, attempt: number): number {
  const backoff = baseMs * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(15_000, backoff + jitter);
}

export function isRetryableHttpStatus(statusCode: number): boolean {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

export function asNonRetryable<T extends Record<string, any>>(error: T): T {
  if (error && typeof error === "object") {
    (error as any).nonRetryable = true;
  }
  return error;
}
