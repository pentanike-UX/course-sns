"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackNavigation } from "@/lib/nav-history";

/** mounted once in the root layout — records in-app navigations for BackButton */
export default function NavHistoryTracker() {
  const pathname = usePathname();
  useEffect(() => {
    trackNavigation();
  }, [pathname]);
  return null;
}
