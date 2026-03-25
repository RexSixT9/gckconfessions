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
        src: "icons/icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "icons/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
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
