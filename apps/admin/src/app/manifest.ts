import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GCK Confessions",
    short_name: "GCK",
    description: "Anonymous confessions for students.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c02051",
    orientation: "portrait",
    icons: [
      {
        src: "/next.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
