"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logEvent } from "@/lib/actions/analytics.actions";

const AnalyticsProvider = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Log page view on route change
    logEvent('page_view', pathname);
  }, [pathname]);

  return null;
};

export default AnalyticsProvider;
