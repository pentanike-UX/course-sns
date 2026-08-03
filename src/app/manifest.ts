import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "coursee — 따라갈 수 있는 이동 코스",
    short_name: "coursee",
    description:
      "다녀온 길과 스팟을 코스로 기록하고 공유하세요. 사진, 이동, 감정과 테마까지 — 나만의 코스.",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
