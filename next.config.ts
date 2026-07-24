import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // course-sns (현재)
      {
        protocol: "https",
        hostname: "pbyxnvtgsrwmsvxnynif.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // 레거시/포크 이관 데이터 (routdiary)
      {
        protocol: "https",
        hostname: "aqafgebedvuixonfuaqm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // 다른 Supabase 프로젝트로 이전해도 깨지지 않게
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
