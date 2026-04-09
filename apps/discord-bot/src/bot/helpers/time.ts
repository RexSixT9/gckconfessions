export function toIsoTimestamp(value: unknown): string {
  const normalizedValue =
    value instanceof Date || typeof value === "string" || typeof value === "number"
      ? value
      : Date.now();
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export function sinceLabel(timestampMs: unknown): string {
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

export function untilLabel(timestampMs: unknown): string {
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
