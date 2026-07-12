import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA: permite instalar la app en el móvil desde el navegador.
 * Es el paso previo a empaquetarla como app nativa de iOS/Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Método Híbrido",
    short_name: "Híbrido",
    description:
      "Running, CrossFit, Hyrox y DEKA en un único plan. Calendario, cargas, skills y carga muscular semanal.",
    start_url: "/hoy",
    display: "standalone",
    background_color: "#08080a",
    theme_color: "#08080a",
    orientation: "portrait",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
