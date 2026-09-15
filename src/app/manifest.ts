import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WELL",
    short_name: "WELL",
    description:
      "Caderno de hábitos: alimentação com IA, movimento, diário e metas — estimativas, não dietas.",
    start_url: "/hoje",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0A9396",
    theme_color: "#005F73",
    lang: "pt-BR",
    categories: ["health", "lifestyle", "fitness"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon_4.png",
        sizes: "1350x1350",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
