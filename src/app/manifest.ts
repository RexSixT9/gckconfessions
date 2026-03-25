import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GCK Confessions",
    short_name: "GCK",
    description: "An anonymous student space for sharing real thoughts safely.",
    start_url: "/",
    scope: "/",
    lang: "en",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#333333",
    orientation: "portrait",
    categories: ["education", "social", "lifestyle"],
    icons: [
      {
        src: "/next.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Share a confession",
        short_name: "Share",
        description: "Open the confession form",
        url: "/submit",
      },
      {
        name: "Community rules",
        short_name: "Rules",
        description: "Read privacy and posting guidelines",
        url: "/guidelines",
      },
    ],
  };
}
