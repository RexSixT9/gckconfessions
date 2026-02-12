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
    slidingWindow({
      characteristics: ["ip.src"],
      interval: "10m",
      max: 5,
    }),
  ],
});
