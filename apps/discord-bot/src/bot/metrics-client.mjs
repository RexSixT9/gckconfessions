import {
  asNonRetryable,
  isRetryableHttpStatus,
  normalizeFetchNetworkError,
  parseRetryAfterMs,
  retryDelayMs,
  sleep,
  summarizeBody,
} from "./helpers.mjs";

const INTERNAL_METRICS_PATH = "/api/internal/discord-metrics";

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isLikelyHtmlResponse(contentType, bodyText) {
  const normalizedContentType = (contentType || "").toLowerCase();
  const trimmedBody = String(bodyText || "").trimStart();

  return (
    normalizedContentType.includes("text/html") ||
    trimmedBody.startsWith("<!DOCTYPE html") ||
    trimmedBody.startsWith("<html")
  );
}

function fallbackMetricsUrl(primaryUrl) {
  if (normalizePathname(primaryUrl.pathname) === INTERNAL_METRICS_PATH) {
    return null;
  }

  const fallback = new URL(primaryUrl.origin + INTERNAL_METRICS_PATH);
  fallback.search = primaryUrl.search;
  return fallback;
}

export async function fetchMetrics(config, state, days = config.defaultGraphDays) {
  const fetchStartedAt = Date.now();
  state.runtimeStats.fetch.total += 1;
  state.runtimeStats.fetch.lastAttemptAt = fetchStartedAt;

  const url = new URL(config.metricsUrl);
  url.searchParams.set("days", String(days));
  url.searchParams.set("webhookHours", String(config.webhookWindowHours));

  const fallbackUrl = fallbackMetricsUrl(url);
  const targets = fallbackUrl ? [url, fallbackUrl] : [url];

  const headers = {
    "x-discord-metrics-secret": config.metricsSecret,
    accept: "application/json",
    "user-agent": "gck-discord-bot/0.1",
  };

  if (config.vercelProtectionBypass) {
    headers["x-vercel-protection-bypass"] = config.vercelProtectionBypass;
  }

  let lastError = null;

  for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
    const targetUrl = targets[targetIndex];
    const usingFallbackTarget = targetIndex > 0;
    let switchToFallback = false;

    for (let attempt = 1; attempt <= config.metricsRetryAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.metricsTimeoutMs);

      try {
        const response = await fetch(targetUrl, {
          method: "GET",
          headers,
          cache: "no-store",
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") || "";
        const bodyText = await response.text();
        const retryAfter = response.headers.get("retry-after") || "";

        if (!response.ok) {
          const checkpointBlocked = bodyText.includes("Vercel Security Checkpoint");
          const retryAfterMs = parseRetryAfterMs(retryAfter);
          const retryPart = retryAfter ? ` retry-after=${retryAfter}.` : "";
          const endpointMismatchLikely =
            response.status === 404 && isLikelyHtmlResponse(contentType, bodyText);

          if (checkpointBlocked) {
            throw new Error(
              `Metrics fetch blocked by Vercel Security Checkpoint (${response.status}).${retryPart} Use a local URL for local testing or set VERCEL_PROTECTION_BYPASS when targeting protected Vercel deployments.`
            );
          }

          const fallbackHint =
            endpointMismatchLikely && fallbackUrl && !usingFallbackTarget
              ? ` Detected HTML 404 page; retrying once against ${fallbackUrl.origin}${fallbackUrl.pathname}.`
              : endpointMismatchLikely
                ? " Detected HTML 404 page at the metrics endpoint path; ensure the web app running on this host includes /api/internal/discord-metrics."
              : "";

          const attemptError = new Error(
            `Metrics fetch failed (${response.status}) on attempt ${attempt}/${config.metricsRetryAttempts}.${retryPart} body=${summarizeBody(bodyText)}${fallbackHint}`
          );

          if (endpointMismatchLikely && fallbackUrl && !usingFallbackTarget) {
            const fallbackError = asNonRetryable(attemptError);
            fallbackError.tryFallback = true;
            throw fallbackError;
          }

          if (!isRetryableHttpStatus(response.status) || attempt >= config.metricsRetryAttempts) {
            throw asNonRetryable(attemptError);
          }

          state.runtimeStats.fetch.retries += 1;
          const delayMs = Math.max(retryAfterMs, retryDelayMs(config.metricsRetryBaseMs, attempt));
          await sleep(delayMs);
          lastError = attemptError;
          continue;
        }

        if (!contentType.toLowerCase().includes("application/json")) {
          const checkpointLike = bodyText.includes("Vercel Security Checkpoint");
          const htmlLike = isLikelyHtmlResponse(contentType, bodyText);
          const suffix = checkpointLike ? " (looks like Vercel protection HTML)" : "";

          if (htmlLike && fallbackUrl && !usingFallbackTarget) {
            const fallbackError = asNonRetryable(
              new Error(
                `Metrics endpoint returned non-JSON content-type: ${contentType || "unknown"}; retrying once against ${fallbackUrl.origin}${fallbackUrl.pathname}.`
              )
            );
            fallbackError.tryFallback = true;
            throw fallbackError;
          }

          if (htmlLike && !fallbackUrl) {
            throw asNonRetryable(
              new Error(
                `Metrics endpoint returned non-JSON content-type: ${contentType || "unknown"}; expected JSON from /api/internal/discord-metrics on this host.`
              )
            );
          }

          throw asNonRetryable(
            new Error(`Metrics endpoint returned non-JSON content-type: ${contentType || "unknown"}${suffix}`)
          );
        }

        try {
          const parsed = JSON.parse(bodyText);
          state.runtimeStats.fetch.successes += 1;
          state.runtimeStats.fetch.consecutiveFailures = 0;
          state.runtimeStats.fetch.lastSuccessAt = Date.now();
          state.runtimeStats.fetch.lastDurationMs = Date.now() - fetchStartedAt;
          state.runtimeStats.fetch.lastError = "";
          return parsed;
        } catch {
          throw asNonRetryable(new Error("Metrics endpoint response was not valid JSON."));
        }
      } catch (error) {
        const timedOut = error instanceof Error && error.name === "AbortError";
        const attemptError = timedOut
          ? new Error(
              `Metrics fetch timed out after ${config.metricsTimeoutMs}ms (attempt ${attempt}/${config.metricsRetryAttempts}).`
            )
          : error && typeof error === "object" && error.nonRetryable === true
            ? error
            : normalizeFetchNetworkError(error, targetUrl);

        const shouldTryFallback =
          Boolean(fallbackUrl) &&
          !usingFallbackTarget &&
          attemptError &&
          typeof attemptError === "object" &&
          attemptError.tryFallback === true;

        if (shouldTryFallback) {
          lastError = attemptError;
          switchToFallback = true;
          break;
        }

        lastError = attemptError;

        const shouldRetry =
          attempt < config.metricsRetryAttempts &&
          !(attemptError && typeof attemptError === "object" && attemptError.nonRetryable === true) &&
          !String(attemptError instanceof Error ? attemptError.message : "").includes(
            "Vercel Security Checkpoint"
          );

        if (!shouldRetry) {
          state.runtimeStats.fetch.failures += 1;
          state.runtimeStats.fetch.consecutiveFailures += 1;
          state.runtimeStats.fetch.lastFailureAt = Date.now();
          state.runtimeStats.fetch.lastDurationMs = Date.now() - fetchStartedAt;
          state.runtimeStats.fetch.lastError = String(
            attemptError instanceof Error ? attemptError.message : attemptError || "unknown"
          ).slice(0, 220);
          throw attemptError;
        }

        state.runtimeStats.fetch.retries += 1;
        await sleep(retryDelayMs(config.metricsRetryBaseMs, attempt));
      } finally {
        clearTimeout(timeout);
      }
    }

    if (switchToFallback) {
      continue;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Metrics fetch failed after retries.");
}
