export function compactNumber(value: unknown): string {
  return Intl.NumberFormat("en-US").format(Number(value || 0));
}

export function durationLabel(ms: unknown): string {
  const value = Number(ms || 0);
  if (!Number.isFinite(value) || value <= 0) return "0ms";
  if (value < 1_000) return `${Math.round(value)}ms`;
  if (value < 60_000) return `${(value / 1_000).toFixed(2)}s`;
  return `${(value / 60_000).toFixed(2)}m`;
}
