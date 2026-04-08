export function summarizeBody(body) {
  return String(body || "").replace(/\s+/g, " ").slice(0, 260);
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function parseRetryAfterMs(value) {
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

export function retryDelayMs(baseMs, attempt) {
  const backoff = baseMs * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(15_000, backoff + jitter);
}

export function isRetryableHttpStatus(statusCode) {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

export function asNonRetryable(error) {
  if (error && typeof error === "object") {
    error.nonRetryable = true;
  }
  return error;
}

export function collectNetworkErrorCodes(error, seen = new Set()) {
  if (!error || typeof error !== "object" || seen.has(error)) {
    return [];
  }

  seen.add(error);
  const codes = [];

  const maybeCode = error.code;
  if (typeof maybeCode === "string" && maybeCode.trim()) {
    codes.push(maybeCode.trim().toUpperCase());
  }

  if (Array.isArray(error.errors)) {
    for (const child of error.errors) {
      codes.push(...collectNetworkErrorCodes(child, seen));
    }
  }

  if (error.cause) {
    codes.push(...collectNetworkErrorCodes(error.cause, seen));
  }

  return codes;
}

export function normalizeFetchNetworkError(error, url) {
  if (!(error instanceof Error)) {
    return new Error(String(error || "Unknown metrics fetch error."));
  }

  const target = `${url.protocol}//${url.host}`;
  const codes = collectNetworkErrorCodes(error);

  if (codes.includes("ECONNREFUSED")) {
    return new Error(
      `Metrics endpoint refused connection at ${target} (ECONNREFUSED). Start your web app service or set DISCORD_METRICS_URL to a reachable deployment.`
    );
  }

  if (codes.includes("ENOTFOUND") || codes.includes("EAI_AGAIN")) {
    const dnsCodes = codes.filter((code) => code === "ENOTFOUND" || code === "EAI_AGAIN");
    return new Error(
      `Metrics endpoint host lookup failed for ${target} (${dnsCodes.join(",") || "DNS_ERROR"}). Check DISCORD_METRICS_URL hostname and DNS/network.`
    );
  }

  return error;
}

export function compactNumber(value) {
  return Intl.NumberFormat("en-US").format(Number(value || 0));
}

export function toIsoTimestamp(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export function statusLabel(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return "HEALTHY";
  if (normalized === "degraded") return "DEGRADED";
  if (normalized === "down") return "DOWN";
  return "UNKNOWN";
}

export function statusIcon(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return "🟢";
  if (normalized === "degraded") return "🟠";
  if (normalized === "down") return "🔴";
  return "⚪";
}

export function statusColor(status) {
  const normalized = String(status || "unknown").toLowerCase();
  if (normalized === "healthy") return 0x2f9e44;
  if (normalized === "degraded") return 0xf08c00;
  if (normalized === "down") return 0xe03131;
  return 0x495057;
}

export function queueColor(queue) {
  const pending = Number(queue?.pending || 0);
  if (pending >= 80) return 0xe03131;
  if (pending >= 30) return 0xf08c00;
  return 0x2f9e44;
}

export function queueIcon(queue) {
  const pending = Number(queue?.pending || 0);
  if (pending >= 80) return "🚨";
  if (pending >= 30) return "⚠️";
  return "✅";
}

export function durationLabel(ms) {
  const value = Number(ms || 0);
  if (!Number.isFinite(value) || value <= 0) return "0ms";
  if (value < 1_000) return `${Math.round(value)}ms`;
  if (value < 60_000) return `${(value / 1_000).toFixed(2)}s`;
  return `${(value / 60_000).toFixed(2)}m`;
}

export function sinceLabel(timestampMs) {
  const value = Number(timestampMs || 0);
  if (!Number.isFinite(value) || value <= 0) return "never";

  const delta = Math.max(0, Date.now() - value);
  const seconds = Math.floor(delta / 1_000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function untilLabel(timestampMs) {
  const value = Number(timestampMs || 0);
  if (!Number.isFinite(value) || value <= 0) return "not scheduled";

  const delta = Math.max(0, value - Date.now());
  const seconds = Math.floor(delta / 1_000);
  if (seconds < 60) return `in ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;

  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}
