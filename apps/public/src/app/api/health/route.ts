import { apiOk } from "@/lib/api";

export async function GET() {
  return apiOk(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
      version: "1.0.0",
    },
    200
  );
}
