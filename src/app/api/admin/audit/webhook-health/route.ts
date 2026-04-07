import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminTokenSafe } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { apiAuthError, apiError, apiOk, safeLogError } from "@/lib/api";
import { checkAdminReadLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import AuditLog from "@/models/AuditLog";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
type ChannelKey = "audit_discord" | "security_webhook" | "security_email";

type ActionBucket = {
  _id: string;
  count: number;
  lastAt: Date;
};

type LogDoc = {
  action: string;
  requestId: string;
  createdAt: Date;
  adminEmail: string;
};

const DELIVERY_ACTIONS = [
  "audit_webhook_delivered",
  "audit_webhook_failed",
  "security_alert_webhook_delivered",
  "security_alert_webhook_failed",
  "security_alert_email_delivered",
  "security_alert_email_failed",
] as const;

const ACTION_CHANNEL_MAP: Record<(typeof DELIVERY_ACTIONS)[number], ChannelKey> = {
  audit_webhook_delivered: "audit_discord",
  audit_webhook_failed: "audit_discord",
  security_alert_webhook_delivered: "security_webhook",
  security_alert_webhook_failed: "security_webhook",
  security_alert_email_delivered: "security_email",
  security_alert_email_failed: "security_email",
};

function isDeliveryAction(value: string): value is (typeof DELIVERY_ACTIONS)[number] {
  return (DELIVERY_ACTIONS as readonly string[]).includes(value);
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function quantile(sortedValues: number[], p: number) {
  if (sortedValues.length === 0) return null;
  const index = Math.max(0, Math.min(sortedValues.length - 1, Math.ceil(p * sortedValues.length) - 1));
  return Math.round(sortedValues[index]);
}

function resolveStatus(successes: number, failures: number): HealthStatus {
  const attempts = successes + failures;
  if (attempts === 0) return "unknown";
  if (successes === 0) return "down";
  if (failures === 0) return "healthy";
  const failureRate = failures / attempts;
  return failureRate > 0.2 ? "degraded" : "healthy";
}

function parseBoundedInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): { ok: true; value: number } | { ok: false } {
  if (!value || value.trim() === "") {
    return { ok: true, value: fallback };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return { ok: false };
  }

  return { ok: true, value: Math.max(min, Math.min(max, parsed)) };
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const auth = await verifyAdminTokenSafe(token);
    if (!auth.ok) return apiAuthError(auth.reason);

    const rate = await checkAdminReadLimit(`audit-webhook-health:${getClientIp(request)}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", getRateLimitHeaders(rate));
    }

    const { searchParams } = new URL(request.url);
    const hoursParam = parseBoundedInt(searchParams.get("hours"), 24, 1, 168);
    if (!hoursParam.ok) {
      return apiError(400, "VALIDATION_ERROR", "Invalid hours query parameter.");
    }

    const windowHours = hoursParam.value;
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    await connectToDatabase();

    const [counts, baseEvents, deliveryEvents, recentFailures] = await Promise.all([
      AuditLog.aggregate<ActionBucket>([
        {
          $match: {
            createdAt: { $gte: since },
            action: { $in: [...DELIVERY_ACTIONS] },
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
            lastAt: { $max: "$createdAt" },
          },
        },
      ]),
      AuditLog.find({
        createdAt: { $gte: since },
        action: { $nin: [...DELIVERY_ACTIONS] },
        requestId: { $ne: "" },
      })
        .sort({ createdAt: -1 })
        .limit(500)
        .select("requestId createdAt")
        .lean<Pick<LogDoc, "requestId" | "createdAt">[]>(),
      AuditLog.find({
        createdAt: { $gte: since },
        action: { $in: [...DELIVERY_ACTIONS] },
        requestId: { $ne: "" },
      })
        .sort({ createdAt: 1 })
        .limit(2000)
        .select("requestId createdAt action")
        .lean<Pick<LogDoc, "requestId" | "createdAt" | "action">[]>(),
      AuditLog.find({
        createdAt: { $gte: since },
        action: {
          $in: ["audit_webhook_failed", "security_alert_webhook_failed", "security_alert_email_failed"],
        },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("action createdAt requestId adminEmail")
        .lean<LogDoc[]>(),
    ]);

    const summary: Record<
      ChannelKey,
      {
        attempts: number;
        successes: number;
        failures: number;
        successRate: number | null;
        status: HealthStatus;
        lastDeliveredAt: string;
        lastFailedAt: string;
        latencyMs: {
          p50: number | null;
          p95: number | null;
          max: number | null;
          samples: number;
        };
      }
    > = {
      audit_discord: {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: null,
        status: "unknown",
        lastDeliveredAt: "",
        lastFailedAt: "",
        latencyMs: { p50: null, p95: null, max: null, samples: 0 },
      },
      security_webhook: {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: null,
        status: "unknown",
        lastDeliveredAt: "",
        lastFailedAt: "",
        latencyMs: { p50: null, p95: null, max: null, samples: 0 },
      },
      security_email: {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: null,
        status: "unknown",
        lastDeliveredAt: "",
        lastFailedAt: "",
        latencyMs: { p50: null, p95: null, max: null, samples: 0 },
      },
    };

    for (const bucket of counts) {
      if (!isDeliveryAction(bucket._id)) continue;
      const channel = ACTION_CHANNEL_MAP[bucket._id];
      const isSuccess = bucket._id.endsWith("_delivered");
      summary[channel].attempts += bucket.count;
      if (isSuccess) {
        summary[channel].successes += bucket.count;
        summary[channel].lastDeliveredAt = toIso(bucket.lastAt);
      } else {
        summary[channel].failures += bucket.count;
        summary[channel].lastFailedAt = toIso(bucket.lastAt);
      }
    }

    const firstBaseByRequest = new Map<string, Date>();
    for (const event of baseEvents) {
      const current = firstBaseByRequest.get(event.requestId);
      if (!current || event.createdAt < current) {
        firstBaseByRequest.set(event.requestId, event.createdAt);
      }
    }

    const firstDeliveryByRequestChannel = new Map<string, Date>();
    for (const event of deliveryEvents) {
      if (!isDeliveryAction(event.action)) continue;
      const channel = ACTION_CHANNEL_MAP[event.action];
      const key = `${event.requestId}:${channel}`;
      if (!firstDeliveryByRequestChannel.has(key)) {
        firstDeliveryByRequestChannel.set(key, event.createdAt);
      }
    }

    const latencyByChannel: Record<ChannelKey, number[]> = {
      audit_discord: [],
      security_webhook: [],
      security_email: [],
    };

    for (const [requestId, baseAt] of firstBaseByRequest.entries()) {
      for (const channel of Object.keys(latencyByChannel) as ChannelKey[]) {
        const key = `${requestId}:${channel}`;
        const deliveryAt = firstDeliveryByRequestChannel.get(key);
        if (!deliveryAt || deliveryAt < baseAt) continue;
        const latency = deliveryAt.getTime() - baseAt.getTime();
        if (latency >= 0 && latency <= windowHours * 60 * 60 * 1000) {
          latencyByChannel[channel].push(latency);
        }
      }
    }

    for (const channel of Object.keys(summary) as ChannelKey[]) {
      const item = summary[channel];
      item.successRate = item.attempts > 0 ? Number((item.successes / item.attempts).toFixed(4)) : null;
      item.status = resolveStatus(item.successes, item.failures);

      const sorted = latencyByChannel[channel].sort((a, b) => a - b);
      item.latencyMs = {
        p50: quantile(sorted, 0.5),
        p95: quantile(sorted, 0.95),
        max: sorted.length > 0 ? sorted[sorted.length - 1] : null,
        samples: sorted.length,
      };
    }

    const channelStatuses = Object.values(summary).map((entry) => entry.status);
    const overallStatus: HealthStatus = channelStatuses.includes("down")
      ? "down"
      : channelStatuses.includes("degraded")
        ? "degraded"
        : channelStatuses.every((status) => status === "unknown")
          ? "unknown"
          : "healthy";

    return apiOk(
      {
        generatedAt: new Date().toISOString(),
        windowHours,
        overallStatus,
        channels: summary,
        recentFailures: recentFailures.map((entry) => ({
          channel: isDeliveryAction(entry.action) ? ACTION_CHANNEL_MAP[entry.action] : "audit_discord",
          action: entry.action,
          at: toIso(entry.createdAt),
          requestId: entry.requestId,
          adminEmail: entry.adminEmail || "",
        })),
      },
      200,
      { "Cache-Control": "private, no-store, max-age=0" }
    );
  } catch (error) {
    safeLogError("Audit webhook health error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load webhook health.");
  }
}
