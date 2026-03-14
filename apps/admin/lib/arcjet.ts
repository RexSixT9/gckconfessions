import arcjet, { detectBot, slidingWindow, shield } from "@arcjet/next";

const ARCJET_KEY = process.env.ARCJET_KEY ?? "";

if (!ARCJET_KEY) {
  throw new Error("ARCJET_KEY is not set in environment variables.");
}

export const aj = arcjet({
  key: ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({ allow: ["CATEGORY:SEARCH_ENGINE"] }),
    // Global backstop — set high so that per-route rate limiters in
    // rateLimit.ts are the primary defense. This only catches extreme abuse
    // (e.g. automated tooling hammering every endpoint at once).
    slidingWindow({
      characteristics: ["ip.src"],
      interval: "10m",
      max: 30,
    }),
  ],
});
