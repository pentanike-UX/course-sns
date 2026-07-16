import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "코스 — 코스 기록·공유",
    short_name: "COS",
    description:
      "갔다 온 길과 스팟을 코스로 남겨 나눠 봐요. 사진, 이동, 기분과 테마까지.",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    // pure-white light theme (matches the app background)
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // full-bleed art doubles as the maskable variant
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
