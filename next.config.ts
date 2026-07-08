import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React <ViewTransition> integration — morph the route cover from the card
  // into the detail hero on navigation.
  experimental: {
    viewTransition: true,
    // Reuse fetched page segments from the client Router Cache within a session
    // (cleared on a full refresh), so tab switches / route-detail back-nav are
    // instant after the first load. Prefetched tabs use `static`; other dynamic
    // pages (e.g. route detail) use `dynamic`. Mutations still revalidate paths.
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
  },
  images: {
    remotePatterns: [
      // placeholder photos used by seed/demo data
      { protocol: "https", hostname: "picsum.photos" },
      // Supabase Storage (route-photos bucket)
      { protocol: "https", hostname: "aqafgebedvuixonfuaqm.supabase.co" },
    ],
  },
};

export default nextConfig;
