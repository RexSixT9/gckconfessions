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
    theme_color: "#c02051",
    orientation: "portrait",
    categories: ["education", "social", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
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
