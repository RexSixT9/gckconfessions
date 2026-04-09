function normalizeHealthStatus(status: unknown): "healthy" | "degraded" | "down" | "unknown" {
  const normalized = String(status || "unknown").toLowerCase();

  if (["healthy", "ok", "up", "connected", "pass", "online"].includes(normalized)) {
    return "healthy";
  }

  if (["degraded", "warn", "warning", "partial", "limited"].includes(normalized)) {
    return "degraded";
  }

  if (["down", "error", "failed", "unhealthy", "disconnected", "offline"].includes(normalized)) {
    return "down";
  }

  return "unknown";
}

export function statusLabel(status: unknown): string {
  const normalized = normalizeHealthStatus(status);
  if (normalized === "healthy") return "HEALTHY";
  if (normalized === "degraded") return "DEGRADED";
  if (normalized === "down") return "DOWN";
  return "UNKNOWN";
}

export function statusIcon(status: unknown): string {
  const normalized = normalizeHealthStatus(status);
  if (normalized === "healthy") return "🟢";
  if (normalized === "degraded") return "🟠";
  if (normalized === "down") return "🔴";
  return "⚪";
}

export function statusColor(status: unknown): number {
  const normalized = normalizeHealthStatus(status);
  if (normalized === "healthy") return 0x2f9e44;
  if (normalized === "degraded") return 0xf08c00;
  if (normalized === "down") return 0xe03131;
  return 0x495057;
}

export function queueColor(queue: any): number {
  const pending = Number(queue?.pending || 0);
  if (pending >= 80) return 0xe03131;
  if (pending >= 30) return 0xf08c00;
  return 0x2f9e44;
}

export function queueIcon(queue: any): string {
  const pending = Number(queue?.pending || 0);
  if (pending >= 80) return "🚨";
  if (pending >= 30) return "⚠️";
  return "✅";
}
