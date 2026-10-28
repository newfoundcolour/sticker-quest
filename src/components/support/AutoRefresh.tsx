"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { THREAD_POLL_MS } from "@/lib/supportLabels";

/**
 * Keeps an open thread fresh by re-fetching the page every few seconds while
 * the tab is visible (no websockets yet). Typed-but-unsent replies survive,
 * because a refresh keeps client component state.
 */
export function AutoRefresh({ intervalMs = THREAD_POLL_MS }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);

  return null;
}
