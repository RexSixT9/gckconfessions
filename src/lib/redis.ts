import Redis from "ioredis";
import { safeLogError } from "@/lib/api";

let redisClient: Redis | null = null;
let redisInitAttempted = false;

export function getRedisClient() {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) return null;

  if (redisClient) return redisClient;
  if (redisInitAttempted) return null;

  redisInitAttempted = true;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      enableOfflineQueue: false,
    });

    redisClient.on("error", (error) => {
      safeLogError("Redis client error", error);
    });

    return redisClient;
  } catch (error) {
    safeLogError("Redis init error", error);
    redisClient = null;
    return null;
  }
}
