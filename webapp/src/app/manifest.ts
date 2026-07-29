import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Danio Cooks",
    short_name: "Danio Cooks",
    description: "Ricette tecniche, tempi chiari e cucina ragionata.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f3",
    theme_color: "#fff8f3",
    lang: "it",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}