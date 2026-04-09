export function summarizeBody(body: unknown): string {
  return String(body || "").replace(/\s+/g, " ").slice(0, 260);
}

export function collectNetworkErrorCodes(error: any, seen = new Set<object>()): string[] {
  if (!error || typeof error !== "object" || seen.has(error)) {
    return [];
  }

  seen.add(error);
  const codes: string[] = [];

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

export function normalizeFetchNetworkError(error: unknown, url: URL): Error {
  if (!(error instanceof Error)) {
    return new Error(String(error || "Unknown metrics fetch error."));
  }

  const target = `${url.protocol}//${url.host}`;
  const codes = collectNetworkErrorCodes(error as any);

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
