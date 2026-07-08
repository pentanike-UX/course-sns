import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import NavHistoryTracker from "@/components/NavHistoryTracker";
import AppSplash from "@/components/AppSplash";
import AuthGateProvider from "@/components/AuthGate";
import { getAuthUser } from "@/lib/supabase/auth";
import "./globals.css";

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  // Real Korean fallbacks so that while a unicode-range chunk streams in (or on a
  // weight the device drops), Hangul renders in a proper Korean face instead of a
  // latin one. adjustFontFallback:false disables next/font's *latin*-metric
  // synthetic fallback, whose ascent/descent override squashes & clips Hangul
  // (top/bottom cut) on Android during the swap — the main "글자 깨짐" cause.
  fallback: ["Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", "sans-serif"],
  adjustFontFallback: false,
});

const SITE_DESCRIPTION =
  "다녀온 길과 스팟을 코스로 기록하고 공유하세요. 사진, 이동, 감정과 테마까지 — 나만의 코스.";

export const metadata: Metadata = {
  // absolute base for OG/Twitter image URLs (set NEXT_PUBLIC_SITE_URL in prod)
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  title: "코스 — 코스 기록·공유",
  description: SITE_DESCRIPTION,
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  // default share card: the app/opengraph-image.png (white bg + centered mark)
  // is picked up by the file convention; route pages override images with cover
  openGraph: {
    type: "website",
    siteName: "코스",
    title: "코스 — 코스 기록·공유",
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "코스 — 코스 기록·공유",
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: "코스",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // matches the pure-white light background (and manifest theme_color)
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // no maximumScale: let users pinch-zoom (a11y) — also a coping path for small
  // Korean text on lower-DPI Android. viewport-fit=cover keeps the edge-to-edge
  // layout that the safe-area handling depends on.
  viewportFit: "cover",
};

// Runs before paint to set the theme class — avoids a light/dark flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Drives the app-wide login gate: guests browse freely, write actions prompt.
  const isAuthed = !!(await getAuthUser());
  return (
    <html lang="ko" className={`${notoKr.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <NavHistoryTracker />
        <AuthGateProvider isAuthed={isAuthed}>{children}</AuthGateProvider>
        {/* Brand splash mounted at the ROOT so it appears once on a cold document
            load and never again — the root layout is never unmounted by client
            navigation, so returning to a tab from a detail page no longer reflashes
            it. In-app screen loading is handled by per-route loading.tsx skeletons. */}
        <AppSplash />
      </body>
    </html>
  );
}
