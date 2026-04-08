import { connectToDatabase } from "@/lib/mongodb";
import { apiError, apiOk, safeLogError } from "@/lib/api";
import { safeCompare } from "@/lib/requestUtils";
import { checkInternalBotReadLimit, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";
import AuditLog from "@/models/AuditLog";
import Confession from "@/models/Confession";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
type ChannelKey = "audit_discord" | "security_webhook" | "security_email";

type DailySeriesPoint = {
  day: string;
  submissions: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
};

type WebhookChannelHealth = {
  attempts: number;
  successes: number;
  failures: number;
  successRate: number | null;
  status: HealthStatus;
  lastDeliveredAt: string;
  lastFailedAt: string;
};

type WebhookHealthSnapshot = {
  windowHours: number;
  overallStatus: HealthStatus;
  channels: Record<ChannelKey, WebhookChannelHealth>;
};

type ActionBucket = {
  _id: string;
  count: number;
  lastAt: Date;
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

function resolveStatus(successes: number, failures: number): HealthStatus {
  const attempts = successes + failures;
  if (attempts === 0) return "unknown";
  if (successes === 0) return "down";
  if (failures === 0) return "healthy";

  const failureRate = failures / attempts;
  return failureRate > 0.2 ? "degraded" : "healthy";
}

function canAccessInternalMetrics(request: Request) {
  const expected = process.env.DISCORD_METRICS_SECRET?.trim();
  if (!expected) return { ok: false, misconfigured: true };

  const provided = request.headers.get("x-discord-metrics-secret")?.trim();
  if (!provided) return { ok: false, misconfigured: false };

  return {
    ok: safeCompare(provided, expected),
    misconfigured: false,
  };
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildEmptyDailySeries(days: number) {
  const endDay = startOfUtcDay(new Date());
  const startDay = new Date(endDay);
  startDay.setUTCDate(startDay.getUTCDate() - (days - 1));

  const series: DailySeriesPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDay);
    date.setUTCDate(startDay.getUTCDate() + i);
    series.push({
      day: dayKey(date),
      submissions: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      published: 0,
    });
  }

  return series;
}

function buildUnknownWebhookHealth(windowHours: number): WebhookHealthSnapshot {
  return {
    windowHours,
    overallStatus: "unknown" as HealthStatus,
    channels: {
      audit_discord: {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: null,
        status: "unknown" as HealthStatus,
        lastDeliveredAt: "",
        lastFailedAt: "",
      },
      security_webhook: {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: null,
        status: "unknown" as HealthStatus,
        lastDeliveredAt: "",
        lastFailedAt: "",
      },
      security_email: {
        attempts: 0,
        successes: 0,
        failures: 0,
        successRate: null,
        status: "unknown" as HealthStatus,
        lastDeliveredAt: "",
        lastFailedAt: "",
      },
    },
  };
}

async function getQueueSnapshot() {
  const [pending, approved, rejected, published] = await Promise.all([
    Confession.countDocuments({ status: "pending" }),
    Confession.countDocuments({ status: "approved" }),
    Confession.countDocuments({ status: "rejected" }),
    Confession.countDocuments({ posted: true }),
  ]);

  return {
    pending,
    approved,
    rejected,
    published,
    total: pending + approved + rejected,
  };
}

async function getDailySeries(days: number) {
  const endDay = startOfUtcDay(new Date());
  const startDay = new Date(endDay);
  startDay.setUTCDate(startDay.getUTCDate() - (days - 1));

  const aggregated = await Confession.aggregate<DailySeriesPoint>([
    {
      $match: {
        createdAt: { $gte: startDay },
      },
    },
    {
      $project: {
        day: {
          $dateToString: {
            date: "$createdAt",
            format: "%Y-%m-%d",
            timezone: "UTC",
          },
        },
        status: 1,
        posted: 1,
      },
    },
    {
      $group: {
        _id: "$day",
        submissions: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
          },
        },
        approved: {
          $sum: {
            $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
          },
        },
        rejected: {
          $sum: {
            $cond: [{ $eq: ["$status", "rejected"] }, 1, 0],
          },
        },
        published: {
          $sum: {
            $cond: [{ $eq: ["$posted", true] }, 1, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        day: "$_id",
        submissions: 1,
        pending: 1,
        approved: 1,
        rejected: 1,
        published: 1,
      },
    },
  ]);

  const byDay = new Map(aggregated.map((entry) => [entry.day, entry]));
  const series: DailySeriesPoint[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDay);
    date.setUTCDate(startDay.getUTCDate() + i);
    const key = dayKey(date);
    const existing = byDay.get(key);

    series.push(
      existing ?? {
        day: key,
        submissions: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        published: 0,
      }
    );
  }

  return series;
}

async function getWebhookHealthSnapshot(hours: number) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const counts = await AuditLog.aggregate<ActionBucket>([
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
  ]);

  const channels: Record<ChannelKey, WebhookChannelHealth> = {
    audit_discord: {
      attempts: 0,
      successes: 0,
      failures: 0,
      successRate: null,
      status: "unknown",
      lastDeliveredAt: "",
      lastFailedAt: "",
    },
    security_webhook: {
      attempts: 0,
      successes: 0,
      failures: 0,
      successRate: null,
      status: "unknown",
      lastDeliveredAt: "",
      lastFailedAt: "",
    },
    security_email: {
      attempts: 0,
      successes: 0,
      failures: 0,
      successRate: null,
      status: "unknown",
      lastDeliveredAt: "",
      lastFailedAt: "",
    },
  };

  for (const bucket of counts) {
    if (!isDeliveryAction(bucket._id)) continue;

    const channel = ACTION_CHANNEL_MAP[bucket._id];
    const isSuccess = bucket._id.endsWith("_delivered");
    channels[channel].attempts += bucket.count;

    if (isSuccess) {
      channels[channel].successes += bucket.count;
      channels[channel].lastDeliveredAt = toIso(bucket.lastAt);
    } else {
      channels[channel].failures += bucket.count;
      channels[channel].lastFailedAt = toIso(bucket.lastAt);
    }
  }

  for (const channel of Object.keys(channels) as ChannelKey[]) {
    const item = channels[channel];
    item.successRate = item.attempts > 0 ? Number((item.successes / item.attempts).toFixed(4)) : null;
    item.status = resolveStatus(item.successes, item.failures);
  }

  const statuses = Object.values(channels).map((entry) => entry.status);
  const overallStatus: HealthStatus = statuses.includes("down")
    ? "down"
    : statuses.includes("degraded")
      ? "degraded"
      : statuses.every((status) => status === "unknown")
        ? "unknown"
        : "healthy";

  return {
    windowHours: hours,
    overallStatus,
    channels,
  };
}

export async function GET(request: Request) {
  try {
    const access = canAccessInternalMetrics(request);
    if (access.misconfigured) {
      return apiError(503, "SERVICE_UNAVAILABLE", "Discord metrics access is not configured.", {
        "Cache-Control": "no-store",
      });
    }

    if (!access.ok) {
      return apiError(401, "UNAUTHORIZED", "Unauthorized", {
        "Cache-Control": "no-store",
      });
    }

    const rate = await checkInternalBotReadLimit(`discord-metrics:${getClientIp(request)}`);
    if (!rate.allowed) {
      return apiError(429, "RATE_LIMIT", "Too many requests. Try again later.", {
        ...getRateLimitHeaders(rate),
        "Cache-Control": "no-store",
      });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = parseBoundedInt(searchParams.get("days"), 7, 1, 90);
    if (!daysParam.ok) {
      return apiError(400, "VALIDATION_ERROR", "Invalid days query parameter.", {
        "Cache-Control": "no-store",
      });
    }

    const webhookHoursParam = parseBoundedInt(searchParams.get("webhookHours"), 24, 1, 168);
    if (!webhookHoursParam.ok) {
      return apiError(400, "VALIDATION_ERROR", "Invalid webhookHours query parameter.", {
        "Cache-Control": "no-store",
      });
    }

    const issues: string[] = [];

    const defaultQueue = {
      pending: 0,
      approved: 0,
      rejected: 0,
      published: 0,
      total: 0,
    };

    let queue = defaultQueue;
    let daily = buildEmptyDailySeries(daysParam.value);
    let webhookHealth = buildUnknownWebhookHealth(webhookHoursParam.value);
    let databaseStatus: "up" | "down" = "up";

    try {
      await connectToDatabase();
    } catch (error) {
      databaseStatus = "down";
      issues.push("database_unavailable");
      safeLogError("Discord metrics database connect failed", error);
    }

    if (databaseStatus === "up") {
      const [queueResult, dailyResult, webhookResult] = await Promise.allSettled([
        getQueueSnapshot(),
        getDailySeries(daysParam.value),
        getWebhookHealthSnapshot(webhookHoursParam.value),
      ]);

      if (queueResult.status === "fulfilled") {
        queue = queueResult.value;
      } else {
        issues.push("queue_snapshot_unavailable");
        safeLogError("Discord metrics queue snapshot failed", queueResult.reason);
      }

      if (dailyResult.status === "fulfilled") {
        daily = dailyResult.value;
      } else {
        issues.push("daily_series_unavailable");
        safeLogError("Discord metrics daily series failed", dailyResult.reason);
      }

      if (webhookResult.status === "fulfilled") {
        webhookHealth = webhookResult.value;
      } else {
        issues.push("webhook_health_unavailable");
        safeLogError("Discord metrics webhook health failed", webhookResult.reason);
      }
    }

    const overallStatus: Exclude<HealthStatus, "unknown"> | "unknown" =
      databaseStatus === "down"
        ? "down"
        : issues.length >= 2
          ? "down"
          : issues.length > 0 || webhookHealth.overallStatus === "degraded" || webhookHealth.overallStatus === "down"
            ? "degraded"
            : "healthy";

    return apiOk(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        health: {
          overallStatus,
          api: {
            status: databaseStatus === "up" ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            environment: process.env.NODE_ENV || "unknown",
            version: process.env.APP_VERSION || "1.0.0",
          },
          database: {
            status: databaseStatus,
          },
          issues,
        },
        windows: {
          days: daysParam.value,
          webhookHours: webhookHoursParam.value,
        },
        queue,
        daily,
        webhookHealth,
      },
      200,
      {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "x-discord-metrics-secret",
      }
    );
  } catch (error) {
    safeLogError("Discord internal metrics error", error);
    return apiError(500, "SERVER_ERROR", "Failed to load Discord metrics.", {
      "Cache-Control": "no-store",
    });
  }
}
